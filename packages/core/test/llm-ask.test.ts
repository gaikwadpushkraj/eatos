import { describe, expect, it } from 'vitest';
import { ASK_SCHEMA, parseAskWithLlm, sanitizeAsk } from '../src';
import type { LlmCompleter } from '../src';
import { household, kernelWith, T } from './helpers';

const answer = (o: unknown): LlmCompleter => async () => JSON.stringify(o);
const full = { maxPrepMin: null, tags: [], slot: null, need: null, light: false, exclude: [], justMe: false };

describe('sanitizeAsk', () => {
  it('keeps valid fields and drops everything else', () => {
    const r = sanitizeAsk({ ...full, maxPrepMin: 20.4, tags: ['warm', 'spicy', 'bogus', 7], slot: 'dinner', need: 'protein', exclude: ['Rice', 'x', 'a; drop table', 'mushroom'], justMe: true, extra: 'ignored' })!;
    expect(r.query).toEqual({ maxPrepMin: 20, tags: ['warm', 'spicy'], slot: 'dinner', need: 'protein', exclude: ['rice', 'mushroom'], memberIds: ['me'] });
    expect(r.understood).toContain('Ready in 20 minutes or less');
  });

  it('maps quick and light tags onto the real fields and clamps numbers', () => {
    expect(sanitizeAsk({ ...full, tags: ['quick', 'light'] })!.query).toEqual({ maxPrepMin: 15, light: true });
    expect(sanitizeAsk({ ...full, maxPrepMin: 99999, light: true })!.query.maxPrepMin).toBe(240);
    expect(sanitizeAsk({ ...full, maxPrepMin: -5, light: true })!.query.maxPrepMin).toBeUndefined();
  });

  it('rejects unusable answers', () => {
    for (const bad of [null, 'text', [], 5, full, { slot: 'brunch', need: 'candy', tags: ['x'] }]) expect(sanitizeAsk(bad)).toBeUndefined();
  });

  it('never accepts allergy or diet fields from the model', () => {
    const r = sanitizeAsk({ ...full, slot: 'lunch', allergens: [], diet: 'vegan', memberIds: ['someone-else'] })!;
    expect(Object.keys(r.query).sort()).toEqual(['slot']);
  });

  it('schema requires every field and forbids extras', () => {
    expect(ASK_SCHEMA.additionalProperties).toBe(false);
    expect([...ASK_SCHEMA.required].sort()).toEqual(Object.keys(ASK_SCHEMA.properties).sort());
  });
});

describe('parseAskWithLlm', () => {
  it('uses the model answer when it is good, and adds local exclusions', async () => {
    const out = await parseAskWithLlm('cosy dinner under 25 minutes, no rice', answer({ ...full, maxPrepMin: 25, tags: ['comfort'], slot: 'dinner' }));
    expect(out.source).toBe('llm');
    expect(out.query).toMatchObject({ maxPrepMin: 25, tags: ['comfort'], slot: 'dinner', exclude: ['rice'] });
  });

  it('only sends the question and the schema, never anything about the household', async () => {
    let seen: { system: string; user: string } | undefined;
    await parseAskWithLlm('quick lunch', async (i) => {
      seen = i;
      return JSON.stringify({ ...full, slot: 'lunch' });
    });
    expect(seen!.user).toBe('quick lunch');
    // The prompt is fixed text: nothing from the profile can be in it.
    expect(seen!.system).not.toMatch(/Partner|Kid|peanut/);
    expect(seen!.system).toContain('Never invent dietary restrictions or allergies');
  });

  it('falls back to the rules without a completer, on errors, bad JSON, empty answers and timeouts', async () => {
    const text = 'something warm for dinner, 20 minutes';
    const expected = (await parseAskWithLlm(text, undefined)).query;
    expect(expected).toMatchObject({ maxPrepMin: 20, slot: 'dinner' });
    const cases: [LlmCompleter, string][] = [
      [async () => { throw new Error('401 invalid key'); }, '401 invalid key'],
      [async () => 'not json', 'valid JSON'],
      [answer(full), 'did not understand'],
      [() => new Promise(() => {}), 'too long'],
    ];
    for (const [c, reason] of cases) {
      const out = await parseAskWithLlm(text, c, { timeoutMs: 30 });
      expect(out.source).toBe('rules');
      expect(out.fallbackReason).toContain(reason);
      expect(out.query).toEqual(expected);
    }
  });

  it('a model answer still cannot break an allergy: the recommender enforces it', async () => {
    const k = kernelWith([], household()); // kid is allergic to nuts
    const out = await parseAskWithLlm('anything at all', answer({ ...full, slot: 'snack', tags: ['cold'], justMe: false }));
    const res = k.answer({ query: { ...out.query, k: 50 }, understood: out.understood }, T('16:00'));
    expect(res.results.length).toBeGreaterThan(0);
    for (const r of res.results) expect(r.food.allergens).not.toContain('nuts');
  });
});
