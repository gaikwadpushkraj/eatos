import type { EatEvent, PantryItem } from './types';
import type { State } from './state';
import { replay } from './state';
import { DAY } from './time';

export interface PantryView extends PantryItem {
  /** Whole days until expiry; negative when expired. */
  daysLeft?: number;
  status: 'fresh' | 'use-soon' | 'expired';
}

export const USE_SOON_DAYS = 2;

export function pantryView(state: State, now: number): PantryView[] {
  return Object.values(state.pantry)
    .map((item): PantryView => {
      if (item.expiresAt === undefined) return { ...item, status: 'fresh' };
      const daysLeft = Math.floor((item.expiresAt - now) / DAY);
      const status = item.expiresAt < now ? 'expired' : daysLeft < USE_SOON_DAYS ? 'use-soon' : 'fresh';
      return { ...item, daysLeft, status };
    })
    .sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity));
}

export function useSoon(state: State, now: number): PantryView[] {
  return pantryView(state, now).filter((p) => p.status === 'use-soon');
}

/** Names of items in the pantry (lowercase) that have not expired. */
export function pantryNames(state: State, now: number): Set<string> {
  return new Set(pantryView(state, now).filter((p) => p.status !== 'expired').map((p) => p.name.toLowerCase()));
}

export interface HousekeepingResult {
  /** Events to append: expired items are removed. */
  events: EatEvent[];
  expired: PantryView[];
  useSoon: PantryView[];
}

/** Garbage collection for the pantry. Returns the events to submit. */
export function housekeeping(state: State, now: number): HousekeepingResult {
  const view = pantryView(state, now);
  const expired = view.filter((p) => p.status === 'expired');
  return {
    events: expired.map((p) => ({ type: 'pantry.removed', at: now, itemId: p.id })),
    expired,
    useSoon: view.filter((p) => p.status === 'use-soon'),
  };
}

/** Event types that must never be compacted away. */
const KEEP_FOREVER = new Set<EatEvent['type']>(['profile.set', 'member.added', 'member.removed', 'feedback', 'wish.logged']);

/**
 * Compaction: drops routine events older than `keepDays` but keeps what
 * long-term state depends on. The pantry is rewritten as fresh
 * `pantry.added` events so nothing is lost.
 */
export function compact(state: State, now: number, keepDays = 90): State {
  const cutoff = now - keepDays * DAY;
  const pantryEvents: EatEvent[] = Object.values(state.pantry).map((item) => ({ type: 'pantry.added', at: Math.min(item.addedAt, cutoff), item }));
  const kept = state.events.filter((e) => {
    if (e.type.startsWith('pantry.')) return false;
    return KEEP_FOREVER.has(e.type) || e.at >= cutoff;
  });
  // Keep the last illness.started if safe mode is still on.
  if (state.safeModeSince !== undefined && state.safeModeSince < cutoff) {
    kept.push({ type: 'illness.started', at: state.safeModeSince });
  }
  return replay([...kept, ...pantryEvents]);
}
