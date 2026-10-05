import type { State } from './state';
import { DAY } from './time';

/** Feedback fades by half every 60 days, so old dislikes stop ruling. */
export const HALF_LIFE = 60 * DAY;
/** A "never" stays a hard exclusion for a year, then fades like a dislike. */
export const NEVER_HARD_FOR = 365 * DAY;

const WEIGHT = { liked: 1, skip: -0.5, never: -3 } as const;

export interface Preference {
  foodId: string;
  score: number;
  excluded: boolean;
}

/** Long-term memory: decayed preference per food. */
export function preferences(state: State, now: number): Record<string, Preference> {
  const out: Record<string, Preference> = {};
  const lastNever: Record<string, number> = {};
  const lastLiked: Record<string, number> = {};
  for (const e of state.events) {
    if (e.type !== 'feedback' || e.at > now) continue;
    const p = (out[e.foodId] ??= { foodId: e.foodId, score: 0, excluded: false });
    p.score += WEIGHT[e.verdict] * 0.5 ** ((now - e.at) / HALF_LIFE);
    if (e.verdict === 'never') lastNever[e.foodId] = Math.max(lastNever[e.foodId] ?? 0, e.at);
    if (e.verdict === 'liked') lastLiked[e.foodId] = Math.max(lastLiked[e.foodId] ?? 0, e.at);
  }
  for (const p of Object.values(out)) {
    const never = lastNever[p.foodId];
    // A later "liked" lifts an earlier "never".
    p.excluded = never !== undefined && now - never < NEVER_HARD_FOR && (lastLiked[p.foodId] ?? -1) < never;
  }
  return out;
}

/** Cache: the favourites, best first. */
export function favourites(state: State, now: number, n = 5): string[] {
  return Object.values(preferences(state, now))
    .filter((p) => !p.excluded && p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((p) => p.foodId);
}

/** Foods eaten in the last `days`, for variety. */
export function recentlyEaten(state: State, now: number, days = 3): Set<string> {
  const since = now - days * DAY;
  return new Set(state.events.flatMap((e) => (e.type === 'intake.logged' && e.foodId && e.at >= since && e.at <= now ? [e.foodId] : [])));
}
