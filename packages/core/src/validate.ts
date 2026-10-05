import type { EatEvent } from './types';
import { DIET_RANK } from './types';

/**
 * Strict checks for events that come from outside the kernel: sync from a
 * server or another device, backups, imports. A malformed event must never
 * reach the reducers, where it could throw and make a person's data
 * unloadable.
 */

const ALLERGENS = ['nuts', 'peanuts', 'dairy', 'gluten', 'egg', 'soy', 'fish', 'shellfish', 'sesame'];
const SLOTS = ['breakfast', 'lunch', 'snack', 'dinner'];
const LOCATIONS = ['fridge', 'freezer', 'cupboard', 'counter'];
const GOALS = ['more-protein', 'hydration', 'less-waste', 'energy', 'performance'];
const VERDICTS = ['liked', 'skip', 'never'];
const RULES = ['jain', 'satvik', 'no-onion-garlic', 'no-egg', 'no-beef', 'no-pork', 'halal', 'before-sunset'];
const CONDITIONS = ['diabetes', 'prediabetes', 'hypertension', 'high-cholesterol', 'pcos', 'thyroid', 'anaemia', 'lactose-intolerant', 'celiac', 'gout', 'kidney', 'pregnancy', 'insulin', 'eating-disorder-history', 'minor'];
const FASTS = ['navratri', 'ekadashi', 'shravan', 'ramzan', 'custom'];
const BLOCKERS = ['health', 'religion', 'allergy', 'time', 'skill', 'equipment', 'availability', 'household', 'budget', 'habit', 'other'];
const KITCHENS = ['full', 'basic', 'none'];
const INTENSITIES = ['low', 'moderate', 'high'];

const MAX_TEXT = 500;
const MAX_LIST = 200;

type R = Record<string, unknown>;
const isObj = (x: unknown): x is R => !!x && typeof x === 'object' && !Array.isArray(x);
const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const str = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length <= MAX_TEXT;
const optStr = (x: unknown) => x === undefined || (typeof x === 'string' && x.length <= MAX_TEXT);
const optNum = (x: unknown) => x === undefined || num(x);
const list = (x: unknown, ok: (v: unknown) => boolean) => Array.isArray(x) && x.length <= MAX_LIST && x.every(ok);
const oneOf = (set: string[]) => (x: unknown) => typeof x === 'string' && set.includes(x);

function member(m: unknown): string | undefined {
  if (!isObj(m)) return 'member must be an object';
  if (!str(m.id) || !str(m.name)) return 'member needs an id and a name';
  if (typeof m.diet !== 'string' || !(m.diet in DIET_RANK)) return 'member diet is not valid';
  if (!list(m.allergens, oneOf(ALLERGENS))) return 'member allergens are not valid';
  if (!list(m.dislikes, str)) return 'member dislikes are not valid';
  if (!list(m.goals, oneOf(GOALS))) return 'member goals are not valid';
  if (!optNum(m.weightKg) || (m.weightKg !== undefined && ((m.weightKg as number) <= 0 || (m.weightKg as number) > 500))) return 'member weight is not valid';
  if (m.mild !== undefined && typeof m.mild !== 'boolean') return 'member mild must be true or false';
  if (!optStr(m.managedBy)) return 'member managedBy is not valid';
  if (m.rules !== undefined && !list(m.rules, oneOf(RULES))) return 'member rules are not valid';
  if (m.conditions !== undefined && !list(m.conditions, oneOf(CONDITIONS))) return 'member conditions are not valid';
  if (m.spice !== undefined && ![0, 1, 2, 3].includes(m.spice as number)) return 'member spice is not valid';
  if (m.cuisines !== undefined && !list(m.cuisines, str)) return 'member cuisines are not valid';
  return undefined;
}

