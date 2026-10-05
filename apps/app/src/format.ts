import { clock } from '@eatos/core';
import type { Kernel, PantryLocation, MealSlot } from '@eatos/core';

export function localOffset(): number {
  return -new Date().getTimezoneOffset();
}

export function timeLabel(kernel: Kernel, t: number): string {
  return clock(t, kernel.state.profile?.tzOffsetMin ?? localOffset());
}

export function greeting(kernel: Kernel, now: number): string {
  const h = Number(timeLabel(kernel, now).slice(0, 2));
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
};

export const LOCATION_LABEL: Record<PantryLocation, string> = {
  fridge: 'Fridge',
  freezer: 'Freezer',
  cupboard: 'Cupboard',
  counter: 'Counter',
};

export function capitalise(s: string): string {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

export function daysLabel(days: number | undefined): string {
  if (days === undefined) return 'No date';
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
}

export { aisleFor as aisle, shelfLifeDays } from '@eatos/core';
