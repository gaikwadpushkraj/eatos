import type { EatEvent, Food, MealSlot, NeedKind, Priority, Task } from './types';
import type { State } from './state';
import { eventsOnDay, eventsToday } from './state';
import { biggestGap, healthChecks, intakeToday, targets } from './health';
import { atMinute, clock, HOUR, MINUTE } from './time';

const SLOT_TITLE: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
};

/** Default priority per meal slot. Snacks are "experience" until inverted. */
const SLOT_PRIORITY: Record<MealSlot, Priority> = {
  breakfast: 1,
  lunch: 1,
  snack: 3,
  dinner: 1,
};

/** How close (ms) a low-priority snack may sit before a main meal. */
export const INVERSION_WINDOW = 2 * HOUR;
/** Largest single hydration ask. */
export const MAX_SIP_ML = 500;
/** Closer than this, the snack is folded into the meal. */
export const MERGE_WINDOW = 45 * MINUTE;

/** Re-prioritisation order: priority class first, then earliest deadline. */
export function compareTasks(a: Task, b: Task): number {
  return a.priority - b.priority || a.deadline - b.deadline || a.at - b.at;
}

function task(t: Omit<Task, 'state' | 'reasons'> & { reasons?: string[] }): Task {
  return { state: 'queued', reasons: [], ...t };
}

/** Step 1: scheduled tasks from the routine. */
function routineTasks(state: State, now: number): Task[] {
  const p = state.profile!;
  const off = p.tzOffsetMin;
  const r = p.routine;
  const day = (m: number) => atMinute(now, m, off);
  const tasks: Task[] = [];
  const safe = state.safeModeSince !== undefined;

  for (const slot of ['breakfast', 'lunch', 'snack', 'dinner'] as MealSlot[]) {
    if (safe && slot === 'snack') continue;
    const at = day(r.meals[slot]);
    tasks.push(
      task({
        id: `meal:${slot}`,
        title: safe ? `Gentle ${SLOT_TITLE[slot].toLowerCase()}` : SLOT_TITLE[slot],
        kind: 'meal',
        slot,
        priority: SLOT_PRIORITY[slot],
        at,
        deadline: at + (slot === 'snack' ? 1 : 2) * HOUR,
        need: slot === 'snack' ? 'pleasure' : 'energy',
      }),
    );
  }

  for (const med of r.medication) {
    const at = day(r.meals[med.slot]);
    tasks.push(
      task({
        id: `med:${med.name}`,
        title: `${med.name} with ${SLOT_TITLE[med.slot].toLowerCase()}`,
        kind: 'medication',
        slot: med.slot,
        priority: 0,
        at,
        deadline: at + 30 * MINUTE,
        need: 'medication',
      }),
    );
  }

  // Hydration checkpoints spread over the waking day.
  const target = targets(state, now).waterMl;
  const every = safe ? 2 * 60 : 3 * 60;
  const points: number[] = [];
  for (let m = r.wake + 60; m <= r.sleep - 60; m += every) points.push(m);
  points.forEach((m, i) => {
    const at = day(m);
    tasks.push(
      task({
        id: `water:${i}`,
        title: `Drink ${Math.round(target / points.length / 50) * 50} ml water`,
        kind: 'hydration',
        priority: 1,
        at,
        deadline: at + every * MINUTE,
        need: 'hydration',
        waterMl: Math.round((target * (i + 1)) / points.length),
      }),
    );
  });

  tasks.push(
    task({
      id: 'routine:wind-down',
      title: 'Wind down, no caffeine',
      kind: 'routine',
      priority: 3,
      at: day(r.sleep - 90),
      deadline: day(r.sleep),
      need: 'routine',
    }),
  );
  return tasks;
}

/** Step 2: event interrupts change the plan. */
function applyInterrupts(state: State, tasks: Task[], now: number): Task[] {
  const off = state.profile!.tzOffsetMin;
  const day = eventsOnDay(state, now);
  for (const e of day) {
    if (e.type === 'calendar.busy') {
      for (const t of tasks) {
        if (t.kind !== 'meal' && t.kind !== 'medication') continue;
        if (t.at >= e.start && t.at < e.end) {
          const from = t.movedFrom ?? t.at;
          const shift = e.end + 30 * MINUTE - t.at;
          t.movedFrom = from;
          t.at += shift;
          t.deadline += shift;
          t.reasons.push(`Moved from ${clock(from, off)}: ${e.title ?? 'busy'} until ${clock(e.end, off)}`);
        }
      }
    }
    if (e.type === 'workout.completed' && e.at <= now && (e.minutes >= 45 || e.intensity === 'high')) {
      const at = e.at + 30 * MINUTE;
      const mealNear = tasks.some((t) => t.kind === 'meal' && t.priority <= 1 && Math.abs(t.at - at) < 90 * MINUTE);
      if (!mealNear) {
        tasks.push(
          task({
            id: `recovery:${e.at}`,
            title: 'Recovery snack',
            kind: 'meal',
            slot: 'snack',
            priority: 2,
            at,
            deadline: at + HOUR,
            need: 'recovery',
            reasons: [`After your ${e.minutes} minute workout`],
          }),
        );
      }
    }
    if (e.type === 'sleep.logged' && e.hours < 7) {
      const wind = tasks.find((t) => t.id === 'routine:wind-down');
      if (wind) {
        wind.priority = 2;
        wind.reasons.push(`Only ${e.hours} h sleep last night, so an earlier wind down helps`);
      }
    }
  }
  if (state.safeModeSince !== undefined) {
    for (const t of tasks) {
      if (t.kind === 'hydration') {
        t.priority = 0;
        t.reasons.push('Safe mode: fluids come first while you recover');
      }
    }
  }
  return tasks;
}

