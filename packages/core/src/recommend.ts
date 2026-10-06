import type { FastingKind, Food, MealSlot, Member, NeedKind } from './types';
import type { State } from './state';
import { fitFor } from './household';
import { preferences, recentlyEaten } from './memory';
import { pantryNames, useSoon } from './housekeeping';
import { FASTING, fastingGate, hasWord, healthFit } from './rules';
import { contextAt, contextFit } from './context';
import { affinityScore, tasteAffinity } from './taste';
import { dayStart, hashString } from './time';

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
  /** Words that name a dish, ingredient or cuisine to favour. */
  include?: string[];
  /** Favour dishes not tried before, with more shuffle. */
  novel?: boolean;
  /** Favour what was eaten at this slot yesterday. */
  sameAsYesterday?: boolean;
  /** Wanted protein in grams; dishes below it rank lower. */
  minProteinG?: number;
  k?: number;
}

export interface Recommendation {
  food: Food;
  score: number;
  reasons: string[];
  /** Ingredients not found in the pantry. */
  missing: string[];
}

/** The fast that applies today for these eaters, or why it is not planned. */
export function activeFast(state: State, members: Member[], now: number): { kind?: FastingKind; gate?: string } {
  const f = state.fasting;
  const off = state.profile?.tzOffsetMin ?? 0;
  if (!f || f.since > now || dayStart(f.since, off) !== dayStart(now, off)) return {};
  const gate = fastingGate(members);
  return gate ? { gate } : { kind: f.kind };
}

function eaters(state: State, q: Query): Member[] {
  const all = state.profile?.members ?? [];
  if (!q.memberIds?.length) return all;
  return all.filter((m) => q.memberIds!.includes(m.id));
}

