import type { EatEvent, PantryLocation } from './types';
import type { State } from './state';
import { KNOWN_FOODS, locationFor, shelfLifeDays } from './drivers/receipt';
import { isValidEvent } from './validate';
import { DAY, MINUTE, dayStart, hashString } from './time';

/**
 * Quick add: understands a sentence like
 *   "2 eggs, spinach till friday, rice 1 kg in the cupboard"
 * and turns it into pantry items with a sensible place and use-by date.
 * Runs on the device; no network.
 */
export interface QuickItem {
  /** Stable key for the preview list (position + text). */
  key: string;
  name: string;
  qty: number;
  unit: string;
  location: PantryLocation;
  /** Epoch ms. */
  expiresAt: number;
  /** True when the date is a typical shelf life rather than something the person said. */
  guessed: boolean;
  /** True when the name matched a food EatOS knows. */
  known: boolean;
  /** True when whatever read this was not confident (for example a blurry photo). */
  uncertain?: boolean;
}

const NUMBER_WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, couple: 2, few: 3, dozen: 12 };
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const LOCATIONS: [RegExp, PantryLocation][] = [
  [/\b(?:in|from)?\s*(?:the\s+)?freezer\b|\bfrozen\b/i, 'freezer'],
  [/\b(?:in|on)?\s*(?:the\s+)?fridge\b|\brefrigerat\w*\b/i, 'fridge'],
  [/\b(?:in|on)?\s*(?:the\s+)?(?:cupboard|pantry|shelf)\b/i, 'cupboard'],
  [/\b(?:on)?\s*(?:the\s+)?(?:counter|worktop|bench)\b/i, 'counter'],
];
const COMPOUNDS = ['mac and cheese', 'fish and chips', 'salt and vinegar', 'bread and butter', 'rice and peas', 'beans and rice'];
const FILLER = /\b(some|of|the|my|fresh|new|more|another|bag|bags)\b/gi;

function split(text: string): string[] {
  const protectedText = COMPOUNDS.reduce((t, c) => t.replace(new RegExp(c, 'gi'), (m) => m.replace(/ and /gi, '\u0001and\u0001')), text);
  return protectedText
    .split(/[\n,;]+|\s+and\s+|\s+&\s+|\s+plus\s+/i)
    .map((s) => s.replace(/\u0001and\u0001/g, ' and ').trim())
    .filter(Boolean);
}

function localWeekday(t: number, tz: number): number {
  return new Date(t + tz * MINUTE).getUTCDay();
}

