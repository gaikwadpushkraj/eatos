import { describe, expect, it } from 'vitest';
import { Kernel, emptySyncState, serveSync, syncOnce } from '../src';
import type { EatEvent, SyncRequest } from '../src';
import { DAY0, household, kernelWith, T } from './helpers';

/** An in-memory server holding one user's log. */
function server(epoch = 'e1') {
  const s = { log: [] as EatEvent[], epoch };
  const transport = async (req: SyncRequest) => {
    const out = serveSync(s.log, s.epoch, req);
    s.log = out.log;
    return out.res;
  };
  return { s, transport };
}

describe('sync', () => {
  it('two devices converge on the same log and schedule', async () => {
    const { s, transport } = server();
    const phone = kernelWith([], household());
    const laptop = new Kernel();
    let a = emptySyncState();
    let b = emptySyncState();

    a = (await syncOnce(phone, a, transport)).state;
    b = (await syncOnce(laptop, b, transport)).state;
    expect(laptop.state.profile?.members).toHaveLength(3);

    phone.submit({ type: 'water.logged', at: T('09:00'), ml: 500 });
    laptop.submit({ type: 'calendar.busy', at: T('09:30'), start: T('18:00'), end: T('19:00') });
    const ra = await syncOnce(phone, a, transport);
    const rb = await syncOnce(laptop, b, transport);
    a = (await syncOnce(phone, ra.state, transport)).state;

    expect(ra.sent).toBe(1);
    expect(rb.received).toBe(1);
    expect(s.log).toHaveLength(3);
    expect(phone.events.map((e) => e.id).sort()).toEqual(laptop.events.map((e) => e.id).sort());
    expect(phone.schedule(T('10:00'))).toEqual(laptop.schedule(T('10:00')));
    expect(a.cursor).toBe(3);
  });

  it('is idempotent: a repeated round sends and receives nothing', async () => {
    const { transport } = server();
    const k = kernelWith([{ type: 'water.logged', at: T('09:00'), ml: 300 }]);
    const first = await syncOnce(k, emptySyncState(), transport);
    const second = await syncOnce(k, first.state, transport);
    expect(first.sent).toBe(2);
    expect(second.sent).toBe(0);
    expect(second.received).toBe(0);
  });

  it('does not duplicate events the server already has', () => {
    const e: EatEvent = { id: 'x1', type: 'water.logged', at: DAY0, ml: 100 };
    const once = serveSync([], 'e1', { since: 0, epoch: 'e1', events: [e] });
    const twice = serveSync(once.log, 'e1', { since: 0, epoch: 'e1', events: [e] });
    expect(twice.log).toHaveLength(1);
  });

  it('a stale epoch gets the full log back', async () => {
    const { s, transport } = server('e1');
    const a = kernelWith();
    const b = new Kernel();
    await syncOnce(a, emptySyncState(), transport);
    const state = (await syncOnce(b, emptySyncState(), transport)).state;
    s.epoch = 'e2'; // server compacted
    const res = serveSync(s.log, s.epoch, { since: state.cursor, epoch: state.epoch, events: [] });
    expect(res.res.reset).toBe(true);
    expect(res.res.events).toHaveLength(s.log.length);
  });

  it('merge ignores events without ids and ones already present', () => {
    const k = kernelWith();
    const before = k.events.length;
    expect(k.merge([{ type: 'water.logged', at: T('09:00'), ml: 1 } as EatEvent, ...k.events])).toHaveLength(0);
    expect(k.events).toHaveLength(before);
  });
});
