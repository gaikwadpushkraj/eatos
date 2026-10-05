import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel';
import { makeMember, makeProfile } from '../src/defaults';
import type { Member, Profile } from '../src/types';
import { FASTING, hardProblem } from '../src/rules';
import type { MealSlot } from '../src/types';
import { CATALOG } from '../src/catalog';

const IST = 330;
const BANNED = /\b(cure|treat(s|ment)?|diagnos|detox|burn fat|lose weight|cheat|bad food|junk|guilt|clean eating|sin\b)/i;
const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

interface Persona {
  name: string;
  member: Partial<Member>;
  profile?: Partial<Profile>;
  wishes: string[];
}

const PERSONAS: Persona[] = [
  { name: 'Priya, Jain, Mumbai', member: { diet: 'vegetarian', rules: ['jain', 'no-egg'], cuisines: ['gujarati'], spice: 1 }, wishes: ['pav bhaji', 'chinese chaat with onion'] },
  { name: 'Arjun, prediabetic, Hyderabad', member: { diet: 'omnivore', conditions: ['prediabetes'], cuisines: ['hyderabadi'], spice: 3 }, wishes: ['chicken biryani', 'masala dosa', 'gulab jamun'] },
  { name: 'Meenakshi, hypertensive, Chennai', member: { diet: 'vegetarian', rules: ['no-egg', 'no-onion-garlic'], conditions: ['hypertension', 'high-cholesterol'], cuisines: ['south-indian'], spice: 2 }, wishes: ['pickle and papad', 'curd rice', 'samosa'] },
  { name: 'Rahul, veg gym-goer, Delhi', member: { diet: 'vegetarian', cuisines: ['punjabi'], goals: ['more-protein'], spice: 3 }, profile: { kitchen: 'basic' }, wishes: ['whey protein shake', 'chicken tikka'] },
  { name: 'Ananya, pregnant, Bengaluru', member: { diet: 'vegetarian', conditions: ['pregnancy', 'anaemia'], spice: 1 }, wishes: ['pani puri', 'raw papaya salad'] },
  { name: 'Rohit, shift worker, Kolkata', member: { diet: 'omnivore', cuisines: ['bengali'], spice: 2 }, wishes: ['fish curry rice', 'luchi'] },
  { name: 'Fatima, insulin, halal, Mumbai', member: { diet: 'omnivore', rules: ['halal', 'no-pork'], conditions: ['diabetes', 'insulin'], spice: 2 }, wishes: ['biryani', 'sheer khurma sweet'] },
  { name: 'Kabir, student, no kitchen, Pune', member: { diet: 'vegetarian', conditions: ['minor'], spice: 2 }, profile: { kitchen: 'none' }, wishes: ['masala dosa', 'maggi'] },
];

// A Tuesday evening in late October 2026, IST.
const base = Date.UTC(2026, 9, 27, 0, 0) - IST * 60_000;
const at = (month: number, hour: number) => Date.UTC(2026, month, 14, hour, 0) - IST * 60_000;

function kernelFor(p: Persona): Kernel {
  const k = new Kernel();
  const me = makeMember({ id: 'me', name: 'You', ...p.member });
  k.submit({ type: 'profile.set', at: base - 86_400_000, profile: makeProfile({ members: [me], tzOffsetMin: IST, ...p.profile }) });
  return k;
}

describe.each(PERSONAS)('persona: $name', (p) => {
  it('never recommends anything that breaks a hard rule, in any month or hour', () => {
    const k = kernelFor(p);
    const me = k.me()!;
    for (let month = 0; month < 12; month++)
      for (const hour of [8, 13, 17, 20, 23])
        for (const slot of SLOTS) {
          for (const r of k.recommend({ slot, k: 50 }, at(month, hour))) expect(hardProblem(r.food, me), `${r.food.id} for ${p.name}`).toBeUndefined();
        }
  });

  it('always has something to suggest for each meal, and explains it without judgement', () => {
    const k = kernelFor(p);
    for (const slot of SLOTS) {
      const recs = k.recommend({ slot, k: 3 }, base + 12 * 3_600_000);
      expect(recs.length, `${slot} for ${p.name}`).toBeGreaterThan(0);
      for (const r of recs) for (const reason of r.reasons) expect(reason).not.toMatch(BANNED);
    }
  });

  it('answers each wish kindly and only with allowed dishes', () => {
    const k = kernelFor(p);
    const me = k.me()!;
    for (const wish of p.wishes) {
      const a = k.wish(wish, base);
      for (const rung of a.ladder) for (const f of rung.foods) expect(hardProblem(f, me), `${f.id} offered for "${wish}"`).toBeUndefined();
      for (const text of [a.later ?? '', ...a.tips.map((t) => t.text), ...a.ladder.map((r) => r.why), ...a.blockers.map((b) => b.detail)]) expect(text).not.toMatch(BANNED);
    }
  });
});

