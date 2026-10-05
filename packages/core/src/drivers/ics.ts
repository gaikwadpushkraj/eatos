import type { EatEvent } from '../types';
import { DAY, MINUTE } from '../time';
import { isValidEvent } from '../validate';

/**
 * Calendar driver: turns an iCalendar (.ics) feed into `calendar.busy`
 * events. Only free/busy is read: the event title is kept only when the
 * caller asks for it. Event ids are derived from the calendar UID and the
 * start time, so importing the same calendar twice adds nothing.
 */
export interface IcsOptions {
  /** Window to expand recurring events into. */
  from: number;
  to: number;
  /** Keep event titles (off by default for privacy). */
  titles?: boolean;
  /** Ignore events shorter than this many minutes. */
  minMinutes?: number;
  /** Ignore all-day events (default true). */
  skipAllDay?: boolean;
}

interface Raw {
  uid: string;
  summary?: string;
  start: number;
  end: number;
  allDay: boolean;
  rrule?: string;
  exdates: number[];
  transparent: boolean;
  cancelled: boolean;
}

/** Joins folded lines (RFC 5545: a line starting with space continues the last). */
function unfold(text: string): string[] {
  const out: string[] = [];
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length) out[out.length - 1] += line.slice(1);
    else out.push(line);
  }
  return out;
}

function unescapeText(s: string): string {
  return s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1');
}

/** Offset in ms of `tz` at the instant `utc` (positive east of UTC). */
function zoneOffset(utc: number, tz: string): number {
  try {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(utc));
    const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
    return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - Math.floor(utc / 1000) * 1000;
  } catch {
    return 0;
  }
}

/** Parses 20261005T180000Z, 20261005T180000 (with TZID) or 20261005 (date). */
export function parseIcsTime(value: string, tzid?: string, defaultOffsetMin = 0): { t: number; allDay: boolean } | undefined {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return undefined;
  const [, y, mo, d, h, mi, s, z] = m;
  const local = Date.UTC(+y!, +mo! - 1, +d!, +(h ?? 0), +(mi ?? 0), +(s ?? 0));
  const allDay = h === undefined;
  if (z) return { t: local, allDay };
  if (allDay) return { t: local - defaultOffsetMin * MINUTE, allDay };
  if (tzid) {
    // Local wall time in tzid: subtract the zone's offset at that instant (two passes for DST edges).
    let t = local - zoneOffset(local, tzid);
    t = local - zoneOffset(t, tzid);
    return { t, allDay };
  }
  return { t: local - defaultOffsetMin * MINUTE, allDay };
}