/**
 * Step 3: priority inversion. A low-priority snack shortly before a
 * higher-priority meal uses up the appetite (shared resource) that the
 * meal needs. Resolution: priority inheritance; the snack takes the
 * meal's priority and is kept light, serving the meal's need. Very close
 * snacks are folded into the meal.
 */
export function resolveInversions(tasks: Task[], gapNeed: NeedKind | undefined, tzOffsetMin = 0): Task[] {
  const meals = tasks.filter((t) => t.kind === 'meal').sort((a, b) => a.at - b.at);
  for (const snack of meals) {
    if (snack.slot !== 'snack' || snack.state === 'done') continue;
    const blocked = meals.find(
      (m) => m !== snack && m.slot !== 'snack' && m.priority < snack.priority && m.at > snack.at && m.at - snack.at <= INVERSION_WINDOW,
    );
    if (!blocked) continue;
    if (blocked.at - snack.at < MERGE_WINDOW) {
      snack.state = 'deferred';
      snack.reasons.push(`Folded into ${blocked.title.toLowerCase()} at ${clock(blocked.at, tzOffsetMin)}`);
      continue;
    }
    snack.priority = blocked.priority;
    snack.light = true;
    snack.need = gapNeed ?? blocked.need;
    snack.reasons.push(`Kept light so ${blocked.title.toLowerCase()} at ${clock(blocked.at, tzOffsetMin)} still fits`);
  }
  return tasks;
}

/** Step 4: mark what is done, active or overdue. */
function applyProgress(state: State, catalog: Food[], tasks: Task[], now: number): Task[] {
  const today = eventsToday(state, now);
  const doneIds = new Set(today.filter((e): e is Extract<EatEvent, { type: 'task.done' }> => e.type === 'task.done').map((e) => e.taskId));
  const skipped = new Set(today.filter((e): e is Extract<EatEvent, { type: 'task.skipped' }> => e.type === 'task.skipped').map((e) => e.taskId));
  const slotsEaten = new Set(today.flatMap((e) => (e.type === 'intake.logged' && e.slot ? [e.slot] : [])));
  const meds = new Set(today.flatMap((e) => (e.type === 'medication.taken' ? [e.name] : [])));
  // Water from food counts too, matching the hydration health check.
  const water = intakeToday(state, catalog, now).waterMl;

  for (const t of tasks) {
    if (t.state === 'deferred') continue;
    if (doneIds.has(t.id)) t.state = 'done';
    else if (skipped.has(t.id)) t.state = 'skipped';
    else if (t.kind === 'meal' && t.slot && slotsEaten.has(t.slot) && !t.id.startsWith('recovery')) t.state = 'done';
    else if (t.kind === 'medication' && meds.has(t.id.slice(4))) t.state = 'done';
    else if (t.kind === 'hydration' && t.waterMl !== undefined && water >= t.waterMl) t.state = 'done';
  }
  // Hydration: earlier missed checkpoints roll into the latest due one,
  // and each pending checkpoint asks only for what is still missing.
  const dueWater = tasks.filter((t) => t.kind === 'hydration' && t.state === 'queued' && t.at <= now).sort((a, b) => a.at - b.at);
  for (const t of dueWater.slice(0, -1)) {
    t.state = 'deferred';
    t.reasons.push('Rolled into the next water check');
  }
  for (const t of dueWater.slice(-1)) {
    if (t.state === 'queued' && t.waterMl !== undefined) {
      // Never ask for more than a comfortable glass or two at once.
      t.title = `Drink ${Math.min(MAX_SIP_ML, Math.max(50, Math.round((t.waterMl - water) / 50) * 50))} ml water`;
    }
  }

  // A meal whose window has passed is missed, not active: the next meal
  // makes up for it. Medication stays active until taken (P0).
  for (const t of tasks) {
    if (t.state !== 'queued' || t.deadline >= now) continue;
    t.overdue = true;
    if (t.kind === 'meal' || t.kind === 'routine') {
      t.state = 'skipped';
      t.reasons.push('Missed. The next meal makes up for it');
    }
  }
  const pending = tasks.filter((t) => t.state === 'queued');
  const due = pending.filter((t) => t.at <= now).sort(compareTasks);
  if (due[0]) due[0].state = 'active';
  return tasks;
}

/** The full day's schedule, ordered by time. */
export function buildSchedule(state: State, catalog: Food[], now: number): Task[] {
  if (!state.profile) return [];
  const gap = biggestGap(healthChecks(state, catalog, now));
  const gapNeed = gap ? (gap.key as NeedKind) : undefined;
  let tasks = routineTasks(state, now);
  tasks = applyInterrupts(state, tasks, now);
  tasks = resolveInversions(tasks, gapNeed, state.profile.tzOffsetMin);
  tasks = applyProgress(state, catalog, tasks, now);
  return tasks.sort((a, b) => a.at - b.at);
}

/** What should happen next: the active task, else the next queued one. */
export function nextTask(tasks: Task[], now: number): Task | undefined {
  const active = tasks.find((t) => t.state === 'active');
  if (active) return active;
  return tasks.filter((t) => t.state === 'queued' && t.at > now).sort((a, b) => a.at - b.at)[0];
}

/** Next pending meal, for the "Next up" card. */
export function nextMeal(tasks: Task[], now: number): Task | undefined {
  return tasks
    .filter((t) => t.kind === 'meal' && (t.state === 'queued' || t.state === 'active') && t.deadline >= now)
    .sort((a, b) => a.at - b.at)[0];
}
