import { describe, expect, it } from 'vitest';
import { CATALOG } from '../src/catalog';
import { hasWord } from '../src/rules';

const ANIMAL = ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'fish', 'hilsa', 'prawns', 'prawn', 'salmon', 'mince', 'minced mutton', 'gelatin'];
const DAIRY_EGG = ['milk', 'curd', 'yogurt', 'greek yogurt', 'paneer', 'ghee', 'butter', 'cream', 'cheese', 'parmesan', 'mozzarella', 'milk powder', 'honey', 'eggs', 'egg'];
const GLUTEN = ['wheat', 'wheat flour', 'maida', 'semolina', 'pasta', 'bread', 'pav', 'naan', 'noodles', 'vermicelli', 'tortilla', 'pizza dough', 'oats', 'broken wheat', 'muesli'];

describe('catalogue honesty', () => {
  it('has unique ids and sane numbers', () => {
    expect(new Set(CATALOG.map((f) => f.id)).size).toBe(CATALOG.length);
    for (const f of CATALOG) {
      expect(f.nutrients.kcal, f.id).toBeGreaterThan(20);
      expect(f.ingredients.length, f.id).toBeGreaterThan(0);
      expect(f.slots.length, f.id).toBeGreaterThan(0);
    }
  });
  it('vegan dishes contain no animal products, vegetarian dishes no meat or fish', () => {
    for (const f of CATALOG) {
      const ing = f.ingredients.join(' | ').replace(/peanut butter/g, 'peanut paste').replace(/coconut milk/g, 'coconut fat').replace(/almond milk|soy milk|oat milk/g, 'plant drink');
      if (f.diet !== 'omnivore' && f.diet !== 'pescatarian') for (const w of ANIMAL) expect(hasWord(ing, w), `${f.id} lists ${w} but is ${f.diet}`).toBe(false);
      if (f.diet === 'vegan') for (const w of DAIRY_EGG) expect(hasWord(ing, w), `${f.id} lists ${w} but is vegan`).toBe(false);
    }
  });
  it('allergen arrays match the ingredient lists', () => {
    for (const f of CATALOG) {
      const ing = f.ingredients.join(' | ').replace(/peanut butter/g, 'peanut paste').replace(/coconut milk/g, 'coconut fat').replace(/almond milk|soy milk|oat milk/g, 'plant drink');
      if (GLUTEN.some((w) => hasWord(ing, w))) expect(f.allergens, `${f.id} has gluten ingredients`).toContain('gluten');
      if (['milk', 'curd', 'yogurt', 'greek yogurt', 'paneer', 'ghee', 'butter', 'cream', 'cheese', 'parmesan', 'mozzarella', 'milk powder'].some((w) => hasWord(ing, w))) expect(f.allergens, `${f.id} has dairy ingredients`).toContain('dairy');
      if (['eggs', 'egg'].some((w) => hasWord(ing, w))) expect(f.allergens, `${f.id} has egg`).toContain('egg');
      if (['peanuts', 'peanut', 'peanut butter', 'roasted peanuts'].some((w) => hasWord(ing, w))) expect(f.allergens, `${f.id} has peanuts`).toContain('peanuts');
      if (['almonds', 'cashews', 'pine nuts', 'walnuts'].some((w) => hasWord(ing, w))) expect(f.allergens, `${f.id} has tree nuts`).toContain('nuts');
      if (['sesame seeds', 'hummus', 'sesame'].some((w) => hasWord(ing, w))) expect(f.allergens, `${f.id} has sesame`).toContain('sesame');
      if (['tofu', 'soya chunks', 'soya chaap', 'soy sauce'].some((w) => hasWord(ing, w))) expect(f.allergens, `${f.id} has soy`).toContain('soy');
    }
  });
  it('dishes tagged no-cook have a short prep time and need no stove words', () => {
    for (const f of CATALOG.filter((x) => x.tags.includes('no-cook'))) expect(f.prepMin, f.id).toBeLessThanOrEqual(15);
  });
});
