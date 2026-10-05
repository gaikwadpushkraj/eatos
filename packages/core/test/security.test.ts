import { describe, expect, it } from 'vitest';
import { Kernel, isValidEvent, makeMember, makeProfile, parseAsk } from '../src';
import * as ics from '../src/drivers/ics';
import { menuBlocker } from '../src/drivers/delivery';

describe('hardening from the security review', () => {
  it('parseAsk does not stall on pathological input', () => {
    const t = Date.now();
    parseAsk('1'.repeat(200_000) + ' mins');
    expect(Date.now() - t).toBeLessThan(500);
  });
  it('an unknown BYDAY value does not hang the calendar import', () => {
    const text = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'DTSTART:20261014T090000Z', 'DTEND:20261014T100000Z', 'RRULE:FREQ=WEEKLY;BYDAY=XX', 'SUMMARY:x', 'END:VEVENT', 'END:VCALENDAR'].join('\n');
    const t = Date.now();
    expect(() => ics.parseIcs(text, { from: Date.UTC(2026, 9, 1), to: Date.UTC(2026, 11, 31) })).not.toThrow();
    expect(Date.now() - t).toBeLessThan(2000);
  });
  it('keys that would pollute prototypes are rejected', () => {
    for (const bad of ['__proto__', 'constructor', 'prototype']) {
      expect(isValidEvent({ type: 'feedback', at: 1, foodId: bad, verdict: 'liked' })).toBe(false);
      expect(isValidEvent({ type: 'task.done', at: 1, taskId: bad })).toBe(false);
    }
    const k = new Kernel();
    k.submit({ type: 'profile.set', at: 1, profile: makeProfile({ members: [makeMember({ id: 'me', name: 'A' })] }) });
    k.recommend({}, 2);
    expect(({} as Record<string, unknown>).score).toBeUndefined();
  });
  it('a diet that is only an inherited property is not a diet', () => {
    const m = { id: 'a', name: 'A', diet: 'toString', allergens: [], dislikes: [], goals: [] };
    expect(isValidEvent({ type: 'member.added', at: 1, member: m })).toBe(false);
    expect(menuBlocker).toBeTypeOf('function');
  });
});