export function matchesWord(food: Food, word: string): boolean {
  const w = word.toLowerCase();
  return hasWord(food.name, w) || food.tags.includes(w) || food.ingredients.some((i) => hasWord(i, w)) || food.cuisine?.replace('-indian', '') === w;
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
  const ctx = contextAt(now, state.profile?.tzOffsetMin ?? 0, state.profile?.routine);
  const aff = tasteAffinity(state, catalog, now);
  const fast = activeFast(state, members, now);
  const rule = fast.kind ? FASTING[fast.kind] : undefined;
  // A fast day with no meal in this slot (for example lunch in Ramzan).
  if (rule && q.slot && rule.skipSlots.includes(q.slot)) return [];
  const kitchen = state.profile?.kitchen ?? 'full';
  const yesterday = new Set(
    q.sameAsYesterday
      ? state.events.flatMap((e) => (e.type === 'intake.logged' && e.foodId && (!q.slot || e.slot === q.slot) && e.at >= dayStart(now, state.profile?.tzOffsetMin ?? 0) - 86_400_000 && e.at < dayStart(now, state.profile?.tzOffsetMin ?? 0) ? [e.foodId] : []))
      : [],
  );

  const results: Recommendation[] = [];
  for (const food of catalog) {
    if (q.slot && !food.slots.includes(q.slot)) continue;
    // A drink or a single fruit is not a main meal.
    if ((q.slot === 'lunch' || q.slot === 'dinner') && food.nutrients.kcal < 250 && !safe && !q.light) continue;
    if (q.maxPrepMin !== undefined && food.prepMin > q.maxPrepMin) continue;
    if (q.exclude?.some((w) => matchesWord(food, w))) continue;
    if (prefs[food.id]?.excluded) continue;
    if (rule?.deny(food)) continue;
    if (kitchen === 'none' && !food.tags.includes('no-cook')) continue;
    if (kitchen !== 'full' && food.tags.includes('oven')) continue;
    const fits = members.map((m) => ({ m, fit: fitFor(food, m) }));
    if (fits.some((f) => f.fit.hard)) continue;

    let score = 0;
    const reasons: string[] = [];

    const soft = fits.filter((f) => !f.fit.ok);
    score -= soft.length * 2;
    const everyone = members.length > 1 && soft.length === 0;
    if (everyone) score += 1;

    const need = q.need;
    // Declared conditions, spice and cuisine: soft, never removing a food.
    for (const { m } of fits) {
      const h = healthFit(food, m);
      // Someone's health nudge is never diluted by the rest of the table; a good fit for one is shared.
      score += h.delta < 0 ? h.delta : h.delta / Math.max(1, members.length);
      for (const r of h.reasons) if (members.length === 1 && !reasons.includes(r)) reasons.push(r);
      if (m.cuisines?.length && food.cuisine && m.cuisines.includes(food.cuisine)) {
        score += 1.5 / members.length;
        if (members.length === 1) reasons.push('A taste you grew up with');
      }
      if (m.spice !== undefined && food.spice === m.spice) score += 0.5 / members.length;
    }
    const cf = contextFit(food, ctx);
    score += cf.delta;
    reasons.push(...cf.reasons);
    const liked = affinityScore(food, aff);
    score += liked;
    if (liked >= 1.5) reasons.push('Close to dishes you enjoy');
    if (rule && rule.label && !reasons.includes(`Fits your ${rule.label.toLowerCase()}`)) reasons.push(`Fits your ${rule.label.toLowerCase()}`);

    for (const word of q.include ?? []) {
      if (matchesWord(food, word)) {
        score += 3;
        if (!reasons.includes(`Matches “${word}”`)) reasons.push(`Matches “${word}”`);
      }
    }
    if (q.minProteinG !== undefined && food.nutrients.proteinG < q.minProteinG) score -= (q.minProteinG - food.nutrients.proteinG) / 6;
    // A recovery snack has to bring protein; water alone is not one.
    if (need === 'recovery' && food.nutrients.proteinG < 10) score -= 4;
    if (fast.kind === 'ramzan' && !fast.gate) {
      if (q.slot === 'dinner' && food.tags.includes('iftar')) {
        score += 3;
        reasons.push('A gentle way to break the fast');
      }
      if (q.slot === 'breakfast' && (food.nutrients.fibreG >= 5 || food.nutrients.proteinG >= 12)) score += 1.5;
    }

    for (const tag of q.tags ?? []) {
      if (food.tags.includes(tag)) score += 2;
    }

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

    if (q.novel) {
      if (!prefs[food.id]) score += 2;
      score += ((parseInt(hashString(`${food.id}:${Math.floor(now / 60_000)}`), 36) || 0) % 1000) / 1000 * 3;
      if (food.cuisine && members.some((m) => m.cuisines?.includes(food.cuisine!))) score += 0.5;
    }
    if (q.sameAsYesterday && yesterday.has(food.id)) {
      score += 8;
      reasons.push('The same as yesterday');
    }
    // A little day-to-day variety: the same good dish should not win every single day.
    score += ((parseInt(hashString(`${food.id}:${Math.floor((now + (state.profile?.tzOffsetMin ?? 0) * 60_000) / 86_400_000)}`), 36) || 0) % 1000) / 1000 * 1.2;

    const pref = prefs[food.id];
    if (pref) score += pref.score;
    if (recent.has(food.id) && !q.sameAsYesterday) score -= 2;

    if (q.maxPrepMin !== undefined || food.prepMin <= 15) reasons.push(`Ready in ${food.prepMin} min`);
    if (everyone) reasons.push('Works for everyone at home');
    results.push({ food, score, reasons, missing });
  }
  return results.sort((a, b) => b.score - a.score || a.food.prepMin - b.food.prepMin).slice(0, q.k ?? 3);
}

/** Plain notes about a request: why a fast was not planned, things to ask a clinician. */
export function queryNotes(state: State, q: Query, now: number): string[] {
  const members = eaters(state, q);
  const notes: string[] = [];
  const fast = activeFast(state, members, now);
  if (fast.gate) notes.push(fast.gate);
  if (fast.kind && members.some((m) => m.conditions?.some((c) => c === 'diabetes' || c === 'prediabetes' || c === 'hypertension' || c === 'kidney'))) notes.push('If you take medicine for diabetes, blood pressure or kidneys, check with your doctor before a fast, and drink water when the fast allows.');
  const fl = fast.kind ? FASTING[fast.kind] : undefined;
  if (fl && q.slot && fl.skipSlots.includes(q.slot)) notes.push(`${fl.label}: no ${q.slot} today.`);
  return notes;
}

/** Uniform pick from the shortlist for "Choose for me". */
export function chooseForMe(recs: Recommendation[], rand: () => number = Math.random): Recommendation | undefined {
  if (!recs.length) return undefined;
  return recs[Math.floor(rand() * recs.length)];
}
