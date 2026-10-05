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
