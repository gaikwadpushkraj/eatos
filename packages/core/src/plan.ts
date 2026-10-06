import type { Food, MealSlot } from './types';
import type { State } from './state';
import { recommend } from './recommend';
import { pantryNames } from './housekeeping';
import { DAY, dayStart } from './time';

export interface PlannedMeal {
  day: number;
  slot: MealSlot;
  food: Food;
  /** Same dish as an earlier meal this week: cook once, eat twice. */
  batch: boolean;
  /** For a household: who this dinner is not for, and what they have instead. */
  alsoFor?: { name: string; food: Food }[];
}

export interface WeekPlan {
  start: number;
  meals: PlannedMeal[];
}

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

/**
 * Plans `days` days. Avoids repeating a dish on consecutive days except
 * for deliberate batch cooking: a dinner can return as next day's lunch.
 */
export function planWeek(state: State, catalog: Food[], from: number, days = 7): WeekPlan {
  const off = state.profile?.tzOffsetMin ?? 0;
  const start = dayStart(from, off);
  const meals: PlannedMeal[] = [];
  const used = new Map<string, number>();
  for (let d = 0; d < days; d++) {
    const day = start + d * DAY;
    for (const slot of SLOTS) {
      const prevDinner = meals.find((m) => m.day === day - DAY && m.slot === 'dinner');
      if (slot === 'lunch' && prevDinner && prevDinner.food.slots.includes('lunch') && !prevDinner.batch) {
        meals.push({ day, slot, food: prevDinner.food, batch: true });
        continue;
      }
      // A family does not all eat the same thing: on alternate dinners the dish is chosen for those who eat meat or fish,
      // and everyone else gets a dish of their own beside it.
      const members = state.profile?.members ?? [];
      const meatEaters = members.filter((m) => m.diet === 'omnivore' || m.diet === 'pescatarian');
      const split = slot === 'dinner' && members.length >= 3 && meatEaters.length >= 1 && meatEaters.length < members.length && d % 2 === 1;
      const recs = recommend(state, catalog, { slot, k: 12, ...(split ? { memberIds: meatEaters.map((m) => m.id), preferMeat: true } : {}) }, day + 12 * 3_600_000);
      const pick =
        recs.find((r) => (used.get(r.food.id) ?? -10) < d - 2) ?? recs.find((r) => used.get(r.food.id) !== d) ?? recs[0];
      if (!pick) continue;
      used.set(pick.food.id, d);
      const alsoFor = split
        ? members
            .filter((m) => !meatEaters.includes(m))
            .flatMap((m) => {
              const own = recommend(state, catalog, { slot, k: 3, memberIds: [m.id] }, day + 12 * 3_600_000).find((r) => r.food.id !== pick.food.id);
              return own ? [{ name: m.name, food: own.food }] : [];
            })
        : undefined;
      meals.push({ day, slot, food: pick.food, batch: false, ...(alsoFor?.length ? { alsoFor } : {}) });
    }
  }
  return { start, meals };
}

export interface GroceryLine {
  name: string;
  meals: number;
  slots: MealSlot[];
}

/** Ingredients the plan needs that are not in the pantry. */
export function groceryList(state: State, plan: WeekPlan, now: number): GroceryLine[] {
  const have = pantryNames(state, now);
  const lines = new Map<string, GroceryLine>();
  for (const m of plan.meals) {
    if (m.batch) continue;
    for (const ing of m.food.ingredients) {
      if (have.has(ing)) continue;
      const line = lines.get(ing) ?? { name: ing, meals: 0, slots: [] };
      line.meals += 1;
      if (!line.slots.includes(m.slot)) line.slots.push(m.slot);
      lines.set(ing, line);
    }
  }
  return [...lines.values()].sort((a, b) => b.meals - a.meals || a.name.localeCompare(b.name));
}
