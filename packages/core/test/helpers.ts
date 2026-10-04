import { Kernel, makeMember, makeProfile, hm } from '../src';
import type { EatEvent, PantryItem } from '../src';

/** Sunday 4 October 2026, 00:00 UTC. */
export const DAY0 = Date.UTC(2026, 9, 4);
export const T = (s: string, dayOffset = 0) => DAY0 + dayOffset * 86_400_000 + hm(s) * 60_000;

export function household() {
  return makeProfile({
    members: [
      makeMember({ id: 'me', name: 'You', goals: ['more-protein'], weightKg: 80 }),
      makeMember({ id: 'partner', name: 'Partner', diet: 'vegetarian', dislikes: ['mushrooms'] }),
      makeMember({ id: 'kid', name: 'Kid', allergens: ['nuts', 'peanuts'], mild: true, managedBy: 'me' }),
    ],
  });
}

export function kernelWith(events: EatEvent[] = [], profile = makeProfile()): Kernel {
  return new Kernel({ events: [{ type: 'profile.set', at: DAY0 - 1, profile }, ...events] });
}

export function item(name: string, expiresIn?: number, extra: Partial<PantryItem> = {}): EatEvent {
  return {
    type: 'pantry.added',
    at: DAY0,
    item: { id: `p-${name}`, name, qty: 1, unit: 'pc', location: 'fridge', addedAt: DAY0, expiresAt: expiresIn === undefined ? undefined : DAY0 + expiresIn * 86_400_000, ...extra },
  };
}
