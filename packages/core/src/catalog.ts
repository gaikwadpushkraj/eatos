import type { Food } from './types';

/**
 * Seed catalog. Nutrients are rough per-serving estimates, good enough for
 * recommendations; they are not medical data.
 */
export const CATALOG: Food[] = [
  // Breakfast
  { id: 'oats-banana', name: 'Oats with banana and yogurt', slots: ['breakfast'], tags: ['warm', 'quick', 'fibre'], diet: 'vegetarian', allergens: ['dairy', 'gluten'], prepMin: 8, nutrients: { kcal: 420, proteinG: 18, fibreG: 8, waterMl: 150 }, ingredients: ['oats', 'banana', 'greek yogurt', 'milk'] },
  { id: 'overnight-oats', name: 'Overnight oats with berries', slots: ['breakfast'], tags: ['quick', 'fibre', 'cold'], diet: 'vegetarian', allergens: ['dairy', 'gluten'], prepMin: 5, nutrients: { kcal: 380, proteinG: 15, fibreG: 9, waterMl: 150 }, ingredients: ['oats', 'berries', 'milk', 'chia seeds'] },
  { id: 'eggs-toast', name: 'Eggs on toast', slots: ['breakfast', 'lunch'], tags: ['warm', 'quick', 'high-protein'], diet: 'vegetarian', allergens: ['egg', 'gluten'], prepMin: 10, nutrients: { kcal: 390, proteinG: 22, fibreG: 4, waterMl: 50 }, ingredients: ['eggs', 'bread'] },
  { id: 'tofu-scramble', name: 'Tofu scramble with spinach', slots: ['breakfast', 'lunch'], tags: ['warm', 'quick', 'high-protein'], diet: 'vegan', allergens: ['soy'], prepMin: 12, nutrients: { kcal: 330, proteinG: 24, fibreG: 5, waterMl: 80 }, ingredients: ['tofu', 'spinach', 'onion'] },
  { id: 'poha', name: 'Vegetable poha', slots: ['breakfast'], tags: ['warm', 'quick', 'gentle'], diet: 'vegan', allergens: ['peanuts'], prepMin: 15, nutrients: { kcal: 350, proteinG: 8, fibreG: 4, waterMl: 60 }, ingredients: ['flattened rice', 'onion', 'peas', 'peanuts'] },
  { id: 'poha-no-peanut', name: 'Vegetable poha, peanut-free', slots: ['breakfast'], tags: ['warm', 'quick', 'gentle'], diet: 'vegan', allergens: [], prepMin: 15, nutrients: { kcal: 320, proteinG: 7, fibreG: 4, waterMl: 60 }, ingredients: ['flattened rice', 'onion', 'peas'], variantOf: 'poha' },
  { id: 'yogurt-bowl', name: 'Yogurt bowl with fruit and seeds', slots: ['breakfast', 'snack'], tags: ['quick', 'cold', 'high-protein'], diet: 'vegetarian', allergens: ['dairy'], prepMin: 3, nutrients: { kcal: 280, proteinG: 17, fibreG: 4, waterMl: 120 }, ingredients: ['greek yogurt', 'berries', 'pumpkin seeds'] },

  // Lunch and dinner
  { id: 'lentil-spinach-bowl', name: 'Lentil and spinach bowl with yogurt', slots: ['lunch', 'dinner'], tags: ['warm', 'high-protein', 'fibre', 'comfort'], diet: 'vegetarian', allergens: ['dairy'], prepMin: 20, nutrients: { kcal: 520, proteinG: 32, fibreG: 14, waterMl: 250 }, ingredients: ['red lentils', 'spinach', 'greek yogurt', 'onion', 'garlic', 'cumin', 'lemon'] },
  { id: 'lentil-soup', name: 'Tomato and lentil soup', slots: ['lunch', 'dinner'], tags: ['warm', 'fibre', 'gentle', 'comfort'], diet: 'vegan', allergens: [], prepMin: 15, nutrients: { kcal: 380, proteinG: 18, fibreG: 12, waterMl: 400 }, ingredients: ['red lentils', 'tomatoes', 'onion', 'garlic'] },
  { id: 'egg-fried-rice', name: 'Egg and veggie fried rice', slots: ['lunch', 'dinner'], tags: ['warm', 'quick', 'high-protein'], diet: 'vegetarian', allergens: ['egg', 'soy'], prepMin: 12, nutrients: { kcal: 540, proteinG: 24, fibreG: 5, waterMl: 80 }, ingredients: ['cooked rice', 'eggs', 'peas', 'bell peppers', 'soy sauce'] },
  { id: 'chickpea-salad', name: 'Chickpea salad with flatbread', slots: ['lunch'], tags: ['quick', 'fibre', 'cold'], diet: 'vegan', allergens: ['gluten'], prepMin: 10, nutrients: { kcal: 480, proteinG: 18, fibreG: 13, waterMl: 150 }, ingredients: ['chickpeas', 'tomatoes', 'cucumber', 'flatbread', 'lemon'] },
  { id: 'chickpea-wrap', name: 'Chickpea and hummus wrap', slots: ['lunch'], tags: ['quick', 'fibre'], diet: 'vegan', allergens: ['gluten', 'sesame'], prepMin: 8, nutrients: { kcal: 450, proteinG: 16, fibreG: 11, waterMl: 80 }, ingredients: ['chickpeas', 'hummus', 'tortilla', 'lettuce'] },
  { id: 'paneer-wrap', name: 'Warm paneer wrap', slots: ['lunch', 'dinner'], tags: ['warm', 'quick', 'comfort', 'high-protein'], diet: 'vegetarian', allergens: ['dairy', 'gluten'], prepMin: 8, nutrients: { kcal: 560, proteinG: 28, fibreG: 4, waterMl: 60 }, ingredients: ['paneer', 'tortilla', 'bell peppers', 'onion'] },
  { id: 'paneer-curry', name: 'Paneer and pea curry with rice', slots: ['dinner'], tags: ['warm', 'comfort', 'high-protein', 'spicy'], diet: 'vegetarian', allergens: ['dairy'], prepMin: 30, nutrients: { kcal: 650, proteinG: 30, fibreG: 7, waterMl: 150 }, ingredients: ['paneer', 'peas', 'tomatoes', 'onion', 'basmati rice'] },
  { id: 'paneer-salad', name: 'Paneer salad', slots: ['lunch'], tags: ['quick', 'cold', 'high-protein'], diet: 'vegetarian', allergens: ['dairy'], prepMin: 10, nutrients: { kcal: 430, proteinG: 26, fibreG: 5, waterMl: 150 }, ingredients: ['paneer', 'lettuce', 'tomatoes', 'cucumber'] },
  { id: 'veg-stir-fry', name: 'Vegetable and tofu stir fry', slots: ['dinner'], tags: ['warm', 'quick', 'high-protein'], diet: 'vegan', allergens: ['soy'], prepMin: 15, nutrients: { kcal: 470, proteinG: 25, fibreG: 8, waterMl: 120 }, ingredients: ['tofu', 'bell peppers', 'broccoli', 'basmati rice', 'soy sauce'] },
  { id: 'pesto-pasta', name: 'Pesto pasta', slots: ['dinner'], tags: ['warm', 'comfort'], diet: 'vegetarian', allergens: ['nuts', 'dairy', 'gluten'], prepMin: 15, nutrients: { kcal: 620, proteinG: 20, fibreG: 5, waterMl: 80 }, ingredients: ['pasta', 'basil', 'pine nuts', 'parmesan'] },
  { id: 'basil-pasta-nut-free', name: 'Basil pasta, nut-free', slots: ['dinner'], tags: ['warm', 'comfort'], diet: 'vegetarian', allergens: ['dairy', 'gluten'], prepMin: 15, nutrients: { kcal: 590, proteinG: 21, fibreG: 5, waterMl: 80 }, ingredients: ['pasta', 'basil', 'sunflower seeds', 'parmesan'], variantOf: 'pesto-pasta' },
  { id: 'chicken-curry', name: 'Chicken curry with rice', slots: ['dinner'], tags: ['warm', 'comfort', 'high-protein', 'spicy'], diet: 'omnivore', allergens: [], prepMin: 35, nutrients: { kcal: 680, proteinG: 42, fibreG: 4, waterMl: 150 }, ingredients: ['chicken', 'tomatoes', 'onion', 'basmati rice'] },
  { id: 'chicken-mild-curry', name: 'Mild chicken curry with rice', slots: ['dinner'], tags: ['warm', 'comfort', 'high-protein'], diet: 'omnivore', allergens: ['dairy'], prepMin: 35, nutrients: { kcal: 660, proteinG: 41, fibreG: 4, waterMl: 150 }, ingredients: ['chicken', 'tomatoes', 'yogurt', 'basmati rice'], variantOf: 'chicken-curry' },
  { id: 'salmon-veg', name: 'Baked salmon with vegetables', slots: ['dinner'], tags: ['warm', 'high-protein'], diet: 'pescatarian', allergens: ['fish'], prepMin: 25, nutrients: { kcal: 560, proteinG: 38, fibreG: 6, waterMl: 150 }, ingredients: ['salmon', 'broccoli', 'potatoes', 'lemon'] },
  { id: 'mushroom-risotto', name: 'Mushroom risotto', slots: ['dinner'], tags: ['warm', 'comfort'], diet: 'vegetarian', allergens: ['dairy'], prepMin: 35, nutrients: { kcal: 600, proteinG: 15, fibreG: 3, waterMl: 200 }, ingredients: ['arborio rice', 'mushrooms', 'parmesan', 'onion'] },
  { id: 'veg-pizza', name: 'Homemade vegetable pizza', slots: ['dinner'], tags: ['warm', 'comfort'], diet: 'vegetarian', allergens: ['dairy', 'gluten'], prepMin: 40, nutrients: { kcal: 700, proteinG: 26, fibreG: 6, waterMl: 50 }, ingredients: ['pizza dough', 'tomatoes', 'mozzarella', 'bell peppers'] },
  { id: 'khichdi', name: 'Moong dal khichdi', slots: ['lunch', 'dinner'], tags: ['warm', 'gentle', 'comfort'], diet: 'vegan', allergens: [], prepMin: 25, nutrients: { kcal: 420, proteinG: 16, fibreG: 7, waterMl: 300 }, ingredients: ['moong dal', 'basmati rice', 'turmeric'] },
  { id: 'rice-congee', name: 'Plain rice congee', slots: ['breakfast', 'lunch', 'dinner'], tags: ['warm', 'gentle'], diet: 'vegan', allergens: [], prepMin: 30, nutrients: { kcal: 250, proteinG: 5, fibreG: 1, waterMl: 500 }, ingredients: ['basmati rice', 'ginger'] },

  // Snacks
  { id: 'apple-almonds', name: 'Apple and almonds', slots: ['snack'], tags: ['quick', 'cold', 'light'], diet: 'vegan', allergens: ['nuts'], prepMin: 1, nutrients: { kcal: 250, proteinG: 7, fibreG: 6, waterMl: 100 }, ingredients: ['apple', 'almonds'] },
  { id: 'apple-seeds', name: 'Apple and pumpkin seeds', slots: ['snack'], tags: ['quick', 'cold', 'light'], diet: 'vegan', allergens: [], prepMin: 1, nutrients: { kcal: 220, proteinG: 8, fibreG: 5, waterMl: 100 }, ingredients: ['apple', 'pumpkin seeds'], variantOf: 'apple-almonds' },
  { id: 'hummus-carrots', name: 'Hummus and carrots', slots: ['snack'], tags: ['quick', 'cold', 'light', 'fibre'], diet: 'vegan', allergens: ['sesame'], prepMin: 2, nutrients: { kcal: 180, proteinG: 6, fibreG: 6, waterMl: 80 }, ingredients: ['hummus', 'carrots'] },
  { id: 'yogurt-seeds', name: 'Yogurt with seeds', slots: ['snack'], tags: ['quick', 'cold', 'light', 'high-protein'], diet: 'vegetarian', allergens: ['dairy'], prepMin: 1, nutrients: { kcal: 170, proteinG: 14, fibreG: 2, waterMl: 100 }, ingredients: ['greek yogurt', 'pumpkin seeds'] },
  { id: 'banana', name: 'Banana', slots: ['snack'], tags: ['quick', 'light', 'gentle'], diet: 'vegan', allergens: [], prepMin: 0, nutrients: { kcal: 105, proteinG: 1, fibreG: 3, waterMl: 90 }, ingredients: ['banana'] },
  { id: 'toast-pb', name: 'Toast with peanut butter', slots: ['snack', 'breakfast'], tags: ['quick', 'comfort'], diet: 'vegan', allergens: ['peanuts', 'gluten'], prepMin: 3, nutrients: { kcal: 300, proteinG: 11, fibreG: 3, waterMl: 20 }, ingredients: ['bread', 'peanut butter'] },
  { id: 'popcorn', name: 'Popcorn', slots: ['snack'], tags: ['quick', 'light', 'comfort'], diet: 'vegan', allergens: [], prepMin: 5, nutrients: { kcal: 150, proteinG: 4, fibreG: 5, waterMl: 0 }, ingredients: ['popcorn kernels'] },
  { id: 'recovery-shake', name: 'Milk, banana and oat shake', slots: ['snack'], tags: ['quick', 'cold', 'high-protein', 'recovery'], diet: 'vegetarian', allergens: ['dairy', 'gluten'], prepMin: 3, nutrients: { kcal: 330, proteinG: 18, fibreG: 4, waterMl: 350 }, ingredients: ['milk', 'banana', 'oats'] },
];

