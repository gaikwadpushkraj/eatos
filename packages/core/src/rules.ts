import type { Allergen, Condition, DietRule, FastingKind, Food, MealSlot, Member } from './types';
import { DIET_RANK } from './types';

/**
 * The constraint engine. Hard rules are applied before any scoring and can
 * never be outweighed: declared allergies, coeliac disease, religious and
 * household rules, pregnancy hazards, and fasting day rules. Declared
 * health conditions only nudge the ranking (soft). EatOS never infers a
 * condition from what someone eats.
 */

/** Whole-word match, plural-tolerant, so "rum" does not match "drumstick" or "ice" match "rice". */
const WORD_RE = new Map<string, RegExp>();
export function hasWord(text: string, word: string): boolean {
  let re = WORD_RE.get(word);
  if (!re) {
    re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es)?\\b`, 'i');
    WORD_RE.set(word, re);
  }
  return re.test(text);
}
const has = (food: Food, words: string[]) => food.ingredients.find((i) => words.some((w) => hasWord(i, w)));

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
  // A timing rule only: it changes when dinner is planned, not what is in it.
  'before-sunset': [],
};

export const RULE_LABEL: Record<DietRule, string> = {
  jain: 'Jain',
  satvik: 'Satvik',
  'no-onion-garlic': 'No onion or garlic',
  'no-egg': 'No egg',
  'no-beef': 'No beef',
  'no-pork': 'No pork',
  halal: 'Halal',
  'before-sunset': 'Eat before sunset',
};

/** Ingredients that are unsafe in pregnancy. Everything else is left to the person's clinician. */
const PREGNANCY_HAZARD = ['raw papaya', 'raw egg', 'unpasteurised', 'unpasteurized', 'alcohol', 'wine', 'beer', 'raw fish', 'swordfish', 'shark', 'raw milk', 'liver', 'pate', 'king mackerel', 'tilefish', 'marlin', 'sushi', 'sashimi', 'oyster', 'smoked salmon', 'raw meat', 'undercooked', 'green papaya', 'kaccha papita', 'unripe papaya', 'brie', 'camembert', 'blue cheese', 'bhang', 'whisky', 'liquor', 'vodka', 'rum'];

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
    const hit = has(food, PREGNANCY_HAZARD) ?? (food.tags.includes('raw-sprouts') ? 'raw sprouts' : undefined);
    if (hit) return `Not advised in pregnancy (${hit})`;
  }
  // Small children can choke on whole nuts, popcorn and raw hard sticks, and honey is not for babies.
  if (m.conditions?.includes('child-under-5') && (food.tags.includes('choking-hazard') || has(food, ['honey']))) return 'Not safe for a child under 5 (choking)';
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
  if (c.includes('older-adult-soft')) {
    if (t('crunchy')) delta -= 4;
    if (t('soft')) {
      delta += 1.5;
      reasons.push('Soft and easy to chew');
    }
  }
  if (c.includes('gerd')) {
    if (t('spicy') || (food.spice ?? 0) >= 3) delta -= 2;
    if (t('fried')) delta -= 2;
    if (t('gentle')) delta += 1;
  }
  if (c.includes('lactation')) {
    if (t('iron') || t('high-protein')) delta += 1;
    if (food.nutrients.waterMl >= 250) delta += 0.5;
  }
  if (c.includes('high-cholesterol') || c.includes('hypertension')) {
    if (t('lactose') && t('fried')) delta -= 0.5;
  }
  return { delta, reasons };
}

/** Questions for a clinician, never advice. One short line each. */
export function askDoctorFlags(m: Member): string[] {
  const c = m.conditions ?? [];
  const out: string[] = [];
  if (c.includes('kidney')) out.push('Kidney conditions need limits set for you. Please follow your dietitian’s plan.');
  if (c.includes('insulin')) out.push('Food timing matters with insulin or sulfonylureas. Please plan meals and any fasting with your doctor.');
  if (c.includes('pregnancy')) out.push('Supplements and any change in diet in pregnancy are for your clinician to guide.');
  if (c.includes('lactation')) out.push('Ask your doctor or lactation consultant about iron or other supplements while feeding.');
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
const GRAIN_PULSE_ALLIUM = ['wheat', 'rice', 'dal', 'lentil', 'moong', 'chana', 'chickpea', 'rajma', 'beans', 'onion', 'garlic', 'egg', 'chicken', 'mutton', 'fish', 'prawn', 'bread', 'pasta', 'flour', 'atta', 'maida', 'besan', 'poha', 'semolina', 'suji', 'rava', 'oats', 'corn', 'millet', 'ragi', 'jowar', 'bajra', 'tofu', 'soy', 'pizza dough', 'tortilla', 'quinoa', 'pav', 'bun', 'roti', 'naan', 'paratha', 'puri', 'noodles', 'biscuit', 'cake', 'dough', 'sooji', 'urad', 'toor', 'peas', 'gram'];

function denyWords(words: string[]) {
  return (food: Food) => food.ingredients.find((i) => !FAST_ALLOWED.some((a) => hasWord(i, a)) && words.some((w) => hasWord(i, w)));
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
    if (c.includes('insulin')) return `Fasting with insulin or sulfonylureas needs your doctor’s plan, so EatOS will not plan a fast${members.length > 1 ? ` for ${m.name}` : ''}. Your doctor can agree timings with you; meanwhile EatOS keeps to steady, regular meals.`;
    if (c.includes('pregnancy')) return 'Fasting in pregnancy is for your clinician to advise, so EatOS will not plan a fast.';
    if (c.includes('minor')) return 'EatOS keeps meals regular for children and teens, so it does not plan fasts. Talk to a parent or doctor if you want to fast for a festival.';
    if (c.includes('eating-disorder-history')) return 'EatOS keeps meals regular and will not plan a fast.';
  }
  return undefined;
}

const TEXT_MEAT = ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'bacon', 'ham', 'fish', 'prawn', 'shrimp', 'crab', 'salmon', 'keema', 'kebab', 'nihari', 'haleem', 'tikka', 'ilish', 'hilsa', 'egg', 'omelette', 'omelet', 'bhurji', 'meat'];
const TEXT_ALLERGEN: Record<string, string[]> = {
  nuts: ['almond', 'cashew', 'walnut', 'pistachio', 'pesto'],
  peanuts: ['peanut', 'chikki'],
  dairy: ['milk', 'cheese', 'paneer', 'curd', 'yogurt', 'yoghurt', 'ghee', 'butter', 'lassi', 'kheer', 'ice cream', 'raita', 'rasmalai', 'rasgulla', 'rosogolla', 'mishti doi'],
  gluten: ['roti', 'naan', 'bread', 'pav', 'pasta', 'pizza', 'noodles', 'maida', 'paratha', 'cake', 'biscuit'],
  egg: ['egg', 'omelette', 'omelet', 'bhurji', 'mayonnaise'],
  soy: ['soy', 'tofu', 'soya'],
  fish: ['fish', 'ilish', 'hilsa', 'salmon', 'surmai', 'pomfret'],
  shellfish: ['prawn', 'shrimp', 'crab', 'lobster'],
  sesame: ['sesame', 'til', 'tahini', 'hummus'],
};

/**
 * A rule broken by something EatOS does not have in its catalogue, judged only from the words
 * the person typed. Catches the obvious ("mutton" for a vegetarian) and says nothing otherwise.
 */
export function textProblem(text: string, m: Member): string | undefined {
  const t = text.toLowerCase();
  for (const [a, words] of Object.entries(TEXT_ALLERGEN)) if (allergensOf(m).includes(a as Allergen)) {
    const w = words.find((x) => hasWord(t, x));
    if (w) return `Contains ${a} (${w})`;
  }
  if (DIET_RANK[m.diet] < DIET_RANK.omnivore) {
    const limit = m.diet === 'pescatarian' ? TEXT_MEAT.filter((x) => !['fish', 'ilish', 'hilsa', 'prawn', 'shrimp', 'crab', 'salmon'].includes(x) && x !== 'egg' && x !== 'omelette' && x !== 'omelet' && x !== 'bhurji') : TEXT_MEAT.filter((x) => !['egg', 'omelette', 'omelet', 'bhurji'].includes(x));
    const hit = limit.find((x) => hasWord(t, x));
    if (hit) return `Not ${m.diet} (${hit})`;
    if (m.diet === 'vegan') {
      const d = ['milk', 'paneer', 'curd', 'cheese', 'ghee', 'butter', 'egg', 'honey'].find((x) => hasWord(t, x));
      if (d) return `Not vegan (${d})`;
    }
  }
  for (const rule of m.rules ?? []) {
    const hit = RULE_DENY[rule].find((w) => hasWord(t, w));
    if (hit) return `Not ${RULE_LABEL[rule].toLowerCase()} (${hit})`;
  }
  if (m.conditions?.includes('pregnancy')) {
    const hit = PREGNANCY_HAZARD.find((w) => hasWord(t, w));
    if (hit) return `Not advised in pregnancy (${hit})`;
  }
  return undefined;
}

/** Wishes or requests about skipping meals, crash dieting or fast weight loss. EatOS never helps with these. */
export const RESTRICTIVE = /\b(skip(ping)? (a )?(meal|dinner|lunch|breakfast)|lose (?:\\w+ )?weight|weight loss|slim|starv\w*|crash diet|detox|cleanse|low[- ]calorie|cut calories|burn fat|fat burn\w*|purge|binge|intermittent fasting|omad|water fast|dry fast|keto|laxative|diet pill|fat burner)\b/i;

export const RESTRICTIVE_NOTE = 'EatOS does not help with skipping meals or losing weight fast. Regular meals are the plan. If food, weight or eating is on your mind a lot, talking to someone you trust or a doctor can help.';

const INGREDIENT_ALLERGENS: [Allergen, string[]][] = [
  ['gluten', ['wheat', 'wheat flour', 'maida', 'semolina', 'sooji', 'pasta', 'bread', 'pav', 'naan', 'noodles', 'vermicelli', 'tortilla', 'pizza dough', 'oats', 'broken wheat', 'muesli', 'soy sauce', 'hing', 'barley', 'kulcha', 'malt', 'bhajani', 'rava', 'dalia', 'suji']],
  ['dairy', ['milk', 'curd', 'yogurt', 'greek yogurt', 'paneer', 'ghee', 'butter', 'cream', 'cheese', 'parmesan', 'mozzarella', 'milk powder', 'khoya', 'dahi', 'malai']],
  ['egg', ['egg', 'eggs', 'mayonnaise']],
  ['peanuts', ['peanut', 'peanuts', 'peanut butter', 'roasted peanuts', 'groundnut']],
  ['nuts', ['almonds', 'cashews', 'pine nuts', 'walnuts', 'pistachios', 'hazelnuts']],
  ['sesame', ['sesame', 'sesame seeds', 'hummus', 'tahini']],
  ['soy', ['tofu', 'soya chunks', 'soya chaap', 'soy sauce', 'soya']],
  ['fish', ['fish', 'hilsa fish', 'salmon', 'pomfret', 'rohu']],
  ['shellfish', ['prawns', 'prawn', 'shrimp', 'crab']],
];

/** Allergens implied by an ingredient list, so a dish can never list ghee and forget dairy. */
export function ingredientAllergens(ingredients: string[]): Allergen[] {
  const text = ingredients.join(' | ').replace(/peanut butter/g, 'peanut paste').replace(/coconut milk|coconut cream/g, 'coconut fat').replace(/almond milk|soy milk|oat milk/g, 'plant drink');
  const out: Allergen[] = [];
  for (const [a, words] of INGREDIENT_ALLERGENS) if (words.some((w) => hasWord(text, w)) || (a === 'peanuts' && /peanut paste/.test(text))) out.push(a);
  return out;
}
