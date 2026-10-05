/** Corrections from the clinical dietitian review (see expert_reports/dietitian.md). Applied over the catalogue. */
import type { Allergen, Food } from './types';

export const DIETITIAN_PATCHES: Record<string, Partial<Pick<Food, 'tags' | 'allergens' | 'nutrients' | 'ingredients' | 'diet'>>> = {
 "idli-chutney-jain": {
  "allergens": [
   "gluten"
  ]
 },
 "moong-chilla-jain": {
  "allergens": [
   "gluten"
  ]
 },
 "dhokla": {
  "allergens": [
   "gluten"
  ],
  "tags": [
   "quick",
   "light",
   "ferment"
  ]
 },
 "lauki-roti": {
  "allergens": [
   "gluten"
  ]
 },
 "dal-rice-jain": {
  "allergens": [
   "dairy",
   "gluten"
  ]
 },
 "khichdi-kadhi": {
  "allergens": [
   "dairy",
   "gluten"
  ]
 },
 "rasam-rice-satvik": {
  "allergens": [
   "gluten"
  ],
  "tags": [
   "warm",
   "gentle",
   "light"
  ]
 },
 "sambar-rice-satvik": {
  "allergens": [
   "gluten"
  ]
 },
 "thepla": {
  "allergens": [
   "gluten",
   "dairy",
   "sesame"
  ]
 },
 "thukpa": {
  "tags": [
   "warm",
   "comfort",
   "gentle",
   "light",
   "high-sodium"
  ],
  "allergens": [
   "gluten",
   "soy"
  ]
 },
 "egg-fried-rice": {
  "tags": [
   "warm",
   "quick",
   "high-protein",
   "high-sodium"
  ],
  "allergens": [
   "egg",
   "soy",
   "gluten"
  ]
 },
 "veg-stir-fry": {
  "tags": [
   "warm",
   "quick",
   "high-protein",
   "high-sodium"
  ],
  "allergens": [
   "soy",
   "gluten"
  ]
 },
 "makhana-roasted": {
  "tags": [
   "quick",
   "light",
   "low-sodium",
   "no-cook"
  ],
  "allergens": [
   "dairy"
  ],
  "diet": "vegetarian"
 },
 "haleem": {
  "tags": [
   "warm",
   "festive",
   "comfort",
   "high-protein",
   "iftar",
   "high-purine",
   "iron"
  ],
  "allergens": [
   "gluten",
   "dairy"
  ]
 },
 "nihari-roti": {
  "tags": [
   "warm",
   "festive",
   "comfort",
   "high-protein",
   "high-purine",
   "high-sodium",
   "iron"
  ],
  "allergens": [
   "gluten",
   "dairy"
  ]
 },
 "jalebi": {
  "allergens": [
   "gluten",
   "dairy"
  ]
 },
 "gulab-jamun": {
  "tags": [
   "sweet",
   "festive",
   "comfort",
   "high-gi",
   "lactose",
   "fried"
  ]
 },
 "coconut-water": {
  "tags": [
   "cold",
   "cooling",
   "light",
   "iftar",
   "no-cook",
   "high-potassium"
  ],
  "nutrients": {
   "kcal": 60,
   "proteinG": 1,
   "fibreG": 1,
   "waterMl": 300
  }
 },
 "banana": {
  "tags": [
   "quick",
   "light",
   "gentle",
   "no-cook",
   "high-potassium"
  ]
 },
 "fruit-chaat": {
  "tags": [
   "quick",
   "cold",
   "cooling",
   "light",
   "iftar",
   "no-cook",
   "high-potassium"
  ]
 },
 "fruit-curd-bowl": {
  "tags": [
   "quick",
   "cold",
   "cooling",
   "high-protein",
   "lactose",
   "no-cook",
   "high-potassium",
   "choking-hazard"
  ]
 },
 "banana-milkshake": {
  "tags": [
   "cold",
   "quick",
   "high-protein",
   "lactose",
   "no-cook",
   "recovery",
   "high-potassium"
  ]
 },
 "sweet-potato-chaat": {
  "tags": [
   "warm",
   "quick",
   "light",
   "high-potassium"
  ]
 },
 "palak-paneer-roti": {
  "tags": [
   "warm",
   "comfort",
   "high-protein",
   "iron",
   "high-potassium"
  ]
 },
 "rajma-chawal": {
  "tags": [
   "warm",
   "comfort",
   "high-protein",
   "fibre",
   "iron",
   "high-potassium"
  ]
 },
 "dal-makhani-roti": {
  "tags": [
   "warm",
   "comfort",
   "high-protein",
   "fibre",
   "iron",
   "lactose",
   "high-potassium",
   "high-sodium",
   "high-satfat"
  ]
 },
 "khajoor-water": {
  "tags": [
   "quick",
   "light",
   "iftar",
   "no-cook",
   "high-potassium"
  ]
 },
 "seekh-kebab-salad": {
  "tags": [
   "quick",
   "high-protein",
   "low-gi",
   "high-purine",
   "iron"
  ]
 },
 "butter-chicken-naan": {
  "tags": [
   "warm",
   "comfort",
   "festive",
   "high-protein",
   "high-gi",
   "high-sodium",
   "lactose",
   "high-purine",
   "high-satfat"
  ]
 },
 "tandoori-chicken-salad": {
  "tags": [
   "quick",
   "high-protein",
   "low-gi",
   "light",
   "high-purine"
  ]
 },
 "chicken-curry": {
  "tags": [
   "warm",
   "comfort",
   "high-protein",
   "spicy",
   "high-purine"
  ]
 },
 "chicken-mild-curry": {
  "tags": [
   "warm",
   "comfort",
   "high-protein",
   "high-purine"
  ]
 },
 "chingri-malai-curry": {
  "tags": [
   "warm",
   "comfort",
   "festive",
   "high-protein",
   "high-purine"
  ]
 },
 "keema-pav": {
  "tags": [
   "warm",
   "comfort",
   "high-protein",
   "high-purine",
   "iron"
  ]
 },
 "kosha-mangsho-luchi": {
  "tags": [
   "warm",
   "comfort",
   "festive",
   "fried",
   "high-protein",
   "high-purine",
   "high-gi",
   "iron"
  ]
 },
 "pav-bhaji": {
  "tags": [
   "warm",
   "comfort",
   "street",
   "high-gi",
   "fried",
   "high-sodium",
   "high-potassium",
   "high-satfat"
  ]
 },
 "pav-bhaji-jain": {
  "tags": [
   "warm",
   "comfort",
   "high-gi",
   "high-sodium",
   "high-satfat"
  ]
 },
 "kachumber-curd": {
  "tags": [
   "cold",
   "cooling",
   "light",
   "lactose",
   "no-cook",
   "high-sodium"
  ]
 },
 "dahi-chivda": {
  "tags": [
   "cold",
   "quick",
   "lactose",
   "no-cook",
   "high-sodium",
   "choking-hazard"
  ]
 },
 "rasam-rice": {
  "tags": [
   "warm",
   "gentle",
   "light"
  ]
 },
 "masala-chaas": {
  "tags": [
   "cold",
   "cooling",
   "light",
   "lactose",
   "iftar",
   "no-cook"
  ]
 },
 "sattu-drink": {
  "tags": [
   "cold",
   "cooling",
   "light",
   "high-protein",
   "fibre",
   "low-gi",
   "no-cook",
   "recovery"
  ]
 },
 "ragi-malt": {
  "tags": [
   "warm",
   "gentle",
   "iron",
   "lactose",
   "sweet"
  ]
 },
 "rice-congee": {
  "tags": [
   "warm",
   "gentle",
   "high-gi"
  ]
 },
 "oats-banana": {
  "tags": [
   "warm",
   "quick",
   "fibre",
   "lactose"
  ]
 },
 "overnight-oats": {
  "tags": [
   "quick",
   "fibre",
   "cold",
   "no-cook",
   "lactose"
  ]
 },
 "recovery-shake": {
  "tags": [
   "quick",
   "cold",
   "high-protein",
   "recovery",
   "no-cook",
   "lactose"
  ]
 },
 "yogurt-bowl": {
  "tags": [
   "quick",
   "cold",
   "high-protein",
   "no-cook",
   "lactose"
  ]
 },
 "yogurt-seeds": {
  "tags": [
   "quick",
   "cold",
   "light",
   "high-protein",
   "no-cook",
   "lactose"
  ]
 },
 "popcorn": {
  "tags": [
   "quick",
   "light",
   "comfort",
   "choking-hazard"
  ]
 },
 "chikki": {
  "tags": [
   "quick",
   "sweet",
   "high-gi",
   "choking-hazard"
  ]
 },
 "roasted-chana": {
  "tags": [
   "quick",
   "light",
   "high-protein",
   "fibre",
   "low-gi",
   "low-sodium",
   "no-cook",
   "choking-hazard"
  ]
 },
 "peanut-chaat": {
  "tags": [
   "quick",
   "light",
   "high-protein",
   "fibre",
   "low-gi",
   "no-cook",
   "choking-hazard"
  ]
 },
 "apple-almonds": {
  "tags": [
   "quick",
   "cold",
   "light",
   "no-cook",
   "choking-hazard"
  ]
 },
 "murmura-bhel": {
  "tags": [
   "quick",
   "light",
   "cooling",
   "street",
   "no-cook",
   "choking-hazard"
  ]
 },
 "shorshe-ilish": {
  "tags": [
   "warm",
   "comfort",
   "festive",
   "high-protein",
   "choking-hazard"
  ]
 },
 "sprouts-salad": {
  "tags": [
   "cold",
   "cooling",
   "light",
   "high-protein",
   "fibre",
   "low-gi",
   "no-cook",
   "raw-sprouts"
  ]
 }
};
