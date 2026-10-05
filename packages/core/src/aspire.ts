import type { Blocker, Condition, DietRule, Food, Member } from './types';
import type { State } from './state';
import { selfMember } from './state';
import { FASTING, RESTRICTIVE, RESTRICTIVE_NOTE, hardProblem, hasWord, healthFit, textProblem } from './rules';
import { activeFast } from './recommend';
import { pantryNames } from './housekeeping';

/**
 * Things a person wishes to eat but cannot, with kind alternatives. The
 * ladder goes from closest to the wish to furthest: a version of the same
 * dish, a near neighbour, something that does the same job, and when to
 * have the real thing. Every dish offered passes the same hard rules as any
 * recommendation, so a wish never opens a door a rule has closed.
 */

export interface Rung {
  kind: 'version' | 'neighbour' | 'same-job';
  title: string;
  why: string;
  foods: Food[];
}

export interface WishAnswer {
  wish: string;
  /** The catalog dish the wish matched, if any. */
  food?: Food;
  /** True when EatOS does not know the dish, so it could not check it fully. */
  unknown?: boolean;
  blockers: { kind: Blocker; detail: string }[];
  ladder: Rung[];
  /** Short practical tips, each marked with how well it is supported. */
  tips: { text: string; evidence: 'guideline' | 'trial' | 'tradition' }[];
  /** When to have the real thing. */
  later?: string;
}

interface Swap {
  match: RegExp;
  when: (Condition | DietRule)[];
  picks: string[];
  why: string;
  tips?: { text: string; evidence: 'guideline' | 'trial' | 'tradition' }[];
}

/** Hand-written swaps from docs/research (food_data_substitutions.md, Dataset B). */
const SWAPS: Swap[] = [
  { match: /biryani|pulao|fried rice/i, when: ['diabetes', 'prediabetes', 'pcos'], picks: ['millet-pulao', 'veg-pulao', 'khichdi', 'dalia-khichdi'], why: 'Keeps a festive rice dish but with basmati or millet, more vegetables and curd, which slow the sugar rise.', tips: [{ text: 'Eat the vegetables and raita first, then the rice, and keep the rice to a smaller scoop.', evidence: 'trial' }, { text: 'Cooked rice that cools, then is reheated, has more resistant starch.', evidence: 'trial' }] },
  { match: /dosa|upma|poha|idli/i, when: ['diabetes', 'prediabetes', 'pcos'], picks: ['pesarattu', 'besan-chilla', 'ragi-dosa', 'idli-sambar', 'oats-upma'], why: 'Same tiffin occasion with pulse or millet batters for more protein and fibre.' },
  { match: /paneer|cheese|curd|raita|lassi|milk|kheer|dairy/i, when: ['lactose-intolerant'], picks: ['soya-chunk-curry', 'rajma-chawal', 'chole-roti', 'sprouts-salad', 'besan-chilla'], why: 'Similar protein and comfort without milk sugar. Fermented curd and paneer are often better tolerated than milk, so small portions may be fine.' },
  { match: /roti|naan|paratha|bread|pav|pasta|noodle|pizza|upma|maida/i, when: ['celiac'], picks: ['jowar-roti-dal', 'bajra-khichdi', 'ragi-dosa', 'besan-chilla', 'idli-sambar', 'dal-tadka-rice'], why: 'Same bread-and-curry format with naturally gluten-free millets, rice or besan. Check flours and cross-contact.' },
  { match: /onion|garlic|pav bhaji|chaat|biryani|manchurian|chinese/i, when: ['jain', 'satvik', 'no-onion-garlic'], picks: ['pav-bhaji-jain', 'dal-rice-jain', 'paneer-bhurji-jain', 'dhokla', 'khichdi-kadhi'], why: 'Hing, cumin and tomato carry the savoury note without onion or garlic.' },
  { match: /pickle|papad|achar|namkeen|bhujia|chips|farsan|sev/i, when: ['hypertension', 'kidney'], picks: ['roasted-chana', 'makhana-roasted', 'murmura-bhel', 'kachumber-curd'], why: 'Crunch and tang from lemon, chutney and roasted snacks without the salt.', tips: [{ text: 'A lemon or green chilli wedge gives the tang a pickle does.', evidence: 'tradition' }] },
  { match: /samosa|vada pav|kachori|pakora|bhajiya|fried/i, when: ['diabetes', 'prediabetes', 'high-cholesterol', 'hypertension'], picks: ['roasted-chana', 'dhokla', 'sprouts-salad', 'murmura-bhel', 'idli-sambar'], why: 'Same snack hour with less oil and refined flour.' },
  { match: /jalebi|gulab|mithai|halwa|sweet|ladoo|barfi|cake|ice cream/i, when: ['diabetes', 'prediabetes', 'pcos'], picks: ['sweet-curd-mango', 'fruit-curd-bowl', 'makhana-kheer'], why: 'A small sweet after a meal beats a large one alone; fruit and curd keep the sweetness.', tips: [{ text: 'Have mithai after a meal, in a small portion, rather than on an empty stomach.', evidence: 'guideline' }] },
  { match: /mutton|liver|prawn|crab|organ|keema/i, when: ['gout'], picks: ['boiled-eggs', 'paneer-tikka-salad', 'dal-tadka-rice'], why: 'Lower-purine proteins that still fill you up.' },
  { match: /whey|protein|chicken|gym/i, when: ['no-beef', 'jain', 'satvik'], picks: ['paneer-tikka-salad', 'soya-chunk-curry', 'sprouts-salad', 'besan-chilla', 'fruit-curd-bowl'], why: 'Whole-food vegetarian protein; ICMR-NIN 2024 advises food over protein supplements.' },
  { match: /chaat|pani puri|gol gappa|street|raw|sushi|cheese|papaya/i, when: ['pregnancy'], picks: ['murmura-bhel', 'fruit-chaat', 'dhokla', 'curd-rice'], why: 'Freshly cooked or home-made versions of the same cravings. Street food hygiene cannot be checked.' },
];

