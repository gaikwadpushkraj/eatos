import type { Allergen, Condition, DietRule, FastingKind, Food, MealSlot, Member } from './types';
import { DIET_RANK } from './types';

/**
 * The constraint engine. Hard rules are applied before any scoring and can
 * never be outweighed: declared allergies, coeliac disease, religious and
 * household rules, pregnancy hazards, and fasting day rules. Declared
 * health conditions only nudge the ranking (soft). EatOS never infers a
 * condition from what someone eats.
 */

const has = (food: Food, words: string[]) => food.ingredients.find((i) => words.some((w) => i.toLowerCase().includes(w)));

const MEAT = ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'bacon', 'ham', 'fish', 'prawn', 'shrimp', 'crab', 'salmon', 'egg', 'gelatin'];

/** Ingredient words each rule rules out. Households differ: these are defaults. */
const RULE_DENY: Record<DietRule, string[]> = {
  // Jain: no root vegetables, onion, garlic, fungi, honey, meat or egg.
  jain: ['onion', 'garlic', 'potato', 'carrot', 'radish', 'beetroot', 'turnip', 'ginger', 'yam', 'mushroom', 'honey', ...MEAT],
  // Satvik: no onion, garlic, egg or meat.
  satvik: ['onion', 'garlic', 'mushroom', ...MEAT],
  'no-onion-garlic': ['onion', 'garlic'],
  'no-egg': ['egg', 'gelatin'],
  'no-beef': ['beef', 'veal'],
  'no-pork': ['pork', 'bacon', 'ham', 'sausage'],
  halal: ['pork', 'bacon', 'ham', 'sausage', 'alcohol', 'wine', 'beer', 'rum', 'gelatin'],
};

export const RULE_LABEL: Record<DietRule, string> = {
  jain: 'Jain',
  satvik: 'Satvik',
  'no-onion-garlic': 'No onion or garlic',
  'no-egg': 'No egg',
  'no-beef': 'No beef',
  'no-pork': 'No pork',
  halal: 'Halal',
};

/** Ingredients that are unsafe in pregnancy. Everything else is left to the person's clinician. */
const PREGNANCY_HAZARD = ['raw papaya', 'raw egg', 'unpasteurised', 'unpasteurized', 'alcohol', 'wine', 'beer', 'raw sprouts', 'raw fish', 'swordfish', 'shark', 'raw milk'];

export function allergensOf(m: Member): Allergen[] {
  return m.conditions?.includes('celiac') && !m.allergens.includes('gluten') ? [...m.allergens, 'gluten'] : m.allergens;
}

/** The first hard rule a food breaks for a person, as a short reason. */
export function hardProblem(food: Food, m: Member): string | undefined {
  const allergen = food.allergens.find((a) => allergensOf(m).includes(a));
  if (allergen) return m.conditions?.includes('celiac') && allergen === 'gluten' ? 'Contains gluten' : `Contains ${allergen}`;
  if (DIET_RANK[food.diet] > DIET_RANK[m.diet]) return `Not ${m.diet}`;
  for (const rule of m.rules ?? []) {
    const hit = has(food, RULE_DENY[rule]);
    if (hit) return `Not ${RULE_LABEL[rule].toLowerCase()} (${hit})`;
  }
  if (m.conditions?.includes('pregnancy')) {
    const hit = has(food, PREGNANCY_HAZARD);
    if (hit) return `Not advised in pregnancy (${hit})`;
  }
  return undefined;
}

export interface HealthFit {
  /** Score change. Negative never removes a food; it only ranks it lower. */
  delta: number;
  /** Positive, plain reasons. Nothing is labelled "bad". */
  reasons: string[];
}

