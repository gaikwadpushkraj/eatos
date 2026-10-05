import { describe, expect, it } from 'vitest';
import { Kernel, eventProblem, isValidEvent, makeMember, makeProfile, readBackup } from '../src';
import type { EatEvent } from '../src';
import { DAY0, household, kernelWith, T } from './helpers';

const profile = household();
/** One valid event of every type. */
const valid: EatEvent[] = [
  { type: 'profile.set', at: DAY0, profile },
  { type: 'member.added', at: DAY0, member: makeMember({ id: 'm2', name: 'Sam', allergens: ['soy'] }) },
  { type: 'member.removed', at: DAY0, memberId: 'm2' },
  { type: 'intake.logged', at: DAY0, foodId: 'banana', slot: 'snack', nutrients: { kcal: 100 }, memberId: 'me' },
  { type: 'water.logged', at: DAY0, ml: 250 },
  { type: 'workout.completed', at: DAY0, minutes: 45, intensity: 'high' },
  { type: 'sleep.logged', at: DAY0, hours: 7.5 },
  { type: 'calendar.busy', at: DAY0, start: T('09:00'), end: T('10:00'), title: 'x' },
  { type: 'illness.started', at: DAY0, note: 'cold' },
  { type: 'illness.ended', at: DAY0 },
  { type: 'pantry.added', at: DAY0, item: { id: 'p1', name: 'rice', qty: 2, unit: 'kg', location: 'cupboard', addedAt: DAY0, expiresAt: DAY0 + 1e9 } },
  { type: 'pantry.used', at: DAY0, itemId: 'p1', qty: 1 },
  { type: 'pantry.removed', at: DAY0, itemId: 'p1' },
  { type: 'feedback', at: DAY0, foodId: 'banana', verdict: 'liked' },
  { type: 'task.done', at: DAY0, taskId: 'meal:lunch' },
  { type: 'task.skipped', at: DAY0, taskId: 'meal:lunch' },
  { type: 'medication.taken', at: DAY0, name: 'Pill' },
];

