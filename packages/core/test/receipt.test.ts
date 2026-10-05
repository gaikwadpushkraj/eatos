import { describe, expect, it } from 'vitest';
import { aisleFor, allergensIn, deliveryOptions, makeMember, makeProfile, menuBlocker, orderEvents, parseReceipt, receiptEvents } from '../src';
import type { EatEvent, MenuItem } from '../src';
import { DAY0, household, kernelWith, T } from './helpers';

const receipt = `FRESH MARKET
Tel 555 0100
2 x Bananas            1.20
SPINACH BABY 200G      1.50
Greek Yogurt 500g      3.50
Tomatoes x4            2.00
Frozen Peas 1kg        1.80
Basmati Rice 2kg       4.20
Mystery Gadget         9.99
Eggs 12                2.80
SUBTOTAL               17.00
VAT                    0.00
TOTAL                  17.00
Thank you for shopping`;

describe('receipt driver', () => {
  it('reads known foods, quantities and units, and reports what it did not recognise', () => {
    const { items, unknown } = parseReceipt(receipt);
    expect(items.map((i) => [i.name, i.qty, i.unit])).toEqual([
      ['banana', 2, 'pc'],
      ['spinach', 200, 'g'],
      ['greek yogurt', 500, 'g'],
      ['tomatoes', 4, 'pc'],
      ['peas', 1, 'kg'],
      ['basmati rice', 2, 'kg'],
      ['eggs', 1, 'pc'],
    ]);
    expect(items.find((i) => i.name === 'peas')!.frozen).toBe(true);
    expect(unknown).toEqual(['Mystery Gadget         9.99']);
  });

  it('creates pantry items with sensible places and expiry, with stable ids', () => {
    const { events } = receiptEvents(receipt, T('10:00'));
    const items = events.map((e) => (e as Extract<EatEvent, { type: 'pantry.added' }>).item);
    expect(items.find((i) => i.name === 'peas')).toMatchObject({ location: 'freezer', expiresAt: T('10:00') + 90 * 86_400_000 });
    expect(items.find((i) => i.name === 'spinach')).toMatchObject({ location: 'fridge', expiresAt: T('10:00') + 5 * 86_400_000 });
    expect(items.find((i) => i.name === 'basmati rice')!.location).toBe('cupboard');
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
    expect(receiptEvents(receipt, T('10:00')).events.map((e) => e.id)).toEqual(events.map((e) => e.id));
  });

  it('importing the same receipt twice adds nothing; pantry feeds recommendations', () => {
    const k = kernelWith([], household());
    const { events } = receiptEvents(receipt, T('09:00'));
    expect(k.merge(events)).toHaveLength(events.length);
    expect(k.merge(receiptEvents(receipt, T('09:00')).events)).toHaveLength(0);
    expect(Object.keys(k.state.pantry)).toHaveLength(events.length);
    const [top] = k.recommend({ slot: 'lunch', need: 'protein' }, T('12:00'));
    expect(top).toBeDefined();
  });

  it('duplicate lines get distinct ids', () => {
    const { events } = receiptEvents('Bananas 1.00\nBananas 1.00', T('09:00'));
    expect(new Set(events.map((e) => e.id)).size).toBe(2);
  });

  it('knows aisles and hidden allergens', () => {
    expect(aisleFor('spinach')).toBe('Produce');
    expect(aisleFor('paneer')).toBe('Dairy and protein');
    expect(allergensIn('almond butter')).toEqual(['nuts', 'dairy']);
  });
});

const menu: MenuItem[] = [
  { id: 'm1', restaurant: 'Spice Co', name: 'Paneer tikka bowl', allergens: ['dairy'], diet: 'vegetarian', tags: ['warm', 'high-protein'], proteinG: 32, etaMin: 25, priceCents: 1200 },
  { id: 'm2', restaurant: 'Spice Co', name: 'Satay noodles', allergens: ['peanuts', 'soy'], diet: 'vegan', tags: ['warm'], etaMin: 20, priceCents: 1000 },
  { id: 'm3', restaurant: 'Corner Cafe', name: 'Daily special', tags: ['warm'], etaMin: 10, priceCents: 800 },
  { id: 'm4', restaurant: 'Green Bowl', name: 'Quinoa salad', allergens: [], diet: 'vegan', tags: ['cold'], etaMin: 15, priceCents: 900 },
  { id: 'm5', restaurant: 'Spice Co', name: 'Chicken tikka', allergens: ['dairy'], diet: 'omnivore', tags: ['warm', 'high-protein'], proteinG: 40, etaMin: 30, priceCents: 1300 },
];