/** Soft nudges from declared conditions. */
export function healthFit(food: Food, m: Member): HealthFit {
  const c = m.conditions ?? [];
  const t = (tag: string) => food.tags.includes(tag);
  let delta = 0;
  const reasons: string[] = [];
  const sugar = c.includes('diabetes') || c.includes('prediabetes') || c.includes('pcos');
  if (sugar) {
    if (t('high-gi')) delta -= 3;
    if (t('sweet')) delta -= 3;
    if (t('fried')) delta -= 1.5;
    if (t('low-gi')) {
      delta += 2;
      reasons.push('Steadier on blood sugar');
    }
    if (food.nutrients.fibreG >= 8) delta += 1;
  }
  if (c.includes('hypertension') || c.includes('kidney')) {
    if (t('high-sodium')) delta -= 3;
    if (t('low-sodium')) {
      delta += 1;
      reasons.push('Easy on salt');
    }
  }
  if (c.includes('high-cholesterol')) {
    if (t('fried')) delta -= 2;
    if (food.nutrients.fibreG >= 8) {
      delta += 1;
      reasons.push('Good fibre');
    }
  }
  if (c.includes('anaemia') && t('iron')) {
    delta += 2;
    reasons.push('A good iron source');
  }
  if (c.includes('gout') && t('high-purine')) delta -= 3;
  if (c.includes('kidney') && t('high-potassium')) delta -= 3;
  if (c.includes('lactose-intolerant') && t('lactose')) delta -= 4;
  if (c.includes('pregnancy') && t('street')) delta -= 3;
  return { delta, reasons };
}

/** Questions for a clinician, never advice. One short line each. */
export function askDoctorFlags(m: Member): string[] {
  const c = m.conditions ?? [];
  const out: string[] = [];
  if (c.includes('kidney')) out.push('Kidney conditions need limits set for you. Please follow your dietitian’s plan.');
  if (c.includes('insulin')) out.push('Food timing matters with insulin or sulfonylureas. Please plan meals and any fasting with your doctor.');
  if (c.includes('pregnancy')) out.push('Supplements and any change in diet in pregnancy are for your clinician to guide.');
  if (c.includes('thyroid')) out.push('Some medicines work best at a set time apart from food. Ask your doctor or pharmacist.');
  return out;
}

// ---------- Fasting ----------

export interface FastingRule {
  label: string;
  /** The first ingredient that breaks this fast, if any. */
  deny: (food: Food) => string | undefined;
  /** Slots with no meal on a fast day. */
  skipSlots: MealSlot[];
}

const FAST_ALLOWED = ['samak rice', 'kuttu', 'rajgira', 'sabudana', 'singhara', 'water chestnut', 'sendha namak', 'makhana', 'amaranth'];
const GRAIN_PULSE_ALLIUM = ['wheat', 'rice', 'dal', 'lentil', 'moong', 'chana', 'chickpea', 'rajma', 'beans', 'onion', 'garlic', 'egg', 'chicken', 'mutton', 'fish', 'prawn', 'bread', 'pasta', 'flour', 'atta', 'maida', 'besan', 'poha', 'semolina', 'suji', 'rava', 'oats', 'corn', 'millet', 'ragi', 'jowar', 'bajra', 'tofu', 'soy', 'pizza dough', 'tortilla', 'quinoa'];

function denyWords(words: string[]) {
  return (food: Food) => food.ingredients.find((i) => !FAST_ALLOWED.some((a) => i.toLowerCase().includes(a)) && words.some((w) => i.toLowerCase().includes(w)));
}

export const FASTING: Record<FastingKind, FastingRule> = {
  navratri: { label: 'Navratri fast', deny: denyWords(GRAIN_PULSE_ALLIUM), skipSlots: [] },
  ekadashi: { label: 'Ekadashi fast', deny: denyWords(GRAIN_PULSE_ALLIUM), skipSlots: [] },
  shravan: { label: 'Shravan', deny: denyWords(['onion', 'garlic', ...MEAT]), skipSlots: [] },
  ramzan: { label: 'Ramzan fast', deny: () => undefined, skipSlots: ['lunch'] },
  custom: { label: 'Fasting', deny: () => undefined, skipSlots: [] },
};

/** Why a fast cannot be planned for these people, or undefined when it can. */
export function fastingGate(members: Member[]): string | undefined {
  for (const m of members) {
    const c = m.conditions ?? [];
    if (c.includes('insulin')) return `Fasting with insulin or sulfonylureas needs your doctor’s plan, so EatOS will not plan a fast${members.length > 1 ? ` for ${m.name}` : ''}.`;
    if (c.includes('pregnancy')) return 'Fasting in pregnancy is for your clinician to advise, so EatOS will not plan a fast.';
    if (c.includes('minor')) return 'EatOS does not plan fasts for children and teens.';
    if (c.includes('eating-disorder-history')) return 'EatOS keeps meals regular and will not plan a fast.';
  }
  return undefined;
}
