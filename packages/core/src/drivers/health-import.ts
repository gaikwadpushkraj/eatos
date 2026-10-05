import type { EatEvent } from '../types';
import { HOUR, MINUTE } from '../time';

/**
 * Health driver: turns exported health data into EatOS events.
 *
 *  - `parseAppleHealth` reads Apple Health's export.xml (workouts, sleep
 *    analysis, dietary water). Watches and most wearables sync into it.
 *  - `parseHealthCsv` reads a simple CSV: `type,start,end,value` with
 *    type one of workout, sleep, water (value = minutes/hours/ml).
 *
 * Event ids come from the record's type and start time, so importing the
 * same export twice adds nothing.
 */
export interface HealthImportOptions {
  from?: number;
  to?: number;
}

type Intensity = 'low' | 'moderate' | 'high';

/** "2026-10-04 07:00:00 +0530" → epoch ms. */
export function parseHealthDate(s: string): number | undefined {
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?\s*(Z|[+-]\d{2}:?\d{2})?$/);
  if (!m) return undefined;
  const [, y, mo, d, h, mi, sec, zone] = m;
  const utc = Date.UTC(+y!, +mo! - 1, +d!, +h!, +mi!, +(sec ?? 0));
  if (!zone || zone === 'Z') return utc;
  const sign = zone.startsWith('-') ? -1 : 1;
  const digits = zone.slice(1).replace(':', '');
  return utc - sign * (+digits.slice(0, 2) * 60 + +digits.slice(2, 4)) * MINUTE;
}

const HIGH = /Running|HighIntensity|HIIT|Cycling|Rowing|Swimming|Boxing|Soccer|Basketball|Tennis|Hiking|CrossTraining|Elliptical|StairClimbing/i;
const LOW = /Walking|Yoga|Pilates|Stretching|Flexibility|Mindful|Cooldown|Tai|Barre/i;

export function intensityFor(activity: string, minutes: number): Intensity {
  if (LOW.test(activity)) return 'low';
  if (HIGH.test(activity)) return minutes >= 40 ? 'high' : 'moderate';
  return minutes >= 60 ? 'high' : 'moderate';
}

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([A-Za-z]+)="([^"]*)"/g)) out[m[1]!] = m[2]!;
  return out;
}

const inWindow = (t: number, o: HealthImportOptions) => (o.from === undefined || t >= o.from) && (o.to === undefined || t <= o.to);

/** Sleep stages that count as sleep (not "in bed" or "awake"). */
const ASLEEP = /Asleep|AsleepCore|AsleepDeep|AsleepREM|AsleepUnspecified/;

export function parseAppleHealth(xml: string, opts: HealthImportOptions = {}): EatEvent[] {
  const events: EatEvent[] = [];
  const sleepRuns: { start: number; end: number }[] = [];

  for (const m of xml.matchAll(/<(Workout|Record)\b([^>]*?)\/?>/g)) {
    const a = attrs(m[2]!);
    const start = a.startDate ? parseHealthDate(a.startDate) : undefined;
    const end = a.endDate ? parseHealthDate(a.endDate) : undefined;
    if (start === undefined || end === undefined) continue;

    if (m[1] === 'Workout') {
      const unit = a.durationUnit ?? 'min';
      const raw = Number(a.duration ?? (end - start) / MINUTE);
      const minutes = Math.round(unit === 'hr' ? raw * 60 : unit === 'sec' ? raw / 60 : raw);
      if (!(minutes > 0) || !inWindow(end, opts)) continue;
      events.push({ type: 'workout.completed', id: `health:workout:${start}`, at: end, minutes, intensity: intensityFor(a.workoutActivityType ?? '', minutes) });
    } else if (a.type === 'HKCategoryTypeIdentifierSleepAnalysis' && ASLEEP.test(a.value ?? '')) {
      sleepRuns.push({ start, end });
    } else if (a.type === 'HKQuantityTypeIdentifierDietaryWater') {
      const v = Number(a.value);
      const ml = a.unit === 'L' ? v * 1000 : a.unit === 'fl_oz_us' ? v * 29.5735 : v;
      if (ml > 0 && inWindow(end, opts)) events.push({ type: 'water.logged', id: `health:water:${start}`, at: end, ml: Math.round(ml) });
    }
  }

  // Merge sleep stages into nights: a gap of more than 3 hours starts a new night.
  sleepRuns.sort((x, y) => x.start - y.start);
  let night: { start: number; end: number; ms: number } | undefined;
  const flush = () => {
    if (night && night.ms >= 2 * HOUR && inWindow(night.end, opts)) {
      events.push({ type: 'sleep.logged', id: `health:sleep:${night.start}`, at: night.end, hours: Math.round((night.ms / HOUR) * 10) / 10 });
    }
  };
  for (const r of sleepRuns) {
    if (night && r.start - night.end <= 3 * HOUR) {
      night.end = Math.max(night.end, r.end);
      night.ms += r.end - r.start;
    } else {
      flush();
      night = { start: r.start, end: r.end, ms: r.end - r.start };
    }
  }
  flush();
  return events.sort((x, y) => x.at - y.at);
}

/** `type,start,end,value` rows. Dates are ISO or "YYYY-MM-DD HH:MM:SS +0000". */
export function parseHealthCsv(csv: string, opts: HealthImportOptions = {}): EatEvent[] {
  const events: EatEvent[] = [];
  const lines = csv.replace(/\r\n?/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
  const first = lines[0]?.toLowerCase().startsWith('type') ? 1 : 0;
  for (const line of lines.slice(first)) {
    const [type = '', startRaw = '', endRaw = '', valueRaw = '', activity = ''] = line.split(',').map((c) => c.trim());
    const start = parseHealthDate(startRaw.replace('T', ' ')) ?? (Number.isNaN(Date.parse(startRaw)) ? undefined : Date.parse(startRaw));
    const end = parseHealthDate(endRaw.replace('T', ' ')) ?? (Number.isNaN(Date.parse(endRaw)) ? undefined : Date.parse(endRaw));
    if (start === undefined) continue;
    const to = end ?? start;
    if (!inWindow(to, opts)) continue;
    const value = Number(valueRaw);
    if (type === 'workout') {
      const minutes = Math.round(value > 0 ? value : (to - start) / MINUTE);
      if (minutes > 0) events.push({ type: 'workout.completed', id: `health:workout:${start}`, at: to, minutes, intensity: intensityFor(activity, minutes) });
    } else if (type === 'sleep') {
      const hours = value > 0 ? value : (to - start) / HOUR;
      if (hours > 0) events.push({ type: 'sleep.logged', id: `health:sleep:${start}`, at: to, hours: Math.round(hours * 10) / 10 });
    } else if (type === 'water' && value > 0) {
      events.push({ type: 'water.logged', id: `health:water:${start}`, at: to, ml: Math.round(value) });
    }
  }
  return events.sort((x, y) => x.at - y.at);
}