describe('event validation', () => {
  it('accepts a valid event of every type', () => {
    for (const e of valid) expect(eventProblem(e), e.type).toBeUndefined();
    expect(isValidEvent({ ...valid[4], id: 'abc' })).toBe(true);
  });

  it('rejects malformed events with a reason', () => {
    const cases: [unknown, RegExp][] = [
      [null, /object/],
      [[], /object/],
      [{ at: 1 }, /type/],
      [{ type: 'water.logged' }, /at must/],
      [{ type: 'water.logged', at: NaN, ml: 1 }, /at must/],
      [{ type: 'bogus', at: 1 }, /unknown event type/],
      [{ type: 'water.logged', at: 1, ml: 1, id: '' }, /id/],
      [{ type: 'water.logged', at: 1, ml: 0 }, /ml/],
      [{ type: 'water.logged', at: 1, ml: 99999 }, /ml/],
      [{ type: 'sleep.logged', at: 1, hours: 30 }, /hours/],
      [{ type: 'workout.completed', at: 1, minutes: 30, intensity: 'extreme' }, /workout/],
      [{ type: 'calendar.busy', at: 1, start: 10, end: 5 }, /calendar/],
      [{ type: 'pantry.added', at: 1, item: { id: 'x', name: 'y', qty: 1, unit: 'g', location: 'moon', addedAt: 1 } }, /pantry item/],
      [{ type: 'intake.logged', at: 1, slot: 'brunch' }, /intake/],
      [{ type: 'intake.logged', at: 1, nutrients: { kcal: 'a' } }, /intake/],
      [{ type: 'feedback', at: 1, foodId: 'a', verdict: 'meh' }, /feedback/],
      [{ type: 'profile.set', at: 1, profile: { ...profile, members: [] } }, /members/],
      [{ type: 'profile.set', at: 1, profile: { ...profile, routine: { wake: 1 } } }, /routine/],
      [{ type: 'profile.set', at: 1, profile: { ...profile, tzOffsetMin: 99999 } }, /numbers/],
      [{ type: 'member.added', at: 1, member: { id: 'a', name: 'b', diet: 'carnivore', allergens: [], dislikes: [], goals: [] } }, /diet/],
      [{ type: 'member.added', at: 1, member: makeMember({ id: 'a', name: 'b', allergens: ['kryptonite' as never] }) }, /allergens/],
      [{ type: 'member.removed', at: 1 }, /memberId/],
      [{ type: 'water.logged', at: 1, ml: 1, id: 'x'.repeat(501) }, /id/],
    ];
    for (const [bad, why] of cases) expect(eventProblem(bad), JSON.stringify(bad).slice(0, 80)).toMatch(why);
  });

  it('merge drops malformed events instead of throwing, and keeps the good ones', () => {
    const k = kernelWith();
    const before = k.events.length;
    const added = k.merge([
      { type: 'pantry.added', at: 1, id: 'bad1' } as EatEvent,
      { id: 'good1', type: 'water.logged', at: T('09:00'), ml: 300 },
      { id: 'bad2', type: 'profile.set', at: 1, profile: null } as never,
      null as never,
    ]);
    expect(added.map((e) => e.id)).toEqual(['good1']);
    expect(k.events).toHaveLength(before + 1);
    expect(() => k.schedule(T('12:00'))).not.toThrow();
  });

  it('a kernel built from a log with bad events starts anyway', () => {
    const k = new Kernel({ events: [{ type: 'profile.set', at: DAY0, profile }, { type: 'pantry.added', at: 1 } as never, 7 as never, { id: 'g', type: 'water.logged', at: DAY0, ml: 5 }] });
    expect(k.events).toHaveLength(2);
    expect(k.state.profile).toBeDefined();
  });

  it('backups with a broken event are rejected with the reason', async () => {
    await expect(readBackup(JSON.stringify([{ type: 'water.logged', at: 1, ml: -1 }]))).rejects.toMatchObject({ code: 'invalid', message: expect.stringContaining('ml') });
  });

  it('fuzz: mutated events never make merge or the schedule throw', () => {
    let seed = 42;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
    const junk = [null, undefined, 'x', -1, 1e300, NaN, [], {}, true, { a: 1 }, 'x'.repeat(1000)];
    const mutate = (v: unknown, depth = 0): unknown => {
      if (Array.isArray(v)) return v.map((x) => (rnd() < 0.2 ? junk[Math.floor(rnd() * junk.length)] : mutate(x, depth + 1)));
      if (v && typeof v === 'object') {
        const out: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(v)) {
          const r = rnd();
          if (r < 0.1) continue; // drop the field
          out[key] = r < 0.3 ? junk[Math.floor(rnd() * junk.length)] : mutate(val, depth + 1);
        }
        return out;
      }
      return v;
    };
    const k = kernelWith([], profile);
    let accepted = 0;
    for (let i = 0; i < 3000; i++) {
      const base = valid[Math.floor(rnd() * valid.length)]!;
      const e = { ...(mutate(base) as object), id: `fz${i}` } as EatEvent;
      accepted += k.merge([e]).length;
      if (i % 500 === 0) expect(() => k.now(T('14:00'))).not.toThrow();
    }
    expect(accepted).toBeGreaterThan(0); // some mutations stay valid; the rest were dropped
    expect(() => {
      k.now(T('14:00'));
      k.schedule(T('20:00'));
      k.week(T('09:00'));
      k.log(T('20:00'));
    }).not.toThrow();
  });
});

describe('drivers only emit valid events', () => {
  it('drops what the validator would drop later', async () => {
    const { parseIcs, parseAppleHealth, parseHealthCsv, receiptEvents } = await import('../src');
    // A 10 day timed "event" is not a meeting.
    const ics = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:long', 'DTSTART:20261004T100000Z', 'DTEND:20261014T100000Z', 'END:VEVENT', 'BEGIN:VEVENT', 'UID:ok', 'DTSTART:20261004T100000Z', 'DTEND:20261004T110000Z', 'END:VEVENT', 'END:VCALENDAR'].join('\n');
    expect(parseIcs(ics, { from: DAY0, to: DAY0 + 30 * 86_400_000 }).map((e) => e.id)).toEqual([`cal:ok:${T('10:00')}`]);
    expect(parseHealthCsv('water,2026-10-04T09:00:00Z,,50000\nwater,2026-10-04T10:00:00Z,,300\nsleep,2026-10-01T00:00:00Z,2026-10-04T00:00:00Z,')).toHaveLength(1);
    expect(parseAppleHealth('<Record type="HKQuantityTypeIdentifierDietaryWater" unit="L" value="40" startDate="2026-10-04 09:00:00 +0000" endDate="2026-10-04 09:00:00 +0000"/>')).toHaveLength(0);
    expect(receiptEvents(`${'x'.repeat(10)} ${'Bananas '.repeat(100)} 1.00`, DAY0).events.every((e) => isValidEvent(e))).toBe(true);
  });
});
