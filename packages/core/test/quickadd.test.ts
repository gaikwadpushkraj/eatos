import { describe, expect, it } from 'vitest';
import { parseQuickAdd, quickAddEvents, restockSuggestions, DAY } from '../src';
import { DAY0, kernelWith, T } from './helpers';

// Sunday 4 October 2026, 09:00 UTC.
const NOW = T('09:00');
const day = (n: number) => DAY0 + n * DAY;
const one = (text: string) => parseQuickAdd(text, NOW)[0]!;

describe('quick add: quantities and units', () => {
  it('reads numbers, units, number words and dozens', () => {
    expect(one('2 eggs')).toMatchObject({ name: 'eggs', qty: 2, unit: 'pc' });
    expect(one('500g rice')).toMatchObject({ name: 'rice', qty: 500, unit: 'g' });
    expect(one('1.5 kg lentils')).toMatchObject({ qty: 1.5, unit: 'kg' });
    expect(one('2 packs of spinach')).toMatchObject({ name: 'spinach', qty: 2, unit: 'pack' });
    expect(one('two bottles milk')).toMatchObject({ name: 'milk', qty: 2, unit: 'bottle' });
    expect(one('a dozen eggs')).toMatchObject({ name: 'eggs', qty: 12 });
    expect(one('half a dozen eggs')).toMatchObject({ qty: 6 });
    expect(one('a couple of lemons')).toMatchObject({ qty: 2 });
    expect(one('apples x4')).toMatchObject({ name: 'apple', qty: 4 });
    expect(one('bananas')).toMatchObject({ name: 'banana', qty: 1, unit: 'pc' });
    // The amount can come after the name too.
    expect(one('rice 1 kg')).toMatchObject({ name: 'rice', qty: 1, unit: 'kg' });
    expect(one('milk 2 litres')).toMatchObject({ name: 'milk', qty: 2, unit: 'l' });
    expect(one('eggs 6')).toMatchObject({ name: 'eggs', qty: 6, unit: 'pc' });
    // Words EatOS does not know are kept as typed, never chopped.
    expect(one('couscous')).toMatchObject({ name: 'couscous', known: false });
    expect(one('2 asparagus')).toMatchObject({ name: 'asparagus', qty: 2 });
    // A phrase is never reduced to a known word inside it: plant milk is not dairy milk.
    expect(one('almond milk')).toMatchObject({ name: 'almond milk', known: false });
    expect(one('2 cartons of oat milk')).toMatchObject({ name: 'oat milk', qty: 2, unit: 'carton' });
  });

  it('splits lists on commas, "and", "plus" and new lines, but keeps compound dishes', () => {
    expect(parseQuickAdd('eggs, milk and spinach', NOW).map((i) => i.name)).toEqual(['eggs', 'milk', 'spinach']);
    expect(parseQuickAdd('rice plus lentils\nbananas', NOW).map((i) => i.name)).toEqual(['rice', 'red lentils', 'banana']);
    expect(parseQuickAdd('mac and cheese, milk', NOW).map((i) => i.name)).toEqual(['mac and cheese', 'milk']);
  });

  it('drops filler words and punctuation, and ignores empty or silly input', () => {
    expect(one('some fresh spinach!')).toMatchObject({ name: 'spinach' });
    expect(parseQuickAdd('', NOW)).toEqual([]);
    expect(parseQuickAdd(' , ,, ', NOW)).toEqual([]);
    expect(parseQuickAdd('42', NOW)).toEqual([]);
    expect(parseQuickAdd('x'.repeat(200), NOW)).toEqual([]);
    expect(parseQuickAdd(Array.from({ length: 100 }, (_, i) => `item${i}`).join(','), NOW)).toHaveLength(40);
  });
});

