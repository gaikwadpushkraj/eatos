import { describe, expect, it } from 'vitest';
import { newCalendarEvents, parseIcs, parseIcsTime } from '../src';
import type { EatEvent } from '../src';
import { DAY0, kernelWith, T } from './helpers';

const wrap = (...events: string[]) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${events.join('\r\n')}\r\nEND:VCALENDAR\r\n`;
const ev = (lines: string[]) => ['BEGIN:VEVENT', ...lines, 'END:VEVENT'].join('\r\n');
const range = { from: DAY0, to: DAY0 + 14 * 86_400_000 };
type Busy = Extract<EatEvent, { type: 'calendar.busy' }>;

describe('ics driver', () => {
  it('parses UTC times, titles on request, and strips them by default', () => {
    const ics = wrap(ev(['UID:a1', 'DTSTART:20261004T180000Z', 'DTEND:20261004T190000Z', 'SUMMARY:Team\\, weekly']));
    const [plain] = parseIcs(ics, range) as Busy[];
    expect(plain!.start).toBe(T('18:00'));
    expect(plain!.end).toBe(T('19:00'));
    expect(plain!.title).toBeUndefined();
    const [named] = parseIcs(ics, { ...range, titles: true }) as Busy[];
    expect(named!.title).toBe('Team, weekly');
  });

  it('converts TZID times, including daylight saving', () => {
    expect(parseIcsTime('20261005T180000', 'Europe/London')!.t).toBe(Date.UTC(2026, 9, 5, 17, 0)); // BST
    expect(parseIcsTime('20261201T180000', 'Europe/London')!.t).toBe(Date.UTC(2026, 11, 1, 18, 0)); // GMT
    expect(parseIcsTime('20261005T180000', 'Asia/Kolkata')!.t).toBe(Date.UTC(2026, 9, 5, 12, 30));
  });

  it('unfolds long lines and understands DURATION', () => {
    const ics = wrap(ev(['UID:a2', 'DTSTART:20261004T100000Z', 'DURATION:PT1H30M', 'SUMMARY:A very long', ' title']));
    const [e] = parseIcs(ics, { ...range, titles: true }) as Busy[];
    expect(e!.end - e!.start).toBe(90 * 60_000);
    expect(e!.title).toBe('A very longtitle');
  });

  it('skips all-day, cancelled, transparent and tiny events', () => {
    const ics = wrap(
      ev(['UID:b1', 'DTSTART;VALUE=DATE:20261004', 'DTEND;VALUE=DATE:20261005']),
      ev(['UID:b2', 'DTSTART:20261004T100000Z', 'DTEND:20261004T110000Z', 'STATUS:CANCELLED']),
      ev(['UID:b3', 'DTSTART:20261004T100000Z', 'DTEND:20261004T110000Z', 'TRANSP:TRANSPARENT']),
      ev(['UID:b4', 'DTSTART:20261004T100000Z', 'DTEND:20261004T100500Z']),
      ev(['UID:b5', 'DTSTART:20261004T120000Z', 'DTEND:20261004T130000Z']),
    );
    expect(parseIcs(ics, range).map((e) => e.id)).toEqual([`cal:b5:${T('12:00')}`]);
  });

  it('expands weekly rules with BYDAY, COUNT and EXDATE', () => {
    const ics = wrap(ev(['UID:w1', 'DTSTART:20261005T090000Z', 'DTEND:20261005T093000Z', 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=5', 'EXDATE:20261007T090000Z']));
    const wide = { from: DAY0, to: DAY0 + 28 * 86_400_000 };
    const starts = (parseIcs(ics, wide) as Busy[]).map((e) => new Date(e.start).toISOString().slice(0, 10));
    // Five occurrences (Mon 5, Wed 7, Mon 12, Wed 14, Mon 19); the excluded Wed 7 still counts toward COUNT.
    expect(starts).toEqual(['2026-10-05', '2026-10-12', '2026-10-14', '2026-10-19']);
    // A narrower window drops later ones.
    expect(parseIcs(ics, range)).toHaveLength(3);
  });

  it('expands daily rules with INTERVAL and UNTIL', () => {
    const ics = wrap(ev(['UID:d1', 'DTSTART:20261004T080000Z', 'DTEND:20261004T090000Z', 'RRULE:FREQ=DAILY;INTERVAL=2;UNTIL=20261010T000000Z']));
    expect((parseIcs(ics, range) as Busy[]).map((e) => new Date(e.start).getUTCDate())).toEqual([4, 6, 8]);
  });

  it('only returns events inside the window', () => {
    const ics = wrap(ev(['UID:o1', 'DTSTART:20250101T100000Z', 'DTEND:20250101T110000Z']), ev(['UID:o2', 'DTSTART:20271001T100000Z', 'DTEND:20271001T110000Z']));
    expect(parseIcs(ics, range)).toHaveLength(0);
  });

  it('importing twice adds nothing, and the meeting moves dinner', () => {
    const ics = wrap(ev(['UID:m1', 'DTSTART:20261004T180000Z', 'DTEND:20261004T190000Z', 'SUMMARY:Review']));
    const k = kernelWith();
    const first = newCalendarEvents(k.events.map((e) => e.id), parseIcs(ics, range));
    first.forEach((e) => k.submit(e));
    expect(newCalendarEvents(k.events.map((e) => e.id), parseIcs(ics, range))).toHaveLength(0);
    expect(k.schedule(T('12:00')).find((t) => t.id === 'meal:dinner')!.at).toBe(T('19:30'));
  });
});