function parseDuration(v: string): number {
  const m = v.match(/^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return 0;
  return ((+(m[1] ?? 0) * 7 + +(m[2] ?? 0)) * 24 * 60 + +(m[3] ?? 0) * 60 + +(m[4] ?? 0)) * MINUTE + +(m[5] ?? 0) * 1000;
}

function parseEvents(text: string, defaultOffsetMin: number): Raw[] {
  const events: Raw[] = [];
  let cur: Partial<Raw> & { dur?: number } | null = null;
  for (const line of unfold(text)) {
    if (line === 'BEGIN:VEVENT') {
      cur = { exdates: [], transparent: false, cancelled: false };
      continue;
    }
    if (line === 'END:VEVENT') {
      if (cur?.uid && cur.start !== undefined) {
        const end = cur.end ?? cur.start + (cur.dur ?? (cur.allDay ? DAY : 0));
        events.push({ uid: cur.uid, summary: cur.summary, start: cur.start, end, allDay: !!cur.allDay, rrule: cur.rrule, exdates: cur.exdates ?? [], transparent: !!cur.transparent, cancelled: !!cur.cancelled });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const [name = '', ...params] = line.slice(0, idx).split(';');
    const value = line.slice(idx + 1);
    const tzid = params.find((p) => p.startsWith('TZID='))?.slice(5).replace(/"/g, '');
    switch (name.toUpperCase()) {
      case 'UID': cur.uid = value; break;
      case 'SUMMARY': cur.summary = unescapeText(value); break;
      case 'DTSTART': {
        const t = parseIcsTime(value, tzid, defaultOffsetMin);
        if (t) {
          cur.start = t.t;
          cur.allDay = t.allDay;
        }
        break;
      }
      case 'DTEND': {
        const t = parseIcsTime(value, tzid, defaultOffsetMin);
        if (t) cur.end = t.t;
        break;
      }
      case 'DURATION': cur.dur = parseDuration(value); break;
      case 'RRULE': cur.rrule = value; break;
      case 'EXDATE':
        for (const v of value.split(',')) {
          const t = parseIcsTime(v, tzid, defaultOffsetMin);
          if (t) cur.exdates!.push(t.t);
        }
        break;
      case 'TRANSP': cur.transparent = value.toUpperCase() === 'TRANSPARENT'; break;
      case 'STATUS': cur.cancelled = value.toUpperCase() === 'CANCELLED'; break;
      default: break;
    }
  }
  return events;
}

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** Expands DAILY and WEEKLY rules (with INTERVAL, COUNT, UNTIL, BYDAY) into start times. */
function expand(e: Raw, from: number, to: number, defaultOffsetMin: number): number[] {
  if (!e.rrule) return [e.start];
  const rule = Object.fromEntries(e.rrule.split(';').map((kv) => kv.split('=') as [string, string]));
  const interval = Math.max(1, Number(rule.INTERVAL ?? 1));
  const count = rule.COUNT ? Number(rule.COUNT) : Infinity;
  const until = rule.UNTIL ? (parseIcsTime(rule.UNTIL, undefined, defaultOffsetMin)?.t ?? Infinity) + (rule.UNTIL.length === 8 ? DAY : 0) : Infinity;
  const starts: number[] = [];
  const dur = e.end - e.start;
  const push = (t: number) => {
    if (t > until || starts.length >= count) return false;
    starts.push(t);
    return true;
  };
  if (rule.FREQ === 'DAILY') {
    for (let t = e.start; t < to + dur && starts.length < 5000; t += interval * DAY) if (!push(t)) break;
  } else if (rule.FREQ === 'WEEKLY') {
    const byDay = rule.BYDAY ? rule.BYDAY.split(',').map((d) => DAY_CODES.indexOf(d.slice(-2))).filter((d) => d >= 0) : [];
    // An unknown BYDAY value must not leave us with no day to repeat on (that would loop forever).
    const days = byDay.length ? byDay : [new Date(e.start).getUTCDay()];
    // Week anchored on the Sunday on or before DTSTART, in UTC wall time of the first event.
    const weekStart = e.start - new Date(e.start).getUTCDay() * DAY;
    outer: for (let w = 0; starts.length < 5000 && w < 20_000; w += interval) {
      for (const d of [...days].sort((a, b) => a - b)) {
        const t = weekStart + (w * 7 + d) * DAY;
        if (t < e.start) continue;
        if (t >= to + dur) break outer;
        if (!push(t)) break outer;
      }
    }
  } else {
    return [e.start];
  }
  return starts;
}

export function parseIcs(text: string, opts: IcsOptions, tzOffsetMin = 0): EatEvent[] {
  const out: EatEvent[] = [];
  const min = (opts.minMinutes ?? 15) * MINUTE;
  for (const e of parseEvents(text, tzOffsetMin)) {
    if (e.cancelled || e.transparent) continue;
    if (e.allDay && opts.skipAllDay !== false) continue;
    const dur = e.end - e.start;
    if (dur < min) continue;
    const excluded = new Set(e.exdates);
    for (const start of expand(e, opts.from, opts.to, tzOffsetMin)) {
      if (excluded.has(start) || start + dur <= opts.from || start >= opts.to) continue;
      out.push({
        type: 'calendar.busy',
        id: `cal:${e.uid}:${start}`,
        at: Math.min(start, opts.to),
        start,
        end: start + dur,
        ...(opts.titles && e.summary ? { title: e.summary } : {}),
      });
    }
  }
  // Only well-formed events leave the driver (for example, timed events over a week long are not meetings).
  return out.filter(isValidEvent).sort((a, b) => (a as { start: number }).start - (b as { start: number }).start);
}

/** Events a feed would add that the kernel does not have yet. */
export function newCalendarEvents(existingIds: Iterable<string | undefined>, imported: EatEvent[]): EatEvent[] {
  const have = new Set(existingIds);
  return imported.filter((e) => e.id && !have.has(e.id));
}
