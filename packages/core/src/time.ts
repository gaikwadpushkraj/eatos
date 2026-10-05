export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Epoch ms of local midnight for the day containing `t`. */
export function dayStart(t: number, tzOffsetMin = 0): number {
  const off = tzOffsetMin * MINUTE;
  return Math.floor((t + off) / DAY) * DAY - off;
}

/** Minutes after local midnight. */
export function minuteOfDay(t: number, tzOffsetMin = 0): number {
  return Math.floor((t - dayStart(t, tzOffsetMin)) / MINUTE);
}

/** Epoch ms for a minute of the local day that contains `t`. */
export function atMinute(t: number, minute: number, tzOffsetMin = 0): number {
  return dayStart(t, tzOffsetMin) + minute * MINUTE;
}

export function sameDay(a: number, b: number, tzOffsetMin = 0): boolean {
  return dayStart(a, tzOffsetMin) === dayStart(b, tzOffsetMin);
}

/** "19:30" style local clock label. */
export function clock(t: number, tzOffsetMin = 0): string {
  const m = minuteOfDay(t, tzOffsetMin);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Parses "19:30" into minutes after midnight. */
export function hm(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** FNV-1a hash: a short stable id suffix from any string. */
export function hashString(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