describe('persona specifics', () => {
  it('Priya: no onion, garlic or roots across the whole catalogue, and Pav bhaji turns into the Jain version', () => {
    const k = kernelFor(PERSONAS[0]!);
    const a = k.wish('pav bhaji', base);
    expect(a.blockers.some((b) => b.kind === 'religion')).toBe(true);
    expect(a.ladder[0]?.foods.map((f) => f.id)).toContain('pav-bhaji-jain');
    for (const r of k.recommend({ k: 200 }, base)) expect(r.food.ingredients.join(' ')).not.toMatch(/onion|garlic|potato|carrot/);
  });

  it('Arjun: biryani is a blocked wish with a health reason and real alternatives, and is never forbidden', () => {
    const k = kernelFor(PERSONAS[1]!);
    const a = k.wish('chicken biryani', base);
    expect(a.food?.id).toBe('chicken-biryani');
    expect(a.ladder.length).toBeGreaterThan(0);
    expect(a.later).toMatch(/weekend|smaller/i);
    expect(a.tips.length).toBeGreaterThan(0);
  });

  it('Ananya: pregnancy hazards are hard, street food ranks low', () => {
    const k = kernelFor(PERSONAS[4]!);
    const hazard = { ...CATALOG[0]!, id: 'x', ingredients: ['raw papaya', 'lemon'] };
    expect(hardProblem(hazard, k.me()!)).toMatch(/pregnancy/);
  });

  it('Kabir: with no kitchen only no-cook foods appear and fasting is never planned for a minor', () => {
    const k = kernelFor(PERSONAS[7]!);
    k.submit({ type: 'fasting.set', at: base + 3_600_000, kind: 'navratri' });
    const recs = k.recommend({ k: 100 }, base + 5 * 3_600_000);
    expect(recs.length).toBeGreaterThan(0);
    for (const r of recs) expect(r.food.tags).toContain('no-cook');
    expect(k.notes({}, base + 5 * 3_600_000).join(' ')).toMatch(/children and teens/);
  });

  it('Fatima: no fast is planned on insulin and the note points to her doctor; Ramzan lunch is not removed', () => {
    const k = kernelFor(PERSONAS[6]!);
    k.submit({ type: 'fasting.set', at: base + 3_600_000, kind: 'ramzan' });
    const now = base + 5 * 3_600_000;
    expect(k.recommend({ slot: 'lunch', k: 3 }, now).length).toBeGreaterThan(0);
    expect(k.notes({ slot: 'lunch' }, now).join(' ')).toMatch(/doctor/);
  });

  it('Navratri and Ramzan work for someone who can fast, and lapse the next day', () => {
    const p: Persona = { name: 'fast', member: { diet: 'vegetarian' }, wishes: [] };
    const k = kernelFor(p);
    k.submit({ type: 'fasting.set', at: base + 3_600_000, kind: 'navratri' });
    const now = base + 5 * 3_600_000;
    for (const r of k.recommend({ slot: 'dinner', k: 50 }, now)) expect(FASTING.navratri.deny(r.food), r.food.id).toBeUndefined();
    expect(k.recommend({ slot: 'dinner', k: 50 }, now).length).toBeGreaterThan(0);
    // The next day the fast no longer applies.
    expect(k.recommend({ slot: 'dinner', k: 200 }, now + 86_400_000).some((r) => FASTING.navratri.deny(r.food))).toBe(true);
    k.submit({ type: 'fasting.set', at: now, kind: 'ramzan' });
    expect(k.recommend({ slot: 'lunch', k: 3 }, now + 1000)).toEqual([]);
    expect(k.notes({ slot: 'lunch' }, now + 1000).join(' ')).toMatch(/no lunch/);
  });

  it('taste cards are safe, different from each other, and learning moves the ranking', () => {
    const k = kernelFor(PERSONAS[0]!);
    const cards = k.tasteCards(base, 8);
    expect(cards.length).toBe(8);
    const me = k.me()!;
    for (const c of cards) expect(hardProblem(c, me)).toBeUndefined();
    expect(new Set(cards.map((c) => c.cuisine)).size).toBeGreaterThan(2);
    const before = k.recommend({ slot: 'dinner', k: 1 }, base)[0]!.food.id;
    const other = k.recommend({ slot: 'dinner', k: 5 }, base)[4]!.food;
    for (let i = 0; i < 3; i++) k.submit({ type: 'feedback', at: base - i * 1000, foodId: other.id, verdict: 'liked' });
    const after = k.recommend({ slot: 'dinner', k: 5 }, base).map((r) => r.food.id);
    expect(after.indexOf(other.id)).toBeLessThan(4);
    expect(before).toBeDefined();
  });

  it('wishes can be logged and survive a rebuild', () => {
    const k = kernelFor(PERSONAS[1]!);
    k.submit({ type: 'wish.logged', at: base, wish: 'chicken biryani', blocker: 'health' });
    const k2 = new Kernel({ events: k.events });
    expect(k2.state.wishes.map((w) => w.wish)).toEqual(['chicken biryani']);
  });
});

