import type { Food, Kernel, MealSlot } from '@eatos/core';
import type { EventInput } from './kernel';

/** Logs a meal and uses up matching pantry items. */
export function eatFood(kernel: Kernel, submitMany: (e: EventInput[]) => void, food: Food, slot: MealSlot) {
  const events: EventInput[] = [{ type: 'intake.logged', foodId: food.id, slot, memberId: kernel.state.profile?.selfId }];
  for (const item of Object.values(kernel.state.pantry)) {
    if (food.ingredients.includes(item.name.toLowerCase())) events.push({ type: 'pantry.used', itemId: item.id });
  }
  submitMany(events);
}

/** Which meal slot fits the current time, for "I ate this". */
export function slotForNow(kernel: Kernel, now: number): MealSlot {
  const next = kernel.now(now).nextMeal;
  return next?.slot ?? 'snack';
}