/** Reads an expiry phrase out of a segment; returns the remaining text and the date. */
function takeExpiry(segment: string, now: number, tz: number): { rest: string; expiresAt?: number } {
  const today = dayStart(now, tz);
  const lead = '(?:use\\s+by|best\\s+before|expires?(?:\\s+on)?|exp|until|till|by|for)';
  const patterns: [RegExp, (m: RegExpMatchArray) => number | undefined][] = [
    [new RegExp(`\\b${lead}?\\s*(?:in\\s+)?(\\d{1,3})\\s*(day|days|week|weeks|month|months)\\b`, 'i'), (m) => today + Number(m[1]) * (/^w/i.test(m[2]!) ? 7 : /^m/i.test(m[2]!) ? 30 : 1) * DAY],
    [new RegExp(`\\b${lead}\\s+(today|tonight)\\b`, 'i'), () => today],
    [new RegExp(`\\b${lead}\\s+tomorrow\\b`, 'i'), () => today + DAY],
    [new RegExp(`\\b${lead}\\s+(?:next\\s+week)\\b`, 'i'), () => today + 7 * DAY],
    [new RegExp(`\\b${lead}\\s+(?:this\\s+|next\\s+|on\\s+)?(${WEEKDAYS.join('|')})\\b`, 'i'), (m) => {
      const target = WEEKDAYS.indexOf(m[1]!.toLowerCase());
      const ahead = ((target - localWeekday(now, tz) + 6) % 7) + 1; // always the coming one, 1 to 7 days
      return today + ahead * DAY;
    }],
    [new RegExp(`\\b${lead}\\s+(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTHS.join('|')})[a-z]*\\b`, 'i'), (m) => dateOf(Number(m[1]), m[2]!, today, tz)],
    [new RegExp(`\\b${lead}\\s+(?:on\\s+)?(${MONTHS.join('|')})[a-z]*\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'), (m) => dateOf(Number(m[2]), m[1]!, today, tz)],
  ];
  for (const [re, fn] of patterns) {
    const m = segment.match(re);
    if (m) {
      const expiresAt = fn(m);
      if (expiresAt !== undefined) return { rest: segment.replace(re, ' '), expiresAt };
    }
  }
  return { rest: segment };
}

function dateOf(day: number, month: string, today: number, tz: number): number | undefined {
  const m = MONTHS.indexOf(month.slice(0, 3).toLowerCase());
  if (m < 0 || day < 1 || day > 31) return undefined;
  const y = new Date(today + tz * MINUTE).getUTCFullYear();
  let t = Date.UTC(y, m, day) - tz * MINUTE;
  if (t < today) t = Date.UTC(y + 1, m, day) - tz * MINUTE;
  return t;
}

export const UNIT_NAME: Record<string, string> = {
  kg: 'kg', kilo: 'kg', kilos: 'kg', g: 'g', gram: 'g', grams: 'g', l: 'l', litre: 'l', litres: 'l', liter: 'l', liters: 'l', ml: 'ml', lb: 'lb', oz: 'oz',
  pack: 'pack', packs: 'pack', packet: 'pack', packets: 'pack',
  bottle: 'bottle', bottles: 'bottle', tin: 'tin', tins: 'tin', can: 'can', cans: 'can', jar: 'jar', jars: 'jar',
  bag: 'bag', bags: 'bag', bunch: 'bunch', bunches: 'bunch', loaf: 'loaf', loaves: 'loaf',
  carton: 'carton', cartons: 'carton', box: 'box', boxes: 'box', tub: 'tub', tubs: 'tub',
};

/** "2 packs of spinach", "500g rice", "a dozen eggs", "x3 apples": amount, unit and what is left. */
function takeQuantity(segment: string): { rest: string; qty: number; unit: string } {
  let s = segment.trim();
  let qty = 1;
  let unit = 'pc';

  const half = s.match(/^half\s+a\s+dozen\b/i);
  const num = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:x\b\s*)?/i);
  const word = s.match(/^(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b(?:\s+(couple|few|dozen))?(?:\s+of\b)?/i);
  const trailing = s.match(/\s+x\s*(\d+)\s*$/i) ?? s.match(/\s+(\d+)\s*x\s*$/i);
  // Amount after the name: "rice 1 kg", "milk 2 litres", "eggs 6".
  const after = s.match(new RegExp(`\\s+(\\d+(?:[.,]\\d+)?)\\s*(${Object.keys(UNIT_NAME).join('|')})?\\s*$`, 'i'));

  if (half) {
    qty = 6;
    s = s.slice(half[0].length);
  } else if (num) {
    qty = Number(num[1]!.replace(',', '.'));
    s = s.slice(num[0].length);
    if (/^dozen\b/i.test(s)) {
      qty *= 12;
      s = s.replace(/^dozen\b/i, '');
    }
  } else if (word) {
    const base = NUMBER_WORDS[word[1]!.toLowerCase()]!;
    const extra = word[2] ? NUMBER_WORDS[word[2].toLowerCase()]! : undefined;
    qty = extra === undefined ? base : extra === 12 ? base * 12 : extra;
    s = s.slice(word[0].length);
  } else if (trailing) {
    qty = Number(trailing[1]);
    s = s.slice(0, s.length - trailing[0].length);
  } else if (after) {
    qty = Number(after[1]!.replace(',', '.'));
    if (after[2]) unit = UNIT_NAME[after[2].toLowerCase()]!;
    s = s.slice(0, s.length - after[0].length);
  }

  const u = s.trim().match(/^([a-z]+)\b/i);
  if (u && UNIT_NAME[u[1]!.toLowerCase()] && (num || word || trailing || half)) {
    unit = UNIT_NAME[u[1]!.toLowerCase()]!;
    s = s.trim().slice(u[0].length);
  }
  return { rest: s, qty: Number.isFinite(qty) && qty > 0 ? Math.min(qty, 10_000) : 1, unit };
}

function singular(s: string): string {
  return s.endsWith('ies') ? `${s.slice(0, -3)}y` : s.endsWith('oes') ? s.slice(0, -2) : s.endsWith('s') && !s.endsWith('ss') ? s.slice(0, -1) : s;
}

/**
 * The name to store, matching the spelling recipes use so the pantry can satisfy them.
 * A known food keeps its catalogue spelling ("apples" becomes "apple" when "apple" is the known one).
 * A lone word that ends exactly one known food becomes that food ("lentils" becomes "red lentils").
 * Anything else stays as typed: guessing a singular would mangle words like "couscous".
 */
export function canonicalName(cleaned: string, known: string | undefined): string {
  if (known) {
    const one = singular(known);
    return KNOWN_FOODS.includes(one) ? one : known;
  }
  const forms = new Set([cleaned, singular(cleaned), `${cleaned}s`]);
  const ends = KNOWN_FOODS.filter((f) => [...forms].some((w) => f.endsWith(` ${w}`)));
  return ends.length === 1 ? ends[0]! : cleaned;
}

/**
 * A food EatOS knows, only when the whole name matches (singular or plural).
 * Phrases with extra words ("almond milk", "mac and cheese") are deliberately not reduced to a
 * known word inside them: that would turn plant milk into dairy milk.
 */
export function matchKnown(name: string): string | undefined {
  const n = name.toLowerCase().trim();
  return KNOWN_FOODS.find((f) => n === f || n === singular(f) || n === `${f}s` || n === `${f}es`);
}

export function parseQuickAdd(text: string, now: number, tzOffsetMin = 0): QuickItem[] {
  const items: QuickItem[] = [];
  split(text.slice(0, 2000)).slice(0, 40).forEach((raw, i) => {
    let seg = raw;
    let location: PantryLocation | undefined;
    for (const [re, loc] of LOCATIONS) {
      if (re.test(seg)) {
        location = loc;
        seg = seg.replace(re, ' ');
        break;
      }
    }
    const frozen = location === 'freezer';
    const { rest: afterExpiry, expiresAt: said } = takeExpiry(seg, now, tzOffsetMin);
    const { rest, qty, unit } = takeQuantity(afterExpiry);
    const cleaned = rest.replace(FILLER, ' ').replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!cleaned || cleaned.length > 60 || /^\d+$/.test(cleaned)) return;
    const known = matchKnown(cleaned);
    const name = canonicalName(cleaned, known);
    const loc = location ?? locationFor(name, false);
    const days = shelfLifeDays(name, frozen);
    items.push({
      key: `${i}:${raw}`,
      name,
      qty,
      unit,
      location: loc,
      expiresAt: said ?? dayStart(now, tzOffsetMin) + days * DAY,
      guessed: said === undefined,
      known: known !== undefined,
    });
  });
  return items;
}

/** Pantry events for confirmed items. Ids are unique per add so repeats are allowed. */
export function quickAddEvents(items: QuickItem[], now: number): EatEvent[] {
  return items
    .map((it, i): EatEvent => ({
      type: 'pantry.added',
      id: `pantry.qa:${hashString(`${it.name}|${now}|${i}|${it.qty}`)}`,
      at: now,
      item: { id: `p_qa_${hashString(`${it.name}|${now}|${i}`)}`, name: it.name, qty: it.qty, unit: it.unit, location: it.location, addedAt: now, expiresAt: it.expiresAt },
    }))
    .filter(isValidEvent);
}

export interface Restock {
  name: string;
  /** How many times it was used up in the last 60 days. */
  times: number;
}

/**
 * Things the person used up recently that are no longer in the pantry,
 * most often first: a one-tap "buy again" list.
 */
export function restockSuggestions(state: State, now: number, limit = 6): Restock[] {
  const names = new Map<string, string>(); // item id -> name
  const used = new Map<string, number>();
  const since = now - 60 * DAY;
  for (const e of state.events) {
    if (e.type === 'pantry.added') names.set(e.item.id, e.item.name);
    else if ((e.type === 'pantry.used' || e.type === 'pantry.removed') && e.at >= since && e.at <= now) {
      const n = names.get(e.itemId);
      if (n) used.set(n, (used.get(n) ?? 0) + 1);
    }
  }
  const have = new Set(Object.values(state.pantry).map((p) => p.name.toLowerCase()));
  return [...used.entries()]
    .filter(([n]) => !have.has(n.toLowerCase()))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, times]) => ({ name, times }));
}
