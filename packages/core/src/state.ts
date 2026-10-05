import type { Blocker, EatEvent, FastingKind, Member, PantryItem, Profile } from './types';
import { dayStart } from './time';

/**
 * Kernel state derived from the event log. The log is the source of
 * truth; everything here can be rebuilt with {@link replay}.
 */
export interface State {
  events: EatEvent[];
  profile?: Profile;
  pantry: Record<string, PantryItem>;
  /** Epoch ms when safe mode started, if active. */
  safeModeSince?: number;
  /** The fast set most recently, if any. It only applies on the day it was set. */
  fasting?: { kind: FastingKind; since: number };
  /** Wishes, newest last. */
  wishes: { id: string; wish: string; blocker?: Blocker; foodId?: string; at: number }[];
}

export function emptyState(): State {
  return { events: [], pantry: {}, wishes: [] };
}

/** Applies one event. Pure: returns a new state. */
export function reduce(state: State, event: EatEvent): State {
  const next: State = { ...state, events: [...state.events, event] };
  switch (event.type) {
    case 'profile.set':
      next.profile = event.profile;
      break;
    case 'member.added':
      if (next.profile) {
        const members = next.profile.members.filter((m) => m.id !== event.member.id);
        next.profile = { ...next.profile, members: [...members, event.member] };
      }
      break;
    case 'member.removed':
      if (next.profile) {
        next.profile = {
          ...next.profile,
          members: next.profile.members.filter((m) => m.id !== event.memberId),
        };
      }
      break;
    case 'pantry.added':
      next.pantry = { ...state.pantry, [event.item.id]: event.item };
      break;
    case 'pantry.used': {
      const item = state.pantry[event.itemId];
      if (item) {
        const qty = event.qty === undefined ? 0 : item.qty - event.qty;
        const pantry = { ...state.pantry };
        if (qty <= 0) delete pantry[item.id];
        else pantry[item.id] = { ...item, qty };
        next.pantry = pantry;
      }
      break;
    }
    case 'pantry.removed': {
      const pantry = { ...state.pantry };
      delete pantry[event.itemId];
      next.pantry = pantry;
      break;
    }
    case 'illness.started':
      next.safeModeSince = event.at;
      break;
    case 'illness.ended':
      delete next.safeModeSince;
      break;
    case 'fasting.set':
      if (event.kind) next.fasting = { kind: event.kind, since: event.at };
      else delete next.fasting;
      break;
    case 'wish.logged':
      next.wishes = [...state.wishes, { id: event.id ?? `w${event.at}`, wish: event.wish, blocker: event.blocker, foodId: event.foodId, at: event.at }].slice(-100);
      break;
    default:
      break;
  }
  return next;
}

export function replay(events: EatEvent[]): State {
  return [...events].sort((a, b) => a.at - b.at).reduce(reduce, emptyState());
}

/** Events that happened on the local day containing `now`, up to `now`. */
export function eventsToday(state: State, now: number): EatEvent[] {
  const off = state.profile?.tzOffsetMin ?? 0;
  const start = dayStart(now, off);
  return state.events.filter((e) => e.at >= start && e.at <= now);
}

/** Events on the local day containing `now`, including ones planned later that day. */
export function eventsOnDay(state: State, now: number): EatEvent[] {
  const off = state.profile?.tzOffsetMin ?? 0;
  const start = dayStart(now, off);
  const end = start + 24 * 3_600_000;
  return state.events.filter((e) => e.at >= start && e.at < end);
}

export function selfMember(state: State): Member | undefined {
  const p = state.profile;
  return p?.members.find((m) => m.id === p.selfId) ?? p?.members[0];
}
