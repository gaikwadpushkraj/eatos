import type { Allergen, EatEvent, PantryLocation } from '../types';
import { CATALOG } from '../catalog';
import { DAY, hashString } from '../time';
import { isValidEvent } from '../validate';

/**
 * Grocery driver: turns a pasted or exported receipt into pantry items.
 * It looks for food EatOS knows about (every ingredient in the catalog
 * plus common staples), reads quantities like "2 x" or "500g", and
 * ignores prices, totals and everything it does not recognise. Item ids
 * come from the receipt line, so importing a receipt twice adds nothing.
 */

const STAPLES = [
  'milk', 'butter', 'cheese', 'cream', 'apple', 'apples', 'orange', 'oranges', 'lemon', 'lime', 'avocado', 'grapes', 'mango', 'pear', 'cucumber',
  'cabbage', 'cauliflower', 'courgette', 'zucchini', 'aubergine', 'beans', 'sweetcorn', 'coriander', 'parsley', 'mint', 'flour', 'sugar', 'salt',
  'oil', 'olive oil', 'vinegar', 'noodles', 'cereal', 'beef', 'pork', 'turkey', 'prawns', 'tuna', 'sausages', 'ham', 'bacon',
];

export const KNOWN_FOODS: string[] = [...new Set([...CATALOG.flatMap((f) => f.ingredients), ...STAPLES])].sort((a, b) => b.length - a.length);

const SKIP = /\b(total|subtotal|sub-total|vat|tax|change|cash|card|visa|mastercard|balance|saving|savings|discount|voucher|points|thank|receipt|store|tel|www|order|delivery fee|service fee|tip)\b/i;

const FROZEN = /\b(frozen|ice cream)\b/i;

export type Aisle = 'Produce' | 'Dairy and protein' | 'Grains and pulses' | 'Other';
const AISLES: [Aisle, RegExp][] = [
  ['Produce', /spinach|tomato|onion|garlic|lemon|lime|banana|berries|apple|pepper|broccoli|carrot|cucumber|lettuce|mushroom|potato|ginger|basil|peas|avocado|orange|grape|mango|pear|cabbage|cauliflower|courgette|zucchini|aubergine|coriander|parsley|mint|sweetcorn/],
  ['Dairy and protein', /yogurt|milk|paneer|egg|tofu|chicken|salmon|parmesan|mozzarella|hummus|butter|cheese|cream|beef|pork|turkey|prawn|tuna|sausage|ham|bacon/],
  ['Grains and pulses', /rice|oats|lentil|dal|chickpea|bread|pasta|tortilla|flatbread|dough|flattened|flour|noodle|cereal|beans/],
];

export function aisleFor(name: string): Aisle {
  return AISLES.find(([, re]) => re.test(name))?.[0] ?? 'Other';
}

export function shelfLifeDays(name: string, frozen = false): number {
  if (frozen) return 90;
  const a = aisleFor(name);
  return a === 'Produce' ? 5 : a === 'Dairy and protein' ? 7 : a === 'Grains and pulses' ? 180 : 30;
}

export function locationFor(name: string, frozen = false): PantryLocation {
  if (frozen) return 'freezer';
  const a = aisleFor(name);
  return a === 'Dairy and protein' ? 'fridge' : a === 'Produce' ? (/tomato|onion|garlic|banana|potato|lemon|lime|avocado|orange|apple|pear|mango/.test(name) ? 'counter' : 'fridge') : 'cupboard';
}

function singular(s: string): string {
  return s.endsWith('ies') ? `${s.slice(0, -3)}y` : s.endsWith('oes') ? s.slice(0, -2) : s.endsWith('s') && !s.endsWith('ss') ? s.slice(0, -1) : s;
}

export interface ReceiptItem {
  name: string;
  qty: number;
  unit: string;
  frozen: boolean;
  line: string;
}

/** Reads receipt lines. Unrecognised lines are returned separately so a UI can show them. */
export function parseReceipt(text: string): { items: ReceiptItem[]; unknown: string[] } {
  const items: ReceiptItem[] = [];
  const unknown: string[] = [];
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line || SKIP.test(line) || /^[-=*_\s]+$/.test(line)) continue;
    const lower = line.toLowerCase().replace(/[^a-z0-9.\s×x/-]/g, ' ');
    const words = ` ${lower.replace(/\s+/g, ' ')} `;
    const known = KNOWN_FOODS.find((f) => words.includes(` ${f} `) || words.includes(` ${singular(f)} `) || words.includes(` ${f}s `) || words.includes(` ${f}es `));
    if (!known) {
      // Only lines that end in a price look like items; headers and footers are not reported.
      if (/[a-z]{3}/i.test(line) && /\d+[.,]\d{2}\s*$/.test(line)) unknown.push(line);
      continue;
    }
    const name = singular(known) === known ? known : KNOWN_FOODS.includes(singular(known)) ? singular(known) : known;
    let qty = 1;
    let unit = 'pc';
    const mult = lower.match(/(?:^|\s)(\d+)\s*[x×]\s/) ?? lower.match(/\s[x×]\s?(\d+)(?:\s|$)/);
    if (mult) qty = Number(mult[1]);
    const weight = lower.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|lb|oz)\b/);
    if (weight) {
      qty = Number(weight[1]) * (mult ? Number(mult[1]) : 1);
      unit = weight[2]!;
    }
    items.push({ name, qty, unit, frozen: FROZEN.test(line), line });
  }
  return { items, unknown };
}

/**
 * Pantry events for a receipt bought at `boughtAt`. Allergen-unsafe
 * checks are not needed here: this only records what the person bought.
 */
export function receiptEvents(text: string, boughtAt: number, source = 'receipt'): { events: EatEvent[]; unknown: string[] } {
  const { items, unknown } = parseReceipt(text);
  const seen = new Map<string, number>();
  const events = items.map((it): EatEvent => {
    const base = `${source}:${hashString(`${boughtAt}|${it.line.toLowerCase()}`)}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const id = n === 1 ? base : `${base}-${n}`;
    return {
      type: 'pantry.added',
      id: `pantry.${id}`,
      at: boughtAt,
      item: {
        id: `p_${id}`,
        name: it.name,
        qty: it.qty,
        unit: it.unit,
        location: locationFor(it.name, it.frozen),
        addedAt: boughtAt,
        expiresAt: boughtAt + shelfLifeDays(it.name, it.frozen) * DAY,
      },
    };
  });
  return { events: events.filter(isValidEvent), unknown };
}

/** Allergens that commonly hide in a receipt item, for a heads-up in the UI. */
export function allergensIn(name: string): Allergen[] {
  const out: Allergen[] = [];
  if (/almond|walnut|cashew|pecan|pistachio|pine nut|hazelnut/.test(name)) out.push('nuts');
  if (/peanut/.test(name)) out.push('peanuts');
  if (/milk|yogurt|cheese|butter|cream|paneer|parmesan|mozzarella/.test(name)) out.push('dairy');
  if (/bread|pasta|flour|tortilla|flatbread|oats|noodle|dough/.test(name)) out.push('gluten');
  if (/egg/.test(name)) out.push('egg');
  if (/soy|tofu/.test(name)) out.push('soy');
  return out;
}
