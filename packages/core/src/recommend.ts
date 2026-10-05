import type { Food, MealSlot, Member, NeedKind } from './types';
import type { State } from './state';
import { fitFor } from './household';
import { preferences, recentlyEaten } from './memory';
import { pantryNames, useSoon } from './housekeeping';

export interface Query {
  slot?: MealSlot;
  maxPrepMin?: number;
  /** Tags to prefer, e.g. warm, comfort. */
  tags?: string[];
  /** Words to avoid, matched against name, tags and ingredients. */
  exclude?: string[];
  /** Who is eating. Defaults to the whole household. */
  memberIds?: string[];
  need?: NeedKind;
  light?: boolean;
  k?: number;
}

export interface Recommendation {
  food: Food;
  score: number;
  reasons: string[];
  /** Ingredients not found in the pantry. */
  missing: string[];
}

function eaters(state: State, q: Query): Member[] {
  const all = state.profile?.members ?? [];
  if (!q.memberIds?.length) return all;
  return all.filter((m) => q.memberIds!.includes(m.id));
}

function matchesWord(food: Food, word: string): boolean {
  const w = word.toLowerCase();
  return food.name.toLowerCase().includes(w) || food.tags.includes(w) || food.ingredients.some((i) => i.includes(w));
}

/**
 * Mechanism: picks foods for a need. Hard filters first (allergens, diet,
 * "never", exclusions), then a soft score with plain-language reasons.
 */
export function recommend(state: State, catalog: Food[], q: Query, now: number): Recommendation[] {
  const members = eaters(state, q);
  const prefs = preferences(state, now);
  const recent = recentlyEaten(state, now);
  const have = pantryNames(state, now);
  const expiring = useSoon(state, now).map((p) => p.name.toLowerCase());
  const safe = state.safeModeSince !== undefined;

  const results: Recommendation[] = [];
  for (const food of catalog) {
    if (q.slot && !food.slots.includes(q.slot)) continue;
    if (q.maxPrepMin !== undefined && food.prepMin > q.maxPrepMin) continue;
    if (q.exclude?.some((w) => matchesWord(food, w))) continue;
    if (prefs[food.id]?.excluded) continue;
    const fits = members.map((m) => ({ m, fit: fitFor(food, m) }));
    if (fits.some((f) => f.fit.hard)) continue;

    let score = 0;
    const reasons: string[] = [];

    const soft = fits.filter((f) => !f.fit.ok);
    score -= soft.length * 2;
    const everyone = members.length > 1 && soft.length === 0;
    if (everyone) score += 1;

    for (const tag of q.tags ?? []) {
      if (food.tags.includes(tag)) score += 2;
    }

    const need = q.need;
    if (need === 'protein' || need === 'recovery') {
      score += food.nutrients.proteinG / 8;
      if (food.nutrients.proteinG >= 20) reasons.push(`${food.nutrients.proteinG} g protein closes today's gap`);
    }
    if (need === 'fibre') score += food.nutrients.fibreG / 3;
    if (need === 'hydration') score += food.nutrients.waterMl / 150;
    if (q.light) {
      score += food.tags.includes('light') ? 2 : 0;
      score -= food.nutrients.kcal / 250;
    }
    if (safe) {
      if (food.tags.includes('gentle')) {
        score += 4;
        reasons.push('Gentle on the stomach');
      } else score -= 2;
    }

    const missing = food.ingredients.filter((i) => !have.has(i));
    const coverage = food.ingredients.length ? 1 - missing.length / food.ingredients.length : 0;
    score += coverage * 3;
    if (missing.length === 0 && food.ingredients.length) reasons.push('Uses what you already have');
    const uses = expiring.filter((name) => food.ingredients.includes(name));
    if (uses.length) {
      score += uses.length * 2;
      reasons.push(`Uses ${uses.join(' and ')} before it expires`);
    }

    const pref = prefs[food.id];
    if (pref) score += pref.score;
    if (recent.has(food.id)) score -= 2;

    if (q.maxPrepMin !== undefined || food.prepMin <= 15) reasons.push(`Ready in ${food.prepMin} min`);
    if (everyone) reasons.push('Works for everyone at home');
    results.push({ food, score, reasons, missing });
  }
  return results.sort((a, b) => b.score - a.score || a.food.prepMin - b.food.prepMin).slice(0, q.k ?? 3);
}

/** Uniform pick from the shortlist for "Choose for me". */
export function chooseForMe(recs: Recommendation[], rand: () => number = Math.random): Recommendation | undefined {
  if (!recs.length) return undefined;
  return recs[Math.floor(rand() * recs.length)];
}