const STOP = new Set(['i', 'wish', 'want', 'to', 'eat', 'some', 'a', 'an', 'the', 'my', 'with', 'and', 'of', 'have', 'could', 'can', 'like', 'craving']);
const words = (s: string) => s.toLowerCase().replace(/[^a-z\s-]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));

const GENERIC = new Set(['curry', 'with', 'sabzi', 'masala', 'fry', 'special', 'style']);

/** The catalog dish a wish is about: every meaningful word of the wish must be a whole word of the dish. */
export function findWishFood(catalog: Food[], text: string): Food | undefined {
  const ws = words(text).filter((w) => w.length > 2);
  const core = ws.filter((w) => !GENERIC.has(w));
  if (!core.length) return undefined;
  let best: Food | undefined;
  let bestScore = 0;
  for (const f of catalog) {
    const hay = `${f.name} ${f.id.replace(/-/g, ' ')}`;
    if (!core.every((w) => hasWord(hay, w))) continue;
    // Prefer the dish whose name is closest to what was typed.
    const score = core.length / (words(f.name).length || 1) + (ws.length - core.length) * 0.01;
    if (score > bestScore) {
      best = f;
      bestScore = score;
    }
  }
  return best;
}

function kindOf(reason: string, m: Member): Blocker {
  if (/pregnan/i.test(reason) || (/gluten/i.test(reason) && m.conditions?.includes('celiac'))) return 'health';
  return /^Contains/.test(reason) ? 'allergy' : 'religion';
}

const jaccard = (a: string[], b: string[]) => {
  const A = new Set(a);
  const inter = b.filter((x) => A.has(x)).length;
  return inter / (A.size + new Set(b).size - inter || 1);
};

function allowed(food: Food, m: Member | undefined, state: State, now: number): boolean {
  if (m && (hardProblem(food, m) || healthFit(food, m).delta <= -3)) return false;
  const kitchen = state.profile?.kitchen ?? 'full';
  if (kitchen === 'none' && !food.tags.includes('no-cook')) return false;
  if (kitchen !== 'full' && food.tags.includes('oven')) return false;
  const fast = activeFast(state, m ? [m] : [], now);
  if (fast.kind && FASTING[fast.kind].deny(food)) return false;
  return true;
}