function profile(p: unknown): string | undefined {
  if (!isObj(p)) return 'profile must be an object';
  if (!str(p.selfId)) return 'profile needs selfId';
  if (!Array.isArray(p.members) || p.members.length === 0 || p.members.length > 50) return 'profile needs 1 to 50 members';
  for (const m of p.members) {
    const e = member(m);
    if (e) return e;
  }
  const r = p.routine;
  if (!isObj(r) || !num(r.wake) || !num(r.sleep) || !isObj(r.meals) || !SLOTS.every((s) => num((r.meals as R)[s]))) return 'routine is not valid';
  if (!list(r.medication, (m) => isObj(m) && str(m.name) && oneOf(SLOTS)(m.slot))) return 'medication is not valid';
  if (!num(p.floorKcal) || !num(p.tzOffsetMin) || Math.abs(p.tzOffsetMin) > 14 * 60) return 'profile numbers are not valid';
  if (p.hideNumbers !== undefined && typeof p.hideNumbers !== 'boolean') return 'hideNumbers must be true or false';
  if (p.kitchen !== undefined && !oneOf(KITCHENS)(p.kitchen)) return 'kitchen is not valid';
  if (p.city !== undefined && !oneOf(['mumbai', 'delhi', 'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'pune'])(p.city)) return 'city is not valid';
  return undefined;
}

function nutrients(n: unknown): boolean {
  return n === undefined || (isObj(n) && Object.values(n).every(num) && Object.keys(n).every((k) => ['kcal', 'proteinG', 'fibreG', 'waterMl'].includes(k)));
}

function body(e: R): string | undefined {
  switch (e.type) {
    case 'profile.set':
      return profile(e.profile);
    case 'member.added':
      return member(e.member);
    case 'member.removed':
      return str(e.memberId) ? undefined : 'memberId is required';
    case 'intake.logged':
      return optStr(e.foodId) && (e.slot === undefined || oneOf(SLOTS)(e.slot)) && nutrients(e.nutrients) && optStr(e.memberId) ? undefined : 'intake is not valid';
    case 'water.logged':
      return num(e.ml) && e.ml > 0 && e.ml <= 10_000 ? undefined : 'ml must be between 1 and 10000';
    case 'workout.completed':
      return num(e.minutes) && e.minutes > 0 && e.minutes <= 1440 && oneOf(INTENSITIES)(e.intensity) ? undefined : 'workout is not valid';
    case 'sleep.logged':
      return num(e.hours) && e.hours >= 0 && e.hours <= 24 ? undefined : 'hours must be between 0 and 24';
    case 'calendar.busy':
      return num(e.start) && num(e.end) && e.end > e.start && e.end - e.start <= 7 * 86_400_000 && optStr(e.title) ? undefined : 'calendar.busy is not valid';
    case 'illness.started':
      return optStr(e.note) ? undefined : 'note is not valid';
    case 'illness.ended':
      return undefined;
    case 'pantry.added': {
      const i = e.item;
      return isObj(i) && str(i.id) && str(i.name) && num(i.qty) && typeof i.unit === 'string' && i.unit.length <= 40 && oneOf(LOCATIONS)(i.location) && num(i.addedAt) && optNum(i.expiresAt) ? undefined : 'pantry item is not valid';
    }
    case 'pantry.used':
      return str(e.itemId) && optNum(e.qty) ? undefined : 'pantry.used is not valid';
    case 'pantry.removed':
      return str(e.itemId) ? undefined : 'itemId is required';
    case 'feedback':
      return str(e.foodId) && oneOf(VERDICTS)(e.verdict) ? undefined : 'feedback is not valid';
    case 'task.done':
    case 'task.skipped':
      return str(e.taskId) ? undefined : 'taskId is required';
    case 'medication.taken':
      return str(e.name) ? undefined : 'name is required';
    case 'fasting.set':
      return e.kind === undefined || oneOf(FASTS)(e.kind) ? undefined : 'fasting kind is not valid';
    case 'wish.logged':
      return str(e.wish) && (e.blocker === undefined || oneOf(BLOCKERS)(e.blocker)) && optStr(e.foodId) ? undefined : 'wish is not valid';
    default:
      return `unknown event type: ${String(e.type)}`;
  }
}

/** Why an event is not acceptable, or undefined when it is. */
export function eventProblem(raw: unknown): string | undefined {
  if (!isObj(raw)) return 'event must be an object';
  if (typeof raw.type !== 'string') return 'event needs a type';
  if (!num(raw.at)) return 'at must be epoch milliseconds';
  if (raw.id !== undefined && !str(raw.id)) return 'id must be a short string';
  return body(raw);
}

export function isValidEvent(raw: unknown): raw is EatEvent {
  return eventProblem(raw) === undefined;
}
