import { describe, expect, it } from 'vitest';
import { CATALOG, chooseForMe, compact, favourites, foodById, fitMatrix, HALF_LIFE, NEVER_HARD_FOR, parseAsk, preferences, replay, resolveRequest } from '../src';
import { DAY0, household, item, kernelWith, T } from './helpers';

describe('recommender', () => {
  it('never recommends a food that breaks an allergy or diet in the household', () => {
    const k = kernelWith([], household());
    const recs = k.recommend({ slot: 'dinner', k: 50 }, T('17:00'));
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) {
      expect(r.food.allergens).not.toContain('nuts');
      expect(['vegan', 'vegetarian']).toContain(r.food.diet);
    }
  });

  it('prefers dishes that use expiring pantry items and says so', () => {
    const k = kernelWith([item('spinach', 1), item('red lentils', 100), item('greek yogurt', 5)]);
    const [top] = k.recommend({ slot: 'dinner', need: 'protein' }, T('17:00'));
    expect(top?.food.id).toBe('lentil-spinach-bowl');
    expect(top?.reasons.join(' ')).toMatch(/spinach before it expires/);
  });

  it('respects time limits and exclusions', () => {
    const recs = kernelWith().recommend({ maxPrepMin: 10, exclude: ['rice'], k: 50 }, T('12:00'));
    expect(recs.every((r) => r.food.prepMin <= 10)).toBe(true);
    expect(recs.some((r) => r.food.ingredients.some((i) => i.includes('rice')))).toBe(false);
  });

  it('prefers gentle food in safe mode', () => {
    const k = kernelWith([{ type: 'illness.started', at: T('07:00') }]);
    const [top] = k.recommend({ slot: 'lunch' }, T('12:00'));
    expect(top?.food.tags).toContain('gentle');
  });

  it('choose for me picks from the shortlist', () => {
    const recs = kernelWith().recommend({ slot: 'snack' }, T('16:00'));
    expect(chooseForMe(recs, () => 0.99)).toBe(recs[recs.length - 1]);
    expect(chooseForMe([], () => 0)).toBeUndefined();
  });
});

describe('memory', () => {
  it('decays feedback by half each half-life', () => {
    const s = replay([{ type: 'feedback', at: DAY0, foodId: 'banana', verdict: 'liked' }]);
    expect(preferences(s, DAY0 + HALF_LIFE).banana!.score).toBeCloseTo(0.5);
  });

  it('"never" is a hard exclusion for a year, then fades', () => {
    const k = kernelWith([{ type: 'feedback', at: T('08:00'), foodId: 'popcorn', verdict: 'never' }]);
    expect(k.recommend({ slot: 'snack', k: 50 }, T('16:00')).some((r) => r.food.id === 'popcorn')).toBe(false);
    const later = T('16:00') + NEVER_HARD_FOR + 1;
    expect(preferences(k.state, later).popcorn!.excluded).toBe(false);
  });

  it('a later "liked" lifts a "never"', () => {
    const s = replay([
      { type: 'feedback', at: DAY0, foodId: 'popcorn', verdict: 'never' },
      { type: 'feedback', at: DAY0 + 5, foodId: 'popcorn', verdict: 'liked' },
    ]);
    expect(preferences(s, DAY0 + 10).popcorn!.excluded).toBe(false);
  });

  it('lists favourites by score', () => {
    const s = replay([
      { type: 'feedback', at: DAY0, foodId: 'banana', verdict: 'liked' },
      { type: 'feedback', at: DAY0, foodId: 'popcorn', verdict: 'liked' },
      { type: 'feedback', at: DAY0, foodId: 'popcorn', verdict: 'liked' },
    ]);
    expect(favourites(s, DAY0 + 1)).toEqual(['popcorn', 'banana']);
  });
});