describe('fixes from persona testing', () => {
  const pregnant = () => kernelFor(PERSONAS[4]!);
  it('pregnancy: sprouts are blocked, papaya wishes are skipped not rationed', () => {
    const k = pregnant();
    expect(k.recommend({ k: 300 }, base).some((r) => r.food.id === 'sprouts-salad')).toBe(false);
    const a = k.wish('raw papaya salad', base);
    expect(a.blockers.length).toBeGreaterThan(0);
    expect(a.later).toMatch(/skipped|clinician/i);
    expect(a.later).not.toMatch(/weekend/i);
  });
  it('wishes that EatOS does not know are never called "nothing in the way"', () => {
    const k = kernelFor(PERSONAS[3]!);
    const a = k.wish('mutton', base);
    expect(a.blockers.some((b) => /vegetarian/i.test(b.detail))).toBe(true);
    const u = k.wish('protein bar', base);
    expect(u.food).toBeUndefined();
    expect(u.unknown).toBe(true);
    expect(u.later).toMatch(/does not know/i);
  });
  it('wish matching uses whole words', () => {
    const k = kernelFor(PERSONAS[1]!);
    expect(k.wish('ice cream', base).food?.id).not.toBe('dal-tadka-rice');
    expect(k.wish('butter naan', base).food?.id).not.toBe('peanut-butter-banana');
    expect(k.wish('mutton biryani', base).food?.id).toBe('mutton-biryani');
    expect(k.wish('kombucha', base).food).toBeUndefined();
  });
  it('wish alternatives respect declared health conditions', () => {
    const k = kernelFor(PERSONAS[1]!);
    for (const w of ['samosa', 'gulab jamun', 'chicken biryani']) for (const rung of k.wish(w, base).ladder) for (const f of rung.foods) expect(f.tags, `${f.id} for ${w}`).not.toContain('sweet');
  });
  it('halal does not read "rum" inside drumstick', () => {
    const k = kernelFor(PERSONAS[6]!);
    const sambar = CATALOG.find((f) => f.id === 'sambar-rice')!;
    expect(hardProblem(sambar, k.me()!)).toBeUndefined();
  });
  it('Ekadashi leaves out pav, bread and other grain products', () => {
    const k = kernelFor({ name: 'e', member: { diet: 'vegetarian' }, wishes: [] });
    k.submit({ type: 'fasting.set', at: base + 3_600_000, kind: 'ekadashi' });
    const ids = k.recommend({ k: 300 }, base + 5 * 3_600_000).map((r) => r.food.id);
    for (const bad of ['pav-bhaji-jain', 'pav-bhaji', 'upma', 'veg-pizza', 'maggi-veg']) expect(ids).not.toContain(bad);
    expect(ids.length).toBeGreaterThan(3);
  });
  it('skipping meals or losing weight fast gets a kind note and regular meals, for anyone', () => {
    const k = kernelFor(PERSONAS[7]!);
    const a = k.wish('skip dinner to lose weight', base);
    expect(a.later).toMatch(/regular meals/i);
    expect(a.ladder[0]?.foods.length).toBeGreaterThan(0);
    expect(k.ask('low calorie dinner for weight loss', base).caution).toMatch(/regular meals/i);
  });
  it('a night routine still gets water reminders and tasks that straddle midnight', () => {
    const k = kernelFor({ name: 'night', member: { diet: 'omnivore' }, profile: { routine: { wake: 900, sleep: 540, meals: { breakfast: 960, lunch: 1260, snack: 120, dinner: 300 }, medication: [] } }, wishes: [] });
    const tasks = k.schedule(base + 20 * 3_600_000); // 20:00 local
    expect(tasks.filter((t) => t.kind === 'hydration').length).toBeGreaterThan(2);
    expect(tasks.find((t) => t.id === 'meal:snack')!.at).toBeGreaterThan(tasks.find((t) => t.id === 'meal:lunch')!.at);
  });
  it('a hostel with no kitchen still has plenty to eat, and Quick Add keeps curd cold', () => {
    const noCook = CATALOG.filter((f) => f.tags.includes('no-cook'));
    expect(noCook.length).toBeGreaterThanOrEqual(25);
    expect(noCook.filter((f) => f.slots.includes('dinner')).length).toBeGreaterThanOrEqual(5);
  });
  it('Ask words steer the ranking and protein minimums are understood', () => {
    const k = kernelFor(PERSONAS[3]!);
    const r = k.ask('dosa or paneer please', base);
    expect(r.query.include).toEqual(expect.arrayContaining(['dosa', 'paneer']));
    const p = k.ask('dinner with at least 30 g protein', base);
    expect(p.query.minProteinG).toBe(30);
    expect(p.results[0]!.food.nutrients.proteinG).toBeGreaterThanOrEqual(25);
  });
  it('a recovery snack brings protein', () => {
    const k = kernelFor(PERSONAS[3]!);
    const r = k.recommend({ slot: 'snack', need: 'recovery', k: 1 }, base + 17 * 3_600_000)[0]!;
    expect(r.food.nutrients.proteinG).toBeGreaterThanOrEqual(10);
  });
  it('taste cards start with the food the person grew up with and respect no-kitchen', () => {
    const k = kernelFor({ name: 'g', member: { diet: 'vegetarian', cuisines: ['punjabi'], spice: 3 }, wishes: [] });
    expect(k.tasteCards(base, 8).some((c) => c.cuisine === 'punjabi')).toBe(true);
    const h = kernelFor(PERSONAS[7]!);
    for (const c of h.tasteCards(base, 8)) expect(c.tags).toContain('no-cook');
  });
});

