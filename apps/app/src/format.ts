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

const AISLES: [string, RegExp][] = [
  ['Produce', /spinach|tomato|onion|garlic|lemon|banana|berries|apple|pepper|broccoli|carrot|cucumber|lettuce|mushroom|potato|ginger|basil|peas/],
  ['Dairy and protein', /yogurt|milk|paneer|egg|tofu|chicken|salmon|parmesan|mozzarella|hummus/],
  ['Grains and pulses', /rice|oats|lentil|dal|chickpea|bread|pasta|tortilla|flatbread|dough|flattened/],
];

export function aisle(name: string): string {
  return AISLES.find(([, re]) => re.test(name))?.[0] ?? 'Other';
}

export function shelfLifeDays(name: string): number {
  const a = aisle(name);
  return a === 'Produce' ? 5 : a === 'Dairy and protein' ? 7 : a === 'Grains and pulses' ? 180 : 30;
}
