import type { Food, Member } from './types';
import { hardProblem } from './rules';

export interface Fit {
  memberId: string;
  ok: boolean;
  /** Hard constraint broken (diet or allergen). */
  hard: boolean;
  reason: string;
}

/** Does a food fit one member? Allergens and diet are hard; the rest soft. */
export function fitFor(food: Food, member: Member): Fit {
  const problem = hardProblem(food, member);
  if (problem) return { memberId: member.id, ok: false, hard: true, reason: problem };
  const disliked = member.dislikes.find((d) => food.ingredients.some((i) => i.includes(d)) || food.tags.includes(d));
  if (disliked) return { memberId: member.id, ok: false, hard: false, reason: `Dislikes ${disliked}` };
  if (((member.mild || member.conditions?.includes('child-under-5')) && ((food.spice ?? 0) >= 2 || food.tags.includes('spicy'))) || (member.spice !== undefined && (food.spice ?? 0) > member.spice + 1)) return { memberId: member.id, ok: false, hard: false, reason: 'Too spicy' };
  return { memberId: member.id, ok: true, hard: false, reason: 'Fits' };
}

export function fitsAll(food: Food, members: Member[]): boolean {
  return members.every((m) => fitFor(food, m).ok);
}

export function safeForAll(food: Food, members: Member[]): boolean {
  return members.every((m) => !fitFor(food, m).hard);
}

export interface FitRow {
  food: Food;
  fits: Fit[];
  everyone: boolean;
}

/** Who each dish works for. */
export function fitMatrix(foods: Food[], members: Member[]): FitRow[] {
  return foods.map((food) => {
    const fits = members.map((m) => fitFor(food, m));
    return { food, fits, everyone: fits.every((f) => f.ok) };
  });
}

export interface Resolution {
  requested: Food;
  chosen: Food;
  substituted: boolean;
  reason: string;
}

/**
 * Two wishes, one meal. When a requested dish breaks someone's constraint,
 * look for a variant of the same dish that fits everyone. If there is none,
 * keep the request but say who cannot eat it.
 */
export function resolveRequest(requested: Food, members: Member[], catalog: Food[]): Resolution {
  if (fitsAll(requested, members)) return { requested, chosen: requested, substituted: false, reason: 'Works for everyone' };
  const family = requested.variantOf ?? requested.id;
  const variant = catalog.find((f) => f.id !== requested.id && (f.variantOf === family || f.id === family) && fitsAll(f, members));
  if (variant) {
    const broken = members.map((m) => ({ m, fit: fitFor(requested, m) })).find((x) => !x.fit.ok);
    return {
      requested,
      chosen: variant,
      substituted: true,
      reason: `${requested.name} does not work for ${broken?.m.name ?? 'someone'} (${broken?.fit.reason.toLowerCase()}), so ${variant.name} is planned instead`,
    };
  }
  const who = members.filter((m) => !fitFor(requested, m).ok).map((m) => m.name);
  return { requested, chosen: requested, substituted: false, reason: `No safe version found. Plan something else for ${who.join(', ')}` };
}