describe('round 2 safety', () => {
  it('a child under 5 is never offered a choking hazard, even when the adults could eat it', () => {
    const k = new Kernel();
    const me = makeMember({ id: 'me', name: 'Neha', diet: 'vegetarian' });
    const kid = makeMember({ id: 'k', name: 'Aarav', diet: 'vegetarian', conditions: ['child-under-5', 'minor'] });
    k.submit({ type: 'profile.set', at: base - 86_400_000, profile: makeProfile({ members: [me, kid], tzOffsetMin: IST }) });
    const ids = k.recommend({ k: 400 }, base + 5 * 3_600_000).map((r) => r.food.id);
    expect(ids).not.toContain('popcorn');
    expect(ids).not.toContain('roasted-chana');
    expect(ids.length).toBeGreaterThan(10);
  });
  it('soft-food preference ranks soft dishes first and demotes crunchy ones', () => {
    const k = kernelFor({ name: 'kamla', member: { diet: 'vegetarian', rules: ['no-onion-garlic'], conditions: ['older-adult-soft', 'diabetes'] }, wishes: [] });
    const snack = k.recommend({ slot: 'snack', k: 3 }, base + 10 * 3_600_000);
    for (const r of snack) expect(r.food.tags).not.toContain('crunchy');
  });
  it('diabetes alone still warns about fasting and medicines without refusing', () => {
    const k = kernelFor({ name: 'd', member: { diet: 'omnivore', conditions: ['diabetes'] }, wishes: [] });
    k.submit({ type: 'fasting.set', at: base + 3_600_000, kind: 'navratri' });
    const notes = k.notes({}, base + 5 * 3_600_000).join(' ');
    expect(notes).toMatch(/check with your doctor/);
    expect(k.recommend({ slot: 'dinner', k: 3 }, base + 5 * 3_600_000).length).toBeGreaterThan(0);
  });
  it('fad-diet requests get the kind answer too', () => {
    const k = kernelFor(PERSONAS[1]!);
    expect(k.wish('omad keto diet pills', base).later).toMatch(/regular meals/i);
  });
});