export function foodById(catalog: Food[], id: string): Food | undefined {
  return catalog.find((f) => f.id === id);
}

const STEPS: Record<string, string[]> = {
  'lentil-spinach-bowl': [
    'Rinse the lentils. Soften chopped onion and garlic in a little oil for 3 minutes.',
    'Add the lentils, cumin and 3 cups of water. Simmer for 12 minutes until soft.',
    'Stir in the spinach until it wilts, then season with salt and lemon.',
    'Serve in bowls with a spoon of yogurt on top.',
  ],
  'egg-fried-rice': [
    'Heat a pan with a little oil. Scramble the eggs, then set them aside.',
    'Fry the peppers and peas for 3 minutes.',
    'Add the cooked rice and soy sauce, and fry until hot.',
    'Fold the eggs back in and serve.',
  ],
  'lentil-soup': [
    'Soften chopped onion and garlic in a pot for 3 minutes.',
    'Add lentils, chopped tomatoes and 4 cups of water.',
    'Simmer for 10 minutes, then blend until smooth.',
    'Season and serve warm.',
  ],
  'khichdi': [
    'Rinse the dal and rice together.',
    'Add 4 cups of water and turmeric, and bring to the boil.',
    'Simmer for 20 minutes, stirring now and then, until soft.',
    'Season gently and serve warm.',
  ],
};

for (const food of CATALOG) {
  const steps = STEPS[food.id];
  if (steps) food.steps = steps;
}

/** Steps for a food, with a simple generic fallback. */
export function stepsFor(food: Food): string[] {
  if (food.steps?.length) return food.steps;
  const list = food.ingredients.join(', ');
  if (food.prepMin <= 3) return [`Get out: ${list}.`, 'Put it together and enjoy.'];
  return [
    `Gather the ingredients: ${list}.`,
    'Wash and chop what needs it.',
    `Cook or assemble, about ${Math.max(1, food.prepMin - 5)} minutes.`,
    'Taste, season and serve.',
  ];
}
