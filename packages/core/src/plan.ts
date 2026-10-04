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
      const recs = recommend(state, catalog, { slot, k: 12 }, day + 12 * 3_600_000);
      const pick =
        recs.find((r) => (used.get(r.food.id) ?? -10) < d - 2) ?? recs.find((r) => used.get(r.food.id) !== d) ?? recs[0];
      if (!pick) continue;
      used.set(pick.food.id, d);
      meals.push({ day, slot, food: pick.food, batch: false });
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
