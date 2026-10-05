import type { Allergen, Diet, EatEvent, MealSlot, Member, NeedKind } from '../types';
import { DIET_RANK } from '../types';
import type { State } from '../state';
import { fitFor } from '../household';
import { preferences } from '../memory';
import { hashString } from '../time';

/**
 * Delivery driver: ranks dishes from a restaurant or delivery menu for
 * the people eating. Safety rule: when someone has an allergy, a dish with
 * no allergen information is treated as unsafe, because "unknown" is not
 * the same as "none". The same goes for diets.
 */
export interface MenuItem {
  id: string;
  name: string;
  restaurant: string;
  priceCents?: number;
  /** Declared allergens. Leave undefined when the menu does not say. */
  allergens?: Allergen[];
  /** Most restrictive diet the dish fits. Undefined when unknown. */
  diet?: Diet;
  tags?: string[];
  kcal?: number;
  proteinG?: number;
  etaMin?: number;
}

export interface DeliveryQuery {
  slot?: MealSlot;
  tags?: string[];
  exclude?: string[];
  need?: NeedKind;
  maxEtaMin?: number;
  maxPriceCents?: number;
  memberIds?: string[];
  k?: number;
}

export interface DeliveryOption {
  item: MenuItem;
  score: number;
  reasons: string[];
}

/** Why a dish cannot be ordered for someone, or undefined when it can. */
export function menuBlocker(item: MenuItem, member: Member): string | undefined {
  if (member.allergens.length) {
    if (item.allergens === undefined) return `No allergen information for ${member.name}`;
    const hit = item.allergens.find((a) => member.allergens.includes(a));
    if (hit) return `Contains ${hit}`;
  }
  if (member.diet !== 'omnivore') {
    if (item.diet === undefined) return `Diet not stated for ${member.name}`;
    if (DIET_RANK[item.diet] > DIET_RANK[member.diet]) return `Not ${member.diet}`;
  }
  return undefined;
}

export function deliveryOptions(state: State, menu: MenuItem[], q: DeliveryQuery, now: number): DeliveryOption[] {
  const all = state.profile?.members ?? [];
  const eaters = q.memberIds?.length ? all.filter((m) => q.memberIds!.includes(m.id)) : all;
  const prefs = preferences(state, now);
  const out: DeliveryOption[] = [];
  for (const item of menu) {
    if (eaters.some((m) => menuBlocker(item, m))) continue;
    if (prefs[item.id]?.excluded) continue;
    if (q.exclude?.some((w) => `${item.name} ${(item.tags ?? []).join(' ')}`.toLowerCase().includes(w.toLowerCase()))) continue;
    if (q.maxEtaMin !== undefined && (item.etaMin ?? Infinity) > q.maxEtaMin) continue;
    if (q.maxPriceCents !== undefined && (item.priceCents ?? Infinity) > q.maxPriceCents) continue;

    let score = 0;
    const reasons: string[] = [];
    for (const m of eaters) {
      // Soft preferences use the same rules as home cooking, based on name and tags.
      const soft = fitFor({ id: item.id, name: item.name, slots: [], tags: item.tags ?? [], diet: item.diet ?? 'omnivore', allergens: [], prepMin: 0, nutrients: { kcal: 0, proteinG: 0, fibreG: 0, waterMl: 0 }, ingredients: [] }, m);
      if (!soft.ok && !soft.hard) score -= 2;
    }
    for (const t of q.tags ?? []) if (item.tags?.includes(t)) score += 2;
    if ((q.need === 'protein' || q.need === 'recovery') && item.proteinG) {
      score += item.proteinG / 8;
      if (item.proteinG >= 25) reasons.push(`${item.proteinG} g protein`);
    }
    if (item.etaMin !== undefined) {
      score += Math.max(0, 3 - item.etaMin / 20);
      reasons.push(`Arrives in about ${item.etaMin} min`);
    }
    if (eaters.length && (eaters.some((m) => m.allergens.length) || eaters.some((m) => m.diet !== 'omnivore'))) reasons.push('Menu says it suits everyone eating');
    score += prefs[item.id]?.score ?? 0;
    out.push({ item, score, reasons });
  }
  return out.sort((a, b) => b.score - a.score || (a.item.etaMin ?? 99) - (b.item.etaMin ?? 99)).slice(0, q.k ?? 3);
}

/** Records an order that arrived as an intake, with whatever nutrition the menu gave. */
export function orderEvents(state: State, item: MenuItem, slot: MealSlot, at: number): EatEvent[] {
  const events: EatEvent[] = [
    {
      type: 'intake.logged',
      id: `delivery:${hashString(`${item.id}|${at}`)}`,
      at,
      slot,
      memberId: state.profile?.selfId,
      nutrients: { kcal: item.kcal ?? 600, proteinG: item.proteinG ?? 0 },
    },
  ];
  return events;
}