/** Alternatives for something the person wishes to eat but cannot. Never throws. */
export function alternatives(state: State, catalog: Food[], wish: string, now: number): WishAnswer {
  const me = selfMember(state);
  if (RESTRICTIVE.test(wish)) {
    const meals = catalog.filter((f) => allowed(f, me, state, now) && f.slots.includes('dinner')).slice(0, 3);
    return { wish, blockers: [{ kind: 'health', detail: 'EatOS keeps meals regular.' }], ladder: meals.length ? [{ kind: 'same-job', title: 'A proper meal instead', why: 'Regular, filling meals keep energy and mood steady.', foods: meals }] : [], tips: [], later: RESTRICTIVE_NOTE };
  }
  const food = findWishFood(catalog, wish);
  const blockers: WishAnswer['blockers'] = [];
  const tips: WishAnswer['tips'] = [];
  const byId = new Map(catalog.map((f) => [f.id, f]));
  const text = `${wish} ${food?.name ?? ''}`;
  const mine = new Set<string>([...(me?.conditions ?? []), ...(me?.rules ?? [])]);

  if (food && me) {
    const hard = hardProblem(food, me);
    if (hard) blockers.push({ kind: kindOf(hard, me), detail: hard });
    const h = healthFit(food, me);
    if (!hard && h.delta <= -3) blockers.push({ kind: 'health', detail: 'It does not sit well with what you told EatOS about your health, so it ranks low rather than being ruled out.' });
    const fast = activeFast(state, [me], now);
    const denied = fast.kind ? FASTING[fast.kind].deny(food) : undefined;
    if (denied) blockers.push({ kind: 'religion', detail: `Not part of today’s ${FASTING[fast.kind!].label.toLowerCase()} (${denied})` });
    const kitchen = state.profile?.kitchen ?? 'full';
    if (kitchen === 'none' && !food.tags.includes('no-cook')) blockers.push({ kind: 'equipment', detail: 'Needs a kitchen' });
    const others = (state.profile?.members ?? []).filter((m) => m.id !== me.id && hardProblem(food, m));
    if (others.length) blockers.push({ kind: 'household', detail: `${others.map((m) => m.name).join(' and ')} cannot eat it` });
  }

  if (!food && me) {
    const t = textProblem(wish, me);
    if (t) blockers.push({ kind: kindOf(t, me), detail: t });
  }
  const swaps = SWAPS.filter((s) => s.match.test(text) && s.when.some((w) => mine.has(w)));
  if (!blockers.length && swaps.length) blockers.push({ kind: swaps[0]!.when.some((w) => ['jain', 'satvik', 'no-onion-garlic', 'no-beef', 'halal'].includes(w) && mine.has(w)) ? 'religion' : 'health', detail: 'It conflicts with what you told EatOS about your food.' });
  for (const s of swaps) tips.push(...(s.tips ?? []));

  const ladder: Rung[] = [];
  const used = new Set<string>(food ? [food.id] : []);
  const take = (foods: Food[], n = 3) => {
    const out: Food[] = [];
    for (const f of foods) {
      if (used.has(f.id) || !allowed(f, me, state, now)) continue;
      used.add(f.id);
      out.push(f);
      if (out.length >= n) break;
    }
    return out;
  };

  const versionFoods = [
    ...swaps.flatMap((s) => s.picks.map((id) => byId.get(id)).filter((f): f is Food => !!f)),
    ...(food ? catalog.filter((f) => f.variantOf === food.id || f.id === food.variantOf || (food.variantOf && f.variantOf === food.variantOf)) : []),
  ];
  const version = take(versionFoods, 4);
  if (version.length) ladder.push({ kind: 'version', title: 'A version you can have', why: swaps[0]?.why ?? 'A variant of the same dish that fits your rules.', foods: version });

  if (food) {
    const near = take(
      catalog
        .filter((f) => f.slots.some((s) => food.slots.includes(s)))
        .map((f) => ({ f, s: jaccard(f.tags, food.tags) + (f.cuisine === food.cuisine ? 0.4 : 0) + (me ? healthFit(f, me).delta * 0.05 : 0) }))
        .sort((a, b) => b.s - a.s)
        .map((x) => x.f),
    );
    if (near.length) ladder.push({ kind: 'neighbour', title: 'Close in taste', why: `Same kind of meal as ${food.name.toLowerCase()}, from the same style of cooking.`, foods: near });

    const job = take(
      catalog
        .filter((f) => f.slots.some((s) => food.slots.includes(s)))
        .map((f) => ({ f, s: Math.abs(f.nutrients.kcal - food.nutrients.kcal) / 100 + Math.abs(f.nutrients.proteinG - food.nutrients.proteinG) / 8 }))
        .sort((a, b) => a.s - b.s)
        .map((x) => x.f),
    );
    if (job.length) ladder.push({ kind: 'same-job', title: 'Does the same job', why: 'Similar fullness and protein, so the meal still does what you wanted it to.', foods: job });
  }

  let later: string | undefined;
  const kinds = new Set(blockers.map((b) => b.kind));
  const skip = blockers.some((b) => /pregnan/i.test(b.detail) || /gluten/i.test(b.detail));
  if (skip) later = 'This one is best skipped for now. If you are unsure about anything, ask your clinician.';
  else if (kinds.has('allergy')) later = 'This is not safe for you. If a restaurant says they can make it without the allergen, EatOS cannot check that, so ask them directly.';
  else if (kinds.has('religion')) later = 'It stays out while the rule applies. Keep it for a day the rule allows, or ask the cook about the version above.';
  else if (kinds.has('health')) later = 'Keep the real thing for a weekend meal in a smaller portion, with vegetables and dal or curd alongside.';
  else if (kinds.has('equipment')) later = 'Keep it for when you have a kitchen, or look for a ready version from a place you trust.';
  else if (kinds.has('household')) later = 'Cook it on a day when the others eat out, or make the shared base and add it on the side.';
  else if (!blockers.length && food) later = 'Nothing is in the way. It can go on your plan.';
  const unknown = !food && !blockers.length;
  if (unknown) later = 'EatOS does not know this dish yet, so it cannot check it against your rules or health settings. Ask how it is made, or pick something from the list below.';

  // The pantry tells whether a "can't" is really "don't have the ingredients".
  if (food && !blockers.length) {
    const have = pantryNames(state, now);
    const missing = food.ingredients.filter((i) => !have.has(i));
    if (missing.length && state.pantry && Object.keys(state.pantry).length) blockers.push({ kind: 'availability', detail: `Missing ${missing.slice(0, 4).join(', ')}` });
  }

  return { wish, food, unknown, blockers, ladder, tips, later };
}