describe('quick add: where and until when', () => {
  it('uses typical places and shelf lives, and says the date is a guess', () => {
    const milk = one('milk');
    expect(milk).toMatchObject({ location: 'fridge', guessed: true, known: true });
    expect(milk.expiresAt).toBe(day(0) + 5 * DAY);
    expect(one('basmati rice')).toMatchObject({ location: 'cupboard', known: true });
    expect(one('dragonfruit')).toMatchObject({ known: false, location: 'cupboard', guessed: true });
  });

  it('understands places in words', () => {
    expect(one('peas in the freezer')).toMatchObject({ name: 'peas', location: 'freezer', expiresAt: day(0) + 90 * DAY });
    expect(one('frozen spinach')).toMatchObject({ location: 'freezer' });
    expect(one('lemons on the counter')).toMatchObject({ location: 'counter', name: 'lemon' });
    expect(one('oats in the cupboard')).toMatchObject({ location: 'cupboard' });
  });

  it('understands dates in words', () => {
    expect(one('spinach till friday').expiresAt).toBe(day(5)); // Sunday -> the coming Friday
    expect(one('milk use by tomorrow').expiresAt).toBe(day(1));
    expect(one('yogurt expires today').expiresAt).toBe(day(0));
    expect(one('chicken in 3 days').expiresAt).toBe(day(3));
    expect(one('bread for 2 days').expiresAt).toBe(day(2));
    expect(one('cheese until next week').expiresAt).toBe(day(7));
    expect(one('tofu best before 12 oct').expiresAt).toBe(Date.UTC(2026, 9, 12));
    expect(one('tofu by October 12').expiresAt).toBe(Date.UTC(2026, 9, 12));
    expect(one('milk till sunday').expiresAt).toBe(day(7)); // today is Sunday: the coming one, not today
    for (const t of ['spinach till friday', 'tofu by 12 oct']) expect(one(t).guessed).toBe(false);
    // The phrase does not leak into the name.
    expect(one('spinach till friday').name).toBe('spinach');
    expect(one('2 eggs use by tomorrow')).toMatchObject({ name: 'eggs', qty: 2 });
  });

  it('a past date this year rolls to next year; time zones shift the day', () => {
    expect(one('milk by 1 jan').expiresAt).toBe(Date.UTC(2027, 0, 1));
    // 23:30 UTC on Saturday 3 Oct is already Sunday 4 Oct in India (+05:30); "tomorrow" is Monday 5 Oct local midnight.
    const late = Date.UTC(2026, 9, 3, 23, 30);
    expect(parseQuickAdd('milk till tomorrow', late, 330)[0]!.expiresAt).toBe(Date.UTC(2026, 9, 5) - 330 * 60_000);
  });

  it('parses a whole sentence', () => {
    const items = parseQuickAdd('2 eggs, spinach till friday, rice 1 kg in the cupboard, frozen peas', NOW);
    expect(items.map((i) => [i.name, i.qty, i.unit, i.location])).toEqual([
      ['eggs', 2, 'pc', 'fridge'],
      ['spinach', 1, 'pc', 'fridge'],
      ['rice', 1, 'kg', 'cupboard'],
      ['peas', 1, 'pc', 'freezer'],
    ]);
    expect(items[1]!.expiresAt).toBe(day(5));
  });
});

describe('quick add: events and restock', () => {
  it('creates valid pantry events that reach the kernel', () => {
    const k = kernelWith();
    const items = parseQuickAdd('2 eggs, milk', NOW);
    const events = quickAddEvents(items, NOW);
    expect(events).toHaveLength(2);
    expect(k.merge(events)).toHaveLength(2);
    expect(k.pantry(NOW).map((p) => [p.name, p.qty])).toEqual(expect.arrayContaining([['eggs', 2], ['milk', 1]]));
    // Adding the same thing again later is a new entry, not a duplicate of the first.
    expect(quickAddEvents(items, NOW + 1)[0]!.id).not.toBe(events[0]!.id);
  });

  it('suggests restocking what was used up, most often first, and not what is still in the pantry', () => {
    const add = (id: string, name: string, at: number) => ({ type: 'pantry.added', at, id: `a-${id}`, item: { id, name, qty: 1, unit: 'pc', location: 'fridge', addedAt: at } }) as const;
    const used = (id: string, at: number) => ({ type: 'pantry.used', at, id: `u-${id}-${at}`, itemId: id }) as const;
    const k = kernelWith([
      add('e1', 'eggs', NOW - 20 * DAY), used('e1', NOW - 18 * DAY),
      add('e2', 'eggs', NOW - 10 * DAY), used('e2', NOW - 8 * DAY),
      add('m1', 'milk', NOW - 6 * DAY), used('m1', NOW - 2 * DAY),
      add('s1', 'spinach', NOW - 3 * DAY), // still in the pantry
      add('r1', 'rice', NOW - 100 * DAY), used('r1', NOW - 90 * DAY), // too long ago
    ]);
    expect(restockSuggestions(k.state, NOW)).toEqual([{ name: 'eggs', times: 2 }, { name: 'milk', times: 1 }]);
    expect(restockSuggestions(k.state, NOW, 1)).toHaveLength(1);
  });
});

describe('quick add: food safety defaults', () => {
  it('keeps raw meat short, dairy cold and eggs for weeks', () => {
    expect(one('chicken')).toMatchObject({ location: 'fridge', expiresAt: day(0) + 2 * DAY });
    expect(one('curd')).toMatchObject({ location: 'fridge', expiresAt: day(0) + 5 * DAY });
    expect(one('paneer')).toMatchObject({ location: 'fridge' });
    expect(one('eggs')).toMatchObject({ location: 'fridge', expiresAt: day(0) + 21 * DAY });
  });
});