describe('housekeeping', () => {
  it('finds use-soon and expired items and removes the expired ones', () => {
    const k = kernelWith([item('spinach', 1), item('milk', -1), item('rice', 200)]);
    const result = k.housekeep(T('10:00'));
    expect(result.useSoon.map((p) => p.name)).toEqual(['spinach']);
    expect(result.expired.map((p) => p.name)).toEqual(['milk']);
    expect(k.pantry(T('10:00')).map((p) => p.name)).toEqual(['spinach', 'rice']);
  });

  it('compaction drops old routine events but keeps profile, feedback and pantry', () => {
    const k = kernelWith([
      { type: 'water.logged', at: DAY0 - 200 * 86_400_000, ml: 300 },
      { type: 'feedback', at: DAY0 - 200 * 86_400_000, foodId: 'banana', verdict: 'liked' },
      item('rice', 300),
    ]);
    const before = k.events.length;
    k.compact(DAY0, 90);
    expect(k.events.length).toBe(before - 1);
    expect(k.state.profile).toBeDefined();
    expect(Object.keys(k.state.pantry)).toEqual(['p-rice']);
  });

  it('compaction keeps safe mode on', () => {
    const s = replay([{ type: 'illness.started', at: DAY0 - 200 * 86_400_000 }]);
    expect(compact(s, DAY0).safeModeSince).toBeDefined();
  });
});

describe('household', () => {
  const members = household().members;

  it('builds a fit matrix with reasons', () => {
    const rows = fitMatrix([foodById(CATALOG, 'pesto-pasta')!, foodById(CATALOG, 'lentil-spinach-bowl')!], members);
    expect(rows[0]!.fits.find((f) => f.memberId === 'kid')!.reason).toBe('Contains nuts');
    expect(rows[1]!.everyone).toBe(true);
  });

  it('resolves a conflicting request with a safe variant', () => {
    const res = resolveRequest(foodById(CATALOG, 'pesto-pasta')!, members, CATALOG);
    expect(res.substituted).toBe(true);
    expect(res.chosen.id).toBe('basil-pasta-nut-free');
    expect(res.reason).toMatch(/Kid/);
  });

  it('reports when no safe variant exists', () => {
    const res = resolveRequest(foodById(CATALOG, 'chicken-curry')!, members, CATALOG);
    expect(res.substituted).toBe(false);
    expect(res.reason).toMatch(/Partner/);
  });
});

describe('ask parser', () => {
  it('understands time, mood, slot, need and exclusions', () => {
    const { query, understood } = parseAsk('Something warm for dinner, 15 minutes, high protein, no rice');
    expect(query).toMatchObject({ maxPrepMin: 15, tags: ['warm'], slot: 'dinner', need: 'protein', exclude: ['rice'] });
    expect(understood.length).toBeGreaterThanOrEqual(5);
  });

  it('understands quick, light and who is eating', () => {
    expect(parseAsk('quick light snack just me').query).toMatchObject({ maxPrepMin: 15, light: true, slot: 'snack', memberIds: ['me'] });
    expect(parseAsk('not too heavy').query.exclude).toBeUndefined();
  });

  it('kernel.ask fills the need from the biggest health gap', () => {
    const k = kernelWith([{ type: 'water.logged', at: T('09:00'), ml: 2000 }]);
    const res = k.ask('something warm', T('16:00'));
    expect(res.query.need).toBe('protein');
    expect(res.results.length).toBe(3);
  });
});

describe('weekly plan', () => {
  it('plans every slot, reuses dinner as next-day lunch, and lists groceries', () => {
    const k = kernelWith([item('basmati rice', 200)], household());
    const { plan, grocery } = k.week(T('09:00'));
    expect(plan.meals.length).toBeGreaterThanOrEqual(7 * 3);
    expect(plan.meals.some((m) => m.batch)).toBe(true);
    expect(grocery.some((g) => g.name === 'basmati rice')).toBe(false);
    expect(grocery.length).toBeGreaterThan(0);
    for (const m of plan.meals) expect(m.food.allergens).not.toContain('nuts');
  });
});