describe('delivery driver', () => {
  it('treats missing allergen or diet information as unsafe', () => {
    const allergic = makeMember({ id: 'a', name: 'Kid', allergens: ['peanuts'] });
    const vegan = makeMember({ id: 'b', name: 'Vee', diet: 'vegan' });
    expect(menuBlocker(menu[2]!, allergic)).toMatch(/No allergen information/);
    expect(menuBlocker(menu[1]!, allergic)).toBe('Contains peanuts');
    expect(menuBlocker(menu[2]!, vegan)).toMatch(/Diet not stated/);
    expect(menuBlocker(menu[0]!, vegan)).toBe('Not vegan');
    expect(menuBlocker(menu[3]!, vegan)).toBeUndefined();
    expect(menuBlocker(menu[2]!, makeMember({ id: 'c', name: 'Plain' }))).toBeUndefined();
  });

  it('only offers what everyone in the household can eat', () => {
    const k = kernelWith([], household()); // kid: nuts/peanuts, partner: vegetarian
    const ids = deliveryOptions(k.state, menu, { k: 10 }, T('18:00')).map((o) => o.item.id);
    expect([...ids].sort()).toEqual(['m1', 'm4']);
  });

  it('ranks by tags, protein need and arrival time, and applies limits', () => {
    const k = kernelWith([], makeProfile());
    const ranked = deliveryOptions(k.state, menu, { tags: ['warm'], need: 'protein', k: 5 }, T('18:00')).map((o) => o.item.id);
    expect(ranked[0]).toBe('m5');
    expect(deliveryOptions(k.state, menu, { maxEtaMin: 15 }, T('18:00')).map((o) => o.item.id).sort()).toEqual(['m3', 'm4']);
    expect(deliveryOptions(k.state, menu, { maxPriceCents: 900, exclude: ['quinoa'] }, T('18:00')).map((o) => o.item.id).sort()).toEqual(['m3']);
  });

  it('respects "never again" feedback', () => {
    const k = kernelWith([{ type: 'feedback', at: T('09:00'), foodId: 'm5', verdict: 'never' }]);
    expect(deliveryOptions(k.state, menu, { k: 10 }, T('18:00')).some((o) => o.item.id === 'm5')).toBe(false);
  });

  it('records an order as intake, once', () => {
    const k = kernelWith();
    const e = orderEvents(k.state, menu[0]!, 'dinner', T('19:00'));
    k.merge(e);
    k.merge(orderEvents(k.state, menu[0]!, 'dinner', T('19:00')));
    expect(k.events.filter((x) => x.type === 'intake.logged')).toHaveLength(1);
    expect(k.schedule(T('20:00')).find((t) => t.id === 'meal:dinner')!.state).toBe('done');
    expect(k.events.at(-1)!.at).toBeGreaterThan(DAY0);
  });
});

describe('menu parsing', () => {
  it('keeps good dishes and explains the rest', async () => {
    const { parseMenu } = await import('../src');
    const { items, problems } = parseMenu(JSON.stringify([
      { id: 'a', name: 'Good', allergens: ['dairy'], diet: 'vegetarian', kcal: 500, etaMin: 20 },
      { id: 'b', name: 'Bad number', kcal: 'lots' },
      { id: 'c', name: 'Bad allergen', allergens: ['gluten-free'] },
      { id: 'a', name: 'Duplicate' },
      { name: 'No id' },
      { id: 'd', name: 'Bad diet', diet: 'carnivore' },
      { id: 'e', name: 'No info' },
    ]));
    expect(items.map((i) => i.id)).toEqual(['a', 'e']);
    expect(items[1]!.allergens).toBeUndefined(); // unknown stays unknown, never "none"
    expect(problems).toHaveLength(5);
    expect(parseMenu('nope').problems[0]).toMatch(/valid JSON/);
    expect(parseMenu('{}').problems[0]).toMatch(/list/);
  });
});
