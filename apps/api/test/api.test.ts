import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { Kernel, emptySyncState, makeProfile, makeMember, hm, syncOnce } from '@eatos/core';
import type { SyncRequest, SyncResponse } from '@eatos/core';
import { createApi } from '../src/server';

const DAY0 = Date.UTC(2026, 9, 4);
const T = (s: string) => DAY0 + hm(s) * 60_000;

let dir: string;
let server: Server;
let base: string;

async function start(clock = () => T('16:00'), extra: { dataKey?: string; kdf?: { N: number; r: number; p: number } } = {}) {
  server = createApi({ dataDir: dir, clock, ...extra });
  await new Promise<void>((r) => server.listen(0, r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

async function call(method: string, path: string, body?: unknown, user = 'me') {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', 'x-user-id': user },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as any };
}

const profile = makeProfile({
  members: [makeMember({ id: 'me', name: 'You' }), makeMember({ id: 'kid', name: 'Kid', allergens: ['nuts'] })],
});

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'eatos-api-'));
  await start();
});

afterEach(async () => {
  await new Promise((r) => server.close(r));
  rmSync(dir, { recursive: true, force: true });
});

describe('EatOS API', () => {
  it('reports liveness', async () => {
    expect((await call('GET', '/')).body.ok).toBe(true);
  });

  it('accepts single and batched events and rejects unknown types', async () => {
    expect((await call('POST', '/v1/events', { type: 'profile.set', at: DAY0, profile })).status).toBe(201);
    const batch = await call('POST', '/v1/events', [{ type: 'water.logged', ml: 500 }, { type: 'water.logged', ml: 250, at: T('10:00') }]);
    expect(batch.body.accepted).toHaveLength(2);
    expect(batch.body.accepted[0].at).toBe(T('16:00'));
    expect((await call('POST', '/v1/events', { type: 'hack' })).status).toBe(400);
    expect((await call('POST', '/v1/events', { type: 'water.logged', at: 'soon' })).status).toBe(400);
  });

  it('serves now, schedule, health, next and log', async () => {
    await call('POST', '/v1/events', [
      { type: 'profile.set', at: DAY0, profile },
      { type: 'calendar.busy', at: T('15:00'), start: T('18:00'), end: T('19:00'), title: 'Meeting' },
    ]);
    const now = await call('GET', '/v1/now');
    expect(now.body.nextMeal.slot).toBe('snack');
    const schedule = await call('GET', '/v1/schedule');
    expect(schedule.body.tasks.find((t: any) => t.id === 'meal:dinner').movedFrom).toBe(T('18:30'));
    const health = await call('GET', '/v1/health');
    expect(health.body.checks).toHaveLength(4);
    expect(health.body.targets.waterMl).toBeGreaterThan(0);
    expect((await call('GET', '/v1/next')).body.task).toBeTruthy();
    expect((await call('GET', '/v1/log')).body.lines[0].source).toBe('Calendar');
  });

  it('answers ask and recommend without breaking allergies', async () => {
    await call('POST', '/v1/events', { type: 'profile.set', at: DAY0, profile });
    const ask = await call('POST', '/v1/ask', { text: 'something warm for dinner in 20 minutes' });
    expect(ask.body.results).toHaveLength(3);
    for (const r of ask.body.results) expect(r.food.allergens).not.toContain('nuts');
    expect((await call('POST', '/v1/ask', {})).status).toBe(400);
    const rec = await call('POST', '/v1/recommend', { slot: 'snack', k: 2 });
    expect(rec.body.results).toHaveLength(2);
  });

  it('answers wishes and taste cards, and rejects bad input', async () => {
    await call('POST', '/v1/events', { type: 'profile.set', at: DAY0, profile });
    const w = await call('POST', '/v1/wish', { text: 'pesto pasta' });
    expect(w.status).toBe(200);
    expect(w.body.blockers.length).toBeGreaterThan(0);
    for (const rung of w.body.ladder) for (const f of rung.foods) expect(f.allergens).not.toContain('nuts');
    expect((await call('POST', '/v1/wish', {})).status).toBe(400);
    expect((await call('POST', '/v1/wish', { text: 'x'.repeat(500) })).status).toBe(400);
    const cards = await call('GET', '/v1/taste-cards');
    expect(cards.body.foods.length).toBe(8);
    for (const f of cards.body.foods) expect(f.allergens).not.toContain('nuts');
  });

  it('resolves household conflicts', async () => {
    await call('POST', '/v1/events', { type: 'profile.set', at: DAY0, profile });
    expect((await call('GET', '/v1/resolve?food=pesto-pasta')).body.chosen.id).toBe('basil-pasta-nut-free');
    expect((await call('GET', '/v1/resolve?food=nope')).status).toBe(404);
  });

  it('runs housekeeping and serves pantry and week', async () => {
    await call('POST', '/v1/events', [
      { type: 'profile.set', at: DAY0, profile },
      { type: 'pantry.added', at: DAY0, item: { id: 'milk', name: 'milk', qty: 1, unit: 'l', location: 'fridge', addedAt: DAY0, expiresAt: T('09:00') } },
    ]);
    const hk = await call('POST', '/v1/housekeeping');
    expect(hk.body.expired).toHaveLength(1);
    expect((await call('GET', '/v1/pantry')).body.items).toHaveLength(0);
    const week = await call('GET', '/v1/week');
    expect(week.body.plan.meals.length).toBeGreaterThan(20);
  });

  it('persists per user and rebuilds state after a restart', async () => {
    await call('POST', '/v1/events', { type: 'profile.set', at: DAY0, profile }, 'alice');
    await call('POST', '/v1/events', { type: 'water.logged', at: T('09:00'), ml: 400 }, 'alice');
    expect(existsSync(join(dir, 'alice.json'))).toBe(true);
    await new Promise((r) => server.close(r));
    await start();
    expect((await call('GET', '/v1/events', undefined, 'alice')).body.events).toHaveLength(2);
    expect((await call('GET', '/v1/events', undefined, 'bob')).body.events).toHaveLength(0);
  });

  it('rejects bad user ids, bad JSON and unknown routes', async () => {
    expect((await call('GET', '/v1/now', undefined, '../etc')).status).toBe(400);
    const res = await fetch(base + '/v1/events', { method: 'POST', body: '{nope', headers: { 'x-user-id': 'me' } });
    expect(res.status).toBe(400);
    expect((await call('GET', '/v1/missing')).status).toBe(404);
  });

  describe('sync', () => {
    const transport = (user: string) => async (req: SyncRequest) => (await call('POST', '/v1/sync', req, user)).body as SyncResponse;

    it('syncs two devices through the server and survives a restart', async () => {
      const phone = new Kernel();
      phone.submit({ type: 'profile.set', at: DAY0, profile });
      phone.submit({ type: 'water.logged', at: T('09:00'), ml: 400 });
      let a = (await syncOnce(phone, emptySyncState(), transport('sam'))).state;

      const laptop = new Kernel();
      let b = (await syncOnce(laptop, emptySyncState(), transport('sam'))).state;
      expect(laptop.events).toHaveLength(2);

      laptop.submit({ type: 'water.logged', at: T('10:00'), ml: 250 });
      b = (await syncOnce(laptop, b, transport('sam'))).state;
      a = (await syncOnce(phone, a, transport('sam'))).state;
      expect(phone.events).toHaveLength(3);
      expect(a.cursor).toBe(3);

      // The server's own kernel sees synced events too.
      expect((await call('GET', '/v1/health', undefined, 'sam')).body.checks[0].actual).toBe(650);

      await new Promise((r) => server.close(r));
      await start();
      const again = await syncOnce(phone, a, transport('sam'));
      expect(again.received).toBe(0);
      expect(again.state.cursor).toBe(3);
      expect((await call('GET', '/v1/events', undefined, 'sam')).body.events).toHaveLength(3);
    });

    it('starts a new epoch after compaction so devices resync fully', async () => {
      const phone = new Kernel();
      phone.submit({ type: 'profile.set', at: DAY0, profile });
      const a = (await syncOnce(phone, emptySyncState(), transport('kim'))).state;
      await call('POST', '/v1/housekeeping', undefined, 'kim');
      const res = (await call('POST', '/v1/sync', { since: a.cursor, epoch: a.epoch, events: [] }, 'kim')).body;
      expect(res.reset).toBe(true);
      expect(res.epoch).not.toBe(a.epoch);
    });

    it('rejects synced events without ids and bad cursors', async () => {
      expect((await call('POST', '/v1/sync', { since: 0, events: [{ type: 'water.logged', at: DAY0, ml: 1 }] })).status).toBe(400);
      expect((await call('POST', '/v1/sync', { since: 'a' })).status).toBe(400);
    });
  });

  describe('privacy: encryption, export and delete', () => {
    const kdf = { N: 16, r: 8, p: 1 };
    const restart = async (extra?: Parameters<typeof start>[1]) => {
      await new Promise((r) => server.close(r));
      await start(undefined, extra);
    };

    it('encrypts files at rest when a data key is set, and reads them back after a restart', async () => {
      await restart({ dataKey: 'server secret', kdf });
      await call('POST', '/v1/events', [{ type: 'profile.set', at: DAY0, profile }, { type: 'water.logged', at: T('09:00'), ml: 777 }], 'enc');
      const onDisk = readFileSync(join(dir, 'enc.json'), 'utf8');
      expect(onDisk).not.toContain('water.logged');
      expect(onDisk).not.toContain('777');
      expect(JSON.parse(onDisk)).toMatchObject({ v: 1, alg: 'xchacha20poly1305', kdf: 'scrypt' });
      expect(statSync(join(dir, 'enc.json')).mode & 0o077).toBe(0); // owner-only

      await restart({ dataKey: 'server secret', kdf });
      expect((await call('GET', '/v1/events', undefined, 'enc')).body.events).toHaveLength(2);
      expect((await call('GET', '/v1/health', undefined, 'enc')).body.checks[0].actual).toBe(777);
    });

    it('answers 503 for an encrypted file with no key or the wrong key', async () => {
      await restart({ dataKey: 'right', kdf });
      await call('POST', '/v1/events', { type: 'water.logged', at: T('09:00'), ml: 1 }, 'locked');
      await restart(); // no key
      const none = await call('GET', '/v1/events', undefined, 'locked');
      expect(none.status).toBe(503);
      expect(none.body.error).toMatch(/EATOS_DATA_KEY/);
      await restart({ dataKey: 'wrong', kdf });
      expect((await call('GET', '/v1/events', undefined, 'locked')).status).toBe(503);
      await restart({ dataKey: 'right', kdf });
      expect((await call('GET', '/v1/events', undefined, 'locked')).body.events).toHaveLength(1);
    });

    it('encrypts a plain legacy file as soon as a key is configured', async () => {
      writeFileSync(join(dir, 'old.json'), JSON.stringify([{ type: 'water.logged', at: DAY0, ml: 42, id: 'x1' }]));
      await restart({ dataKey: 'k', kdf });
      expect((await call('GET', '/v1/events', undefined, 'old')).body.events).toHaveLength(1);
      expect(readFileSync(join(dir, 'old.json'), 'utf8')).not.toContain('water.logged');
    });

    it('exports a backup and deletes everything for a user', async () => {
      await call('POST', '/v1/events', [{ type: 'profile.set', at: DAY0, profile }, { type: 'water.logged', at: T('09:00'), ml: 250 }], 'gone');
      const backup = (await call('GET', '/v1/export', undefined, 'gone')).body;
      expect(backup).toMatchObject({ app: 'eatos', format: 1 });
      expect(backup.events).toHaveLength(2);

      expect((await call('DELETE', '/v1/data', undefined, 'gone')).body.deleted).toBe(true);
      expect(existsSync(join(dir, 'gone.json'))).toBe(false);
      expect((await call('GET', '/v1/events', undefined, 'gone')).body.events).toHaveLength(0);
      // Other users are untouched, and deleting twice is harmless.
      await call('POST', '/v1/events', { type: 'water.logged', at: T('09:00'), ml: 1 }, 'keep');
      expect((await call('DELETE', '/v1/data', undefined, 'gone')).body.deleted).toBe(false);
      expect((await call('GET', '/v1/events', undefined, 'keep')).body.events).toHaveLength(1);
    });
  });

  describe('robustness', () => {
    const ev = (id: string, at: number, ml = 100) => ({ id, type: 'water.logged', at, ml });
    const sync = (body: unknown, user = 'rob') => call('POST', '/v1/sync', body, user);

    it('keeps arrival order across a restart, so a device never skips an event', async () => {
      // Arrival order is [late-timestamp, early-timestamp]: time order would swap them.
      await sync({ since: 0, events: [ev('E1', T('10:00'))] });
      const a = (await sync({ since: 0, events: [] })).body; // device A has seen position 1
      expect(a.cursor).toBe(1);
      await sync({ since: 0, events: [ev('E2', T('08:00'))] }); // device B adds an earlier-dated event later

      await new Promise((r) => server.close(r));
      await start();
      const after = (await sync({ since: a.cursor, epoch: a.epoch, events: [] })).body;
      expect(after.events.map((e: { id: string }) => e.id)).toEqual(['E2']);
    });

    it('rejects malformed events with a clear message and leaves the batch unapplied', async () => {
      for (const bad of [
        { type: 'pantry.added', at: 1 },
        { type: 'water.logged', at: DAY0, ml: -5 },
        { type: 'water.logged', at: DAY0, ml: 'lots' },
        { type: 'calendar.busy', at: DAY0, start: 5, end: 1 },
        { type: 'profile.set', at: DAY0, profile: { selfId: 'x' } },
        { type: 'feedback', at: DAY0, foodId: 'a', verdict: 'maybe' },
      ]) {
        const res = await call('POST', '/v1/events', [{ type: 'water.logged', at: DAY0, ml: 1 }, bad], 'strict');
        expect(res.status).toBe(400);
        expect(res.body.error.length).toBeGreaterThan(5);
      }
      expect((await call('GET', '/v1/events', undefined, 'strict')).body.events).toHaveLength(0);
      expect((await sync({ since: 0, events: [{ id: 's1', type: 'pantry.added', at: 1 }] }, 'strict')).status).toBe(400);
      expect((await call('POST', '/v1/events', Array.from({ length: 1001 }, () => ({ type: 'water.logged', ml: 1 })), 'strict')).status).toBe(413);
    });

    it('a stored log containing a malformed event still loads, skipping only that event', async () => {
      writeFileSync(join(dir, 'dirty.json'), JSON.stringify([{ type: 'pantry.added', at: 1, id: 'bad' }, ev('ok1', T('09:00'), 250), { nope: true }]));
      await new Promise((r) => server.close(r));
      await start();
      const res = await call('GET', '/v1/health', undefined, 'dirty');
      expect(res.status).toBe(200);
      expect(res.body.checks[0].actual).toBe(250);
    });
  });
});
