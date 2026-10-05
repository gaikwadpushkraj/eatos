/**
 * Domain types for the EatOS kernel.
 *
 * The kernel treats the human (and their household) as hardware, food and
 * water as resources and meals as scheduled tasks. Everything that happens
 * is recorded as an {@link EatEvent}; state is derived from the event log.
 */

/** Priority classes. Lower number = more important. */
export type Priority = 0 | 1 | 2 | 3;

export const PRIORITY_LABEL: Record<Priority, string> = {
  0: 'Safety',
  1: 'Physiological',
  2: 'Goals',
  3: 'Experience',
};

export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export type NeedKind =
  | 'safety'
  | 'medication'
  | 'hydration'
  | 'energy'
  | 'protein'
  | 'fibre'
  | 'recovery'
  | 'routine'
  | 'pleasure';

export type TaskKind = 'meal' | 'hydration' | 'medication' | 'routine';

export type TaskState = 'queued' | 'active' | 'done' | 'deferred' | 'skipped';

export interface Task {
  id: string;
  title: string;
  kind: TaskKind;
  slot?: MealSlot;
  priority: Priority;
  /** Planned start, epoch ms. */
  at: number;
  /** Latest acceptable time, epoch ms. */
  deadline: number;
  state: TaskState;
  need: NeedKind;
  /** Plain-language reasons for anything the kernel changed. */
  reasons: string[];
  /** Original planned time, set when an interrupt moved the task. */
  movedFrom?: number;
  /** True when the task should be kept small (priority inversion). */
  light?: boolean;
  /** Amount for hydration tasks. */
  waterMl?: number;
  overdue?: boolean;
}

export type Diet = 'vegan' | 'vegetarian' | 'pescatarian' | 'omnivore';

/** How permissive a diet is. A food fits a member when its rank <= theirs. */
export const DIET_RANK: Record<Diet, number> = {
  vegan: 0,
  vegetarian: 1,
  pescatarian: 2,
  omnivore: 3,
};

export type Allergen =
  | 'nuts'
  | 'peanuts'
  | 'dairy'
  | 'gluten'
  | 'egg'
  | 'soy'
  | 'fish'
  | 'shellfish'
  | 'sesame';

export type Goal = 'more-protein' | 'hydration' | 'less-waste' | 'energy' | 'performance';

export interface Member {
  id: string;
  name: string;
  diet: Diet;
  allergens: Allergen[];
  /** Ingredients or tags this member dislikes (soft constraint). */
  dislikes: string[];
  goals: Goal[];
  weightKg?: number;
  /** Prefers mild food (children, sensitive stomachs). */
  mild?: boolean;
  /** Id of the member who manages this one (child, cared-for person). */
  managedBy?: string;
}

export interface Medication {
  name: string;
  slot: MealSlot;
}

export interface Routine {
  /** Minutes after local midnight. */
  wake: number;
  sleep: number;
  meals: Record<MealSlot, number>;
  medication: Medication[];
}

export interface Profile {
  /** Id of the member using this device. */
  selfId: string;
  members: Member[];
  routine: Routine;
  /** Minimum daily energy EatOS will never plan below. */
  floorKcal: number;
  /** Local time offset from UTC in minutes (e.g. +330 for India). */
  tzOffsetMin: number;
  hideNumbers?: boolean;
}

export interface Nutrients {
  kcal: number;
  proteinG: number;
  fibreG: number;
  waterMl: number;
}

export interface Food {
  id: string;
  name: string;
  slots: MealSlot[];
  /** e.g. warm, quick, comfort, light, gentle, spicy, high-protein. */
  tags: string[];
  /** Most restrictive diet this food fits. */
  diet: Diet;
  allergens: Allergen[];
  prepMin: number;
  nutrients: Nutrients;
  ingredients: string[];
  /** Id of the dish this is a safer variant of. */
  variantOf?: string;
  /** Cooking steps; generic steps are generated when missing. */
  steps?: string[];
}

export type PantryLocation = 'fridge' | 'freezer' | 'cupboard' | 'counter';

export interface PantryItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  location: PantryLocation;
  /** Epoch ms. */
  expiresAt?: number;
  addedAt: number;
}

export type Verdict = 'liked' | 'skip' | 'never';

interface Base<T extends string> {
  type: T;
  /** Epoch ms when it happened. */
  at: number;
  id?: string;
}

export type EatEvent =
  | (Base<'profile.set'> & { profile: Profile })
  | (Base<'member.added'> & { member: Member })
  | (Base<'member.removed'> & { memberId: string })
  | (Base<'intake.logged'> & { foodId?: string; slot?: MealSlot; nutrients?: Partial<Nutrients>; memberId?: string })
  | (Base<'water.logged'> & { ml: number })
  | (Base<'workout.completed'> & { minutes: number; intensity: 'low' | 'moderate' | 'high' })
  | (Base<'sleep.logged'> & { hours: number })
  | (Base<'calendar.busy'> & { start: number; end: number; title?: string })
  | (Base<'illness.started'> & { note?: string })
  | Base<'illness.ended'>
  | (Base<'pantry.added'> & { item: PantryItem })
  | (Base<'pantry.used'> & { itemId: string; qty?: number })
  | (Base<'pantry.removed'> & { itemId: string })
  | (Base<'feedback'> & { foodId: string; verdict: Verdict })
  | (Base<'task.done'> & { taskId: string })
  | (Base<'task.skipped'> & { taskId: string })
  | (Base<'medication.taken'> & { name: string });

export type EventType = EatEvent['type'];
