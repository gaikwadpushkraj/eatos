import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { makeProfile, makeMember, hm } from '@eatos/core';
import { createApi } from '../src/server';

const DAY0 = Date.UTC(2026, 9, 4);
const T = (s: string) => DAY0 + hm(s) * 60_000;

let dir: string;
let server: Server;
let base: string;

async function start(clock = () => T('16:00')) {
  server = createApi({ dataDir: dir, clock });
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
});
