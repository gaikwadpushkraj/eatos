import type { Food, Member } from './types';
import type { State } from './state';
import { HALF_LIFE } from './memory';
import { hardProblem } from './rules';

/**
 * Taste profile learned from "would you eat this?" taps and later feedback.
 * Each answer teaches the features of a dish (cuisine, tags, spice), so a
 * dish never seen before can still be scored. A handful of answers on
 * deliberately different dishes is enough to start.
 */

const WEIGHT = { liked: 1, skip: -0.6, never: -1.5 } as const;

export function featuresOf(food: Food): string[] {
  const f = food.tags.filter((t) => !['quick', 'low-sodium', 'no-cook', 'lactose', 'fibre', 'high-protein', 'iron', 'low-gi', 'high-gi', 'high-sodium', 'high-purine'].includes(t)).map((t) => `tag:${t}`);
  if (food.cuisine) f.push(`cuisine:${food.cuisine}`);
  if (food.spice !== undefined) f.push(`spice:${food.spice}`);
  f.push(`diet:${food.diet === 'omnivore' ? 'meat' : 'veg'}`);
  return f;
}

export type Affinity = Record<string, number>;

export function tasteAffinity(state: State, catalog: Food[], now: number): Affinity {
  const byId = new Map(catalog.map((f) => [f.id, f]));
  const sum: Record<string, number> = {};
  const count: Record<string, number> = {};
  for (const e of state.events) {
    if (e.type !== 'feedback' || e.at > now) continue;
    const food = byId.get(e.foodId);
    if (!food) continue;
    const w = WEIGHT[e.verdict] * 0.5 ** ((now - e.at) / HALF_LIFE);
    for (const k of featuresOf(food)) {
      sum[k] = (sum[k] ?? 0) + w;
      count[k] = (count[k] ?? 0) + 1;
    }
  }
  const out: Affinity = {};
  // Shrink toward zero when there are few answers.
  for (const k of Object.keys(sum)) out[k] = sum[k]! / (count[k]! + 1.5);
  return out;
}

/** How much the taste profile likes a dish: roughly -3 to +3, 0 when nothing is known. */
export function affinityScore(food: Food, aff: Affinity): number {
  const fs = featuresOf(food).filter((k) => k in aff);
  if (!fs.length) return 0;
  const mean = fs.reduce((a, k) => a + aff[k]!, 0) / fs.length;
  return Math.max(-3, Math.min(3, mean * 4));
}

/**
 * The next dishes to ask about: ones that are safe for this person, not yet
 * answered, and as different from each other (and from what is already
 * known) as possible, so each answer teaches the most.
 */
export function nextTasteCards(state: State, catalog: Food[], member: Member | undefined, now: number, k = 8): Food[] {
  const answered = new Set(state.events.flatMap((e) => (e.type === 'feedback' ? [e.foodId] : [])));
  const known = new Set(Object.keys(tasteAffinity(state, catalog, now)));
  const pool = catalog.filter((f) => !answered.has(f.id) && (!member || !hardProblem(f, member)));
  const seen = new Set(known);
  const chosen: Food[] = [];
  while (chosen.length < k && pool.length) {
    let best = -1;
    let bestGain = -1;
    pool.forEach((f, i) => {
      const gain = featuresOf(f).filter((x) => !seen.has(x)).length;
      if (gain > bestGain) {
        bestGain = gain;
        best = i;
      }
    });
    const [pick] = pool.splice(best, 1);
    chosen.push(pick!);
    featuresOf(pick!).forEach((x) => seen.add(x));
  }
  return chosen;
}
