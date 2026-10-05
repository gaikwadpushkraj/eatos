import type { Allergen, Diet, Food, MealSlot } from './types';

/**
 * Indian dishes for the metro kitchen. Numbers are rounded per-serving
 * estimates (IFCT 2017 and USDA by memory; see docs/research), good for
 * ranking but not medical data. Ingredient lists are what the rule engine
 * reads (Jain, fasting, pregnancy), so each dish lists its onion, garlic
 * and roots explicitly.
 */
const S: Record<string, MealSlot> = { B: 'breakfast', L: 'lunch', D: 'dinner', S: 'snack' };

type Row = [
  id: string,
  name: string,
  cuisine: string,
  slots: string,
  diet: Diet,
  tags: string,
  allergens: Allergen[],
  prep: number,
  spice: 0 | 1 | 2 | 3,
  kcal: number,
  protein: number,
  fibre: number,
  water: number,
  ingredients: string,
  variantOf?: string,
];

const ROWS: Row[] = [
  // Breakfast
  ['idli-sambar', 'Idli with sambar', 'south-indian', 'B', 'vegan', 'warm gentle ferment low-sodium', [], 15, 1, 260, 10, 6, 250, 'rice, urad dal, toor dal, tomatoes, drumstick, sambar powder, tamarind'],
  ['masala-dosa', 'Masala dosa', 'south-indian', 'B', 'vegan', 'warm comfort high-gi fried', [], 25, 1, 380, 8, 4, 100, 'rice, urad dal, potatoes, onion, mustard seeds, curry leaves'],
  ['pesarattu', 'Pesarattu (green moong dosa)', 'andhra', 'B', 'vegan', 'warm high-protein fibre low-gi', [], 20, 2, 280, 15, 7, 100, 'green moong, ginger, green chilli, cumin'],
  ['ragi-dosa', 'Ragi dosa with chutney', 'karnataka', 'B', 'vegan', 'warm fibre low-gi iron', [], 20, 1, 230, 6, 5, 100, 'ragi, urad dal, coconut, green chilli'],
  ['poha-jain', 'Kanda-free poha', 'maharashtrian', 'B', 'vegan', 'warm quick gentle', ['peanuts'], 15, 1, 300, 7, 4, 80, 'flattened rice, peanuts, curry leaves, lemon, mustard seeds', 'poha'],
  ['upma', 'Rava upma', 'south-indian', 'B', 'vegan', 'warm quick comfort high-gi', ['gluten'], 15, 1, 280, 7, 4, 100, 'semolina, onion, mustard seeds, curry leaves, green chilli'],
  ['besan-chilla', 'Besan chilla with mint chutney', 'north-indian', 'B', 'vegan', 'warm quick high-protein fibre', [], 15, 2, 240, 13, 5, 80, 'besan, onion, tomatoes, coriander, green chilli'],
  ['moong-chilla-jain', 'Moong dal chilla (no onion)', 'gujarati', 'B', 'vegan', 'warm quick high-protein fibre low-gi', [], 15, 1, 230, 14, 6, 80, 'moong dal, coriander, cumin, green chilli, hing'],
  ['aloo-paratha', 'Aloo paratha with curd', 'punjabi', 'B', 'vegetarian', 'warm comfort high-gi lactose', ['gluten', 'dairy'], 25, 2, 420, 11, 5, 120, 'wheat flour, potatoes, onion, curd, ghee, green chilli'],
  ['thepla', 'Methi thepla with curd', 'gujarati', 'B', 'vegetarian', 'warm quick fibre iron', ['gluten', 'dairy'], 20, 1, 330, 11, 6, 120, 'wheat flour, fenugreek leaves, curd, sesame seeds, ajwain', ],
  ['dhokla', 'Khaman dhokla', 'gujarati', 'B', 'vegan', 'quick light ferment low-sodium', [], 20, 1, 200, 9, 3, 80, 'besan, lemon, mustard seeds, green chilli, hing'],
  ['egg-bhurji', 'Egg bhurji with pav', 'mumbai', 'B', 'vegetarian', 'warm quick high-protein', ['egg', 'gluten'], 12, 2, 380, 20, 3, 80, 'eggs, onion, tomatoes, pav, green chilli'],
  ['sabudana-khichdi', 'Sabudana khichdi', 'maharashtrian', 'B', 'vegan', 'warm comfort high-gi', ['peanuts'], 20, 1, 360, 5, 2, 80, 'sabudana, peanuts, potatoes, cumin, sendha namak'],
  ['fruit-curd-bowl', 'Curd with fruit and nuts', 'pan-indian', 'B S', 'vegetarian', 'quick cold cooling high-protein lactose no-cook', ['dairy', 'nuts'], 3, 0, 260, 12, 4, 150, 'curd, banana, apple, almonds'],
  // Lunch and dinner
  ['dal-tadka-rice', 'Dal tadka with rice and salad', 'north-indian', 'L D', 'vegetarian', 'warm comfort fibre', ['dairy'], 30, 1, 520, 17, 9, 250, 'toor dal, rice, onion, tomatoes, garlic, ghee, cumin, cucumber'],
  ['dal-rice-jain', 'Moong dal with rice (Jain style)', 'gujarati', 'L D', 'vegetarian', 'warm gentle comfort', ['dairy'], 25, 0, 440, 15, 7, 300, 'moong dal, rice, hing, ghee, cumin, coriander, lemon'],
  ['rajma-chawal', 'Rajma chawal', 'punjabi', 'L D', 'vegan', 'warm comfort high-protein fibre iron', [], 40, 2, 580, 20, 14, 250, 'rajma, rice, onion, tomatoes, garlic, ginger'],
  ['chole-roti', 'Chole with roti', 'punjabi', 'L D', 'vegan', 'warm comfort high-protein fibre iron', ['gluten'], 40, 2, 560, 19, 15, 200, 'chickpeas, wheat flour, onion, tomatoes, garlic, ginger'],
  ['palak-paneer-roti', 'Palak paneer with roti', 'north-indian', 'L D', 'vegetarian', 'warm comfort high-protein iron', ['dairy', 'gluten'], 30, 1, 520, 24, 8, 200, 'spinach, paneer, wheat flour, onion, garlic, tomatoes'],
  ['paneer-bhurji-jain', 'Paneer bhurji with roti (Jain)', 'gujarati', 'L D', 'vegetarian', 'warm quick high-protein', ['dairy', 'gluten'], 15, 1, 480, 25, 5, 100, 'paneer, tomatoes, capsicum, wheat flour, hing, cumin'],
  ['bhindi-roti', 'Bhindi sabzi with roti and dal', 'north-indian', 'L D', 'vegan', 'warm fibre low-gi', ['gluten'], 25, 1, 430, 14, 10, 150, 'okra, wheat flour, toor dal, onion, tomatoes, garlic'],
  ['lauki-roti', 'Lauki sabzi with roti and dal', 'north-indian', 'L D', 'vegan', 'warm gentle light fibre cooling', ['gluten'], 25, 0, 380, 13, 9, 250, 'bottle gourd, wheat flour, moong dal, cumin, coriander, hing'],
  ['jowar-roti-dal', 'Jowar roti with dal and sabzi', 'maharashtrian', 'L D', 'vegan', 'warm fibre low-gi iron', [], 30, 1, 450, 16, 11, 200, 'jowar flour, toor dal, brinjal, onion, garlic'],
  ['bajra-khichdi', 'Bajra khichdi with curd', 'rajasthani', 'L D', 'vegetarian', 'warm comfort fibre low-gi iron lactose', ['dairy'], 35, 1, 420, 14, 9, 250, 'bajra, moong dal, ghee, cumin, curd'],
  ['khichdi-kadhi', 'Moong khichdi with kadhi', 'gujarati', 'L D', 'vegetarian', 'warm gentle comfort lactose', ['dairy'], 30, 0, 480, 17, 6, 350, 'moong dal, rice, curd, besan, ghee, cumin, hing, ginger'],
  ['curd-rice', 'Curd rice with pickle', 'south-indian', 'L D', 'vegetarian', 'cool gentle cooling lactose high-sodium no-cook', ['dairy'], 15, 0, 380, 10, 2, 250, 'rice, curd, mustard seeds, curry leaves, ginger, green chilli'],
  ['sambar-rice', 'Sambar rice with poriyal', 'south-indian', 'L D', 'vegan', 'warm comfort fibre', [], 30, 2, 500, 15, 10, 300, 'rice, toor dal, drumstick, tomatoes, onion, beans, tamarind'],
  ['rasam-rice', 'Rasam rice with beans poriyal', 'south-indian', 'L D', 'vegan', 'warm gentle light low-sodium', [], 25, 1, 380, 9, 6, 400, 'rice, tomatoes, toor dal, tamarind, pepper, cumin, garlic'],
  ['lemon-rice', 'Lemon rice with peanuts', 'south-indian', 'L', 'vegan', 'warm quick high-gi', ['peanuts'], 20, 1, 380, 8, 4, 80, 'rice, lemon, peanuts, curry leaves, mustard seeds, turmeric'],
  ['veg-pulao', 'Vegetable pulao with raita', 'north-indian', 'L D', 'vegetarian', 'warm comfort lactose', ['dairy'], 30, 1, 480, 11, 6, 200, 'basmati rice, peas, carrots, beans, onion, curd, cumin'],
  ['millet-pulao', 'Foxtail millet pulao with raita', 'south-indian', 'L D', 'vegetarian', 'warm fibre low-gi lactose', ['dairy'], 30, 1, 420, 12, 9, 200, 'foxtail millet, peas, carrots, beans, onion, curd, cumin', 'veg-biryani'],
  ['veg-biryani', 'Vegetable biryani with raita', 'hyderabadi', 'L D', 'vegetarian', 'warm festive comfort high-gi lactose high-sodium', ['dairy'], 60, 2, 620, 14, 6, 150, 'basmati rice, onion, garlic, ginger, carrots, peas, curd, ghee, biryani masala'],
  ['chicken-biryani', 'Chicken biryani with raita', 'hyderabadi', 'L D', 'omnivore', 'warm festive comfort high-gi high-sodium high-protein high-purine lactose', ['dairy'], 75, 3, 720, 32, 4, 150, 'basmati rice, chicken, onion, garlic, ginger, curd, ghee, biryani masala'],
  ['egg-curry-rice', 'Egg curry with rice', 'bengali', 'L D', 'vegetarian', 'warm comfort high-protein', ['egg'], 30, 2, 560, 22, 4, 200, 'eggs, rice, onion, tomatoes, garlic, ginger'],
  ['fish-curry-rice', 'Fish curry with rice', 'bengali', 'L D', 'pescatarian', 'warm comfort high-protein', ['fish'], 35, 2, 560, 30, 3, 250, 'fish, rice, mustard oil, tomatoes, onion, turmeric'],
  ['chicken-curry-roti', 'Chicken curry with roti', 'north-indian', 'D', 'omnivore', 'warm comfort high-protein spicy high-purine', ['gluten'], 40, 3, 600, 38, 5, 200, 'chicken, wheat flour, onion, tomatoes, garlic, ginger'],
  ['tandoori-chicken-salad', 'Grilled chicken tikka with salad', 'punjabi', 'L D', 'omnivore', 'quick high-protein low-gi light', ['dairy'], 25, 2, 380, 40, 3, 150, 'chicken, curd, cucumber, onion, lemon'],
  ['paneer-tikka-salad', 'Paneer tikka with salad', 'punjabi', 'L D', 'vegetarian', 'quick high-protein low-gi lactose', ['dairy'], 20, 2, 360, 24, 3, 120, 'paneer, curd, capsicum, onion, cucumber, lemon'],
  ['soya-chunk-curry', 'Soya chunk curry with roti', 'north-indian', 'L D', 'vegan', 'warm high-protein fibre', ['soy', 'gluten'], 25, 2, 500, 32, 8, 150, 'soya chunks, wheat flour, onion, tomatoes, garlic'],
  ['sprouts-salad', 'Sprouts and vegetable salad', 'pan-indian', 'L S', 'vegan', 'cold cooling light high-protein fibre low-gi no-cook', [], 10, 0, 220, 14, 9, 200, 'moong sprouts, cucumber, tomatoes, onion, lemon, coriander'],
  ['kachumber-curd', 'Kachumber with curd and roasted papad', 'pan-indian', 'L', 'vegetarian', 'cold cooling light lactose no-cook', ['dairy'], 8, 0, 200, 9, 4, 250, 'cucumber, tomatoes, onion, curd, coriander, papad'],
  ['misal-pav', 'Misal pav', 'maharashtrian', 'B L', 'vegan', 'warm spicy comfort fibre street high-sodium', ['gluten'], 30, 3, 540, 17, 12, 150, 'moth beans, pav, onion, garlic, tomatoes, farsan'],
  ['pav-bhaji', 'Pav bhaji', 'mumbai', 'D', 'vegetarian', 'warm comfort street high-gi fried', ['gluten', 'dairy'], 40, 2, 650, 14, 8, 150, 'potatoes, cauliflower, peas, tomatoes, onion, garlic, butter, pav'],
  ['pav-bhaji-jain', 'Pav bhaji (Jain style)', 'mumbai', 'D', 'vegetarian', 'warm comfort high-gi', ['gluten', 'dairy'], 40, 1, 600, 13, 8, 150, 'raw banana, cauliflower, peas, tomatoes, butter, pav, bhaji masala', 'pav-bhaji'],
  ['kathi-roll-paneer', 'Paneer kathi roll', 'kolkata', 'L D', 'vegetarian', 'warm quick street high-protein lactose', ['dairy', 'gluten'], 15, 2, 520, 22, 4, 80, 'paneer, wheat flour, onion, capsicum, green chilli'],
  ['maggi-veg', 'Veg instant noodles with an egg', 'pan-indian', 'S D', 'vegetarian', 'warm quick comfort high-sodium high-gi', ['gluten', 'egg'], 7, 2, 420, 16, 3, 150, 'instant noodles, eggs, peas, onion'],
  ['luchi-alu-dum', 'Luchi with aloo dum', 'bengali', 'B D', 'vegan', 'warm comfort festive fried high-gi', ['gluten'], 35, 1, 620, 9, 5, 80, 'maida, potatoes, onion, ginger, cumin'],
  ['thukpa', 'Vegetable thukpa', 'northeast', 'D', 'vegan', 'warm comfort gentle light', ['gluten'], 25, 1, 380, 12, 6, 450, 'noodles, cabbage, carrots, garlic, ginger, soy sauce'],
  // Fasting
  ['kuttu-roti-aloo', 'Kuttu roti with aloo jeera and curd', 'north-indian', 'L D', 'vegetarian', 'warm comfort lactose', ['dairy'], 30, 1, 480, 12, 7, 200, 'kuttu flour, potatoes, cumin, sendha namak, curd'],
  ['samak-pulao', 'Samak rice pulao with peanuts', 'north-indian', 'L D', 'vegan', 'warm quick gentle', ['peanuts'], 20, 0, 400, 9, 5, 150, 'samak rice, peanuts, potatoes, cumin, sendha namak'],
  ['makhana-kheer', 'Makhana kheer', 'north-indian', 'S', 'vegetarian', 'warm comfort sweet lactose', ['dairy', 'nuts'], 20, 0, 260, 8, 2, 150, 'makhana, milk, almonds, cardamom, jaggery'],
  ['fruit-chaat', 'Fruit chaat with sendha namak', 'north-indian', 'B S', 'vegan', 'quick cold cooling light no-cook', [], 5, 0, 140, 2, 5, 220, 'banana, apple, papaya, pomegranate, lemon, sendha namak'],
  ['sweet-potato-chaat', 'Sweet potato chaat', 'north-indian', 'S', 'vegan', 'warm quick light', [], 12, 0, 210, 3, 5, 100, 'sweet potatoes, lemon, sendha namak, cumin'],
  ['sabudana-vada', 'Sabudana vada with curd', 'maharashtrian', 'S', 'vegetarian', 'warm fried comfort high-gi', ['peanuts', 'dairy'], 30, 1, 380, 7, 2, 80, 'sabudana, potatoes, peanuts, cumin, sendha namak, curd'],
  // Snacks
  ['roasted-chana', 'Roasted chana with lemon', 'pan-indian', 'S', 'vegan', 'quick light high-protein fibre low-gi low-sodium no-cook', [], 1, 0, 180, 10, 8, 20, 'roasted chana, lemon, black salt'],
  ['makhana-roasted', 'Roasted makhana', 'pan-indian', 'S', 'vegan', 'quick light low-sodium no-cook', [], 8, 0, 130, 4, 1, 10, 'makhana, ghee, black pepper'],
  ['murmura-bhel', 'Murmura bhel with lemon', 'mumbai', 'S', 'vegan', 'quick light cooling street no-cook', ['peanuts'], 5, 1, 190, 5, 3, 40, 'puffed rice, peanuts, cucumber, tomatoes, onion, lemon, coriander'],
  ['masala-chaas', 'Masala chaas', 'pan-indian', 'S', 'vegetarian', 'cold cooling light lactose low-sodium no-cook', ['dairy'], 2, 0, 70, 3, 0, 250, 'curd, cumin, mint, coriander'],
  ['coconut-water', 'Coconut water', 'pan-indian', 'S', 'vegan', 'cold cooling light no-cook', [], 0, 0, 60, 1, 3, 300, 'coconut water'],
  ['boiled-eggs', 'Two boiled eggs with pepper', 'pan-indian', 'S B', 'vegetarian', 'quick light high-protein no-cook', ['egg'], 10, 0, 160, 13, 0, 20, 'eggs, black pepper'],
  ['chikki', 'Peanut jaggery chikki', 'maharashtrian', 'S', 'vegan', 'quick sweet high-gi', ['peanuts'], 1, 0, 190, 5, 2, 10, 'peanuts, jaggery'],
  ['samosa', 'Samosa with chutney', 'north-indian', 'S', 'vegan', 'warm fried street high-gi', ['gluten'], 5, 2, 310, 5, 3, 40, 'maida, potatoes, peas, onion, ginger, garlic'],
  ['gulab-jamun', 'Gulab jamun', 'north-indian', 'S', 'vegetarian', 'sweet festive comfort high-gi lactose', ['dairy', 'gluten'], 5, 0, 300, 4, 0, 40, 'milk powder, maida, sugar, cardamom, ghee'],
  ['sweet-curd-mango', 'Mango curd cup', 'pan-indian', 'S', 'vegetarian', 'cold cooling sweet lactose', ['dairy'], 3, 0, 190, 6, 2, 150, 'curd, mango, cardamom'],
  ['paneer-sandwich', 'Grilled paneer sandwich', 'pan-indian', 'S L', 'vegetarian', 'warm quick high-protein lactose', ['dairy', 'gluten'], 10, 1, 360, 18, 4, 80, 'bread, paneer, capsicum, onion, butter'],
  ['peanut-butter-banana', 'Peanut butter and banana on toast', 'pan-indian', 'B S', 'vegan', 'quick no-cook comfort', ['peanuts', 'gluten'], 4, 0, 340, 11, 5, 80, 'bread, peanut butter, banana'],
  ['oats-upma', 'Vegetable oats upma', 'south-indian', 'B', 'vegan', 'warm quick fibre low-gi', ['gluten'], 12, 1, 260, 8, 6, 120, 'oats, onion, carrots, peas, mustard seeds, curry leaves'],
  ['dalia-khichdi', 'Vegetable dalia khichdi', 'north-indian', 'B L D', 'vegan', 'warm gentle fibre low-gi comfort', ['gluten'], 25, 0, 330, 11, 8, 300, 'broken wheat, moong dal, carrots, peas, cumin, ginger'],
  ['ragi-malt', 'Ragi malt', 'karnataka', 'B S', 'vegetarian', 'warm gentle iron low-gi lactose', ['dairy'], 8, 0, 190, 7, 4, 250, 'ragi, milk, jaggery'],
];

function dish(r: Row): Food {
  const [id, name, cuisine, slots, diet, tags, allergens, prepMin, spice, kcal, proteinG, fibreG, waterMl, ingredients, variantOf] = r;
  return {
    id,
    name,
    cuisine,
    spice,
    diet,
    slots: slots.split(' ').map((s) => S[s]!) as MealSlot[],
    tags: tags.split(' '),
    allergens,
    prepMin,
    nutrients: { kcal, proteinG, fibreG, waterMl },
    ingredients: ingredients.split(', '),
    ...(variantOf ? { variantOf } : {}),
  };
}

export const INDIA_CATALOG: Food[] = ROWS.map(dish);
