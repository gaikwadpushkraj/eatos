# Indian food composition and substitution data for a built-in recommender dataset

> IMPORTANT PROVENANCE NOTE. In this session only a handful of numbers were verified from fetched web sources (GI values from the 2021 non-western GI compendium; cooled-rice resistant starch figures; food-order study). The bulk of the per-serving macro/sodium numbers below are ROUNDED APPROXIMATIONS from the researcher's background knowledge of IFCT 2017 (NIN), USDA FoodData Central and typical home/restaurant recipes. They were NOT looked up row by row. Treat as +/-15-30% (restaurant dishes, sweets, fried foods: up to +/-40%). Before shipping, spot-check against IFCT 2017 / USDA. Marked "?" = especially uncertain.

## 1. What are reliable approximate values from IFCT 2017 / ICMR-NIN / USDA and Indian GI tables?

### Takeaway
IFCT 2017 (NIN) is the authoritative raw-ingredient source for Indian foods; USDA fills cooked/restaurant gaps; GI values for Indian foods are scarce, method-variable and widely ranged, so GI should be stored as a coarse band (low <=55, medium 56-69, high >=70) with a "confidence" flag, and GL computed as GI x carbs(g)/100.

### Cited Findings
- International Tables of GI and GL 2021 (Atkinson et al., AJCN 114(5):1625) list >4000 items (+61% vs 2008); two lists: ~2100 ISO-method values and ~1900 less robust values. — [AJCN summary](https://nutrition.org/ajcn-publishes-international-tables-of-glycemic-index-and-glycemic-load-values-2021-a-systematic-review/)
- A separate 2021 compendium compiles GI values for non-Western foods because most published GI data is European/Australian/North American. — [Nutrition & Diabetes 2021 compendium](https://pmc.ncbi.nlm.nih.gov/articles/PMC7791047/)
- Values extracted from that compendium (glucose = 100, single small studies, n=10-70, so wide uncertainty): basmati rice 55 (50 g carb, n=70); white rice 79 (n=40); idli 67 (n=10); dosa 78 (n=10); upma 71 (n=19); whole-wheat chapatti 84 (n=20, NIDDM participants); ragi roti 61; mango (Raspuri) 35; banana (Yallakki) 43; papaya 19; watermelon 37; foxtail-millet burfi 37.5; namkeen sev (bengal gram+kidney bean) 33. — [compendium](https://pmc.ncbi.nlm.nih.gov/articles/PMC7791047/)
- ICMR-NIN Dietary Guidelines for Indians 2024 (17 guidelines): cereals/millets should supply no more than ~45% of energy, pulses/beans/meat up to ~15%, rest from nuts, vegetables, fruit, milk; guidelines advise against protein supplements. — [The South First](https://thesouthfirst.com/news/icmr-releases-dietary-guidelines-for-indians-after-13-years-says-no-to-protein-supplements), [AIR News](https://newsonair.gov.in/icmr-releases-upgraded-dietary-guidelines-for-indians)
- Secondary (blog-level, lower reliability) summary: the 2024 guidelines suggest including millets in at least one daily meal, not eliminating wheat. — [Organic Mandya](https://organicmandya.com/blogs/news/millet-vs-wheat-which-is-better-for-your-health) (treat as unverified paraphrase; confirm in the ICMR PDF)

### Inferences
- Conflicts to expect: watermelon GI 37 here vs ~70-80 in Western tables (background knowledge); papaya 19 here vs ~55-60 in Atkinson tables (background knowledge); chapatti 84 (one NIDDM study) vs ~60s elsewhere. Store GI as bands plus `giConfidence: "low"` for these; their GL is low anyway because carbs per serving are small.
- GL = GI x available carb per serving / 100 (low <=10, med 11-19, high >=20).

### Gaps
- No row-by-row verification against IFCT 2017 tables or USDA was performed (no accessible table fetched). Sodium values are especially approximate (depend on cook's salt; assume ~1% salt in gravies, ~0.5-0.7% in dal/rice).
- Published GI for many dishes (biryani, paratha, thepla, dhokla, poha, sabzis) were not found; GI left blank or marked "?" (estimate).

### DATASET A. Foods table (per typical serving; approximate)

Column key: `g` serving grams (cooked/as eaten); `P/C/F/Fib` grams; `Na` mg; `GI` (blank = no reliable value; "?" = estimate; "(c)" = from 2021 compendium above); `GL` ~ GI x C/100.
Tags: `V` vegetarian (lacto) | `VG` vegan | `E` contains egg | `NV` meat/fish | `J` Jain-compatible as normally made (no onion/garlic/root veg) | `J*` Jain only with modified recipe | `GL` contains gluten | `LAC` contains lactose | `HP` high purine | `HK` high potassium | `NF` Navratri-fasting-allowed (sendha namak versions; no grains/dal/onion/garlic) | `NF*` allowed if made with fasting flours/rock salt.
Allergens: gluten, milk, egg, fish, shellfish, peanut, treenut, sesame, soy, mustard. Prep = typical minutes of cooking effort. Slot: B breakfast, L lunch, D dinner, S snack, X sweet/dessert, any.

| id | name | region | g | kcal | P | C | F | Fib | Na | GI | tags | allergens | prep | slot |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| roti_wheat | Roti/chapati (1 medium) | Pan-India | 40 | 120 | 3.5 | 22 | 2 | 3 | 100 | 62? (84 in one study) | V VG J GL | gluten | 10 | L D |
| phulka | Phulka (1) | North | 30 | 85 | 2.7 | 16 | 0.7 | 2.2 | 70 | 62? | V VG J GL | gluten | 8 | L D |
| paratha_plain | Plain paratha | North | 60 | 200 | 4 | 28 | 8 | 3 | 250 | ? | V LAC(ghee trace) J GL | gluten | 15 | B L |
| aloo_paratha | Aloo paratha | Punjab | 100 | 260 | 5 | 38 | 10 | 3.5 | 350 | ? | V HK GL | gluten | 25 | B |
| naan | Naan (1) | Punjab/restaurant | 90 | 260 | 8 | 45 | 5 | 2 | 400 | 70? | V LAC GL | gluten, milk | 15 | D |
| puri | Puri (2) | Pan-India | 40 | 190 | 3 | 22 | 10 | 1.5 | 100 | ? | V VG J GL | gluten | 15 | B S |
| missi_roti | Missi roti | Punjab | 50 | 150 | 6 | 24 | 4 | 4 | 150 | ? | V GL | gluten | 15 | L D |
| jowar_roti | Jowar roti | Maharashtra/Karnataka | 40 | 110 | 3 | 23 | 0.8 | 2.5 | 5 | 55-70? | V VG J gluten-free | none | 15 | L D |
| bajra_roti | Bajra roti | Rajasthan/Gujarat | 45 | 140 | 4 | 26 | 2.5 | 3 | 5 | 55-65? | V VG J gluten-free | none | 15 | L D |
| ragi_roti | Ragi roti | Karnataka | 50 | 150 | 3.5 | 31 | 0.7 | 3 | 10 | 61 (c) | V VG J gluten-free | none | 15 | B L |
| besan_chilla | Besan chilla (2) | North/Gujarat | 100 | 190 | 10 | 18 | 8 | 4 | 250 | low? | V VG gluten-free | none | 15 | B |
| rice_white | White rice, cooked | Pan-India | 150 | 195 | 4 | 43 | 0.4 | 0.6 | 2 | 73 (79 c) | V VG J | none | 20 | L D |
| rice_basmati | Basmati rice, cooked | North | 150 | 190 | 4 | 41 | 0.4 | 0.6 | 2 | 55 (c) | V VG J | none | 20 | L D |
| rice_brown | Brown rice, cooked | Pan-India | 150 | 165 | 3.5 | 35 | 1.3 | 2.5 | 5 | 65-68? | V VG J | none | 35 | L D |
| jeera_rice | Jeera rice | North | 180 | 270 | 5 | 47 | 7 | 1 | 300 | ~70? | V J* | milk(ghee) | 25 | L D |
| veg_pulao | Vegetable pulao | North | 200 | 300 | 6 | 50 | 8 | 3 | 450 | ~65? | V J* | none | 30 | L D |
| veg_biryani | Veg biryani | Hyderabad/North | 250 | 400 | 9 | 60 | 13 | 4 | 700 | ~60-70? | V LAC J* | milk | 60 | L D |
| chicken_biryani | Chicken biryani | Hyderabad/Awadhi | 300 | 500 | 25 | 62 | 16 | 3 | 850 | ~60-70? | NV LAC HP | milk | 75 | L D |
| moong_khichdi | Moong dal khichdi | Pan-India | 250 | 280 | 11 | 45 | 6 | 5 | 400 | ~55? | V J LAC(ghee) | milk(ghee) | 30 | L D |
| curd_rice | Curd rice | South | 200 | 260 | 7 | 38 | 8 | 1 | 350 | ? | V LAC | milk | 20 | L |
| lemon_rice | Lemon rice | South | 180 | 280 | 5 | 45 | 8 | 2 | 350 | ? | V VG | peanut | 20 | L |
| poha | Poha (cooked) | Maharashtra/MP | 150 | 250 | 5 | 40 | 8 | 2.5 | 300 | ~60-65? | V VG J* | peanut | 15 | B |
| upma | Rava upma | South/Maharashtra | 200 | 250 | 6 | 38 | 8 | 3 | 400 | 71 (c) | V VG GL | gluten | 15 | B |
| idli | Idli (2) | South | 100 | 130 | 4 | 26 | 0.5 | 1.5 | 200 | 67 (c) | V VG J | none | 10 (batter ready) | B |
| dosa_plain | Plain dosa (1) | South | 100 | 170 | 4 | 28 | 4.5 | 1.5 | 250 | 78 (c) | V VG J | none | 15 | B |
| masala_dosa | Masala dosa | South | 180 | 330 | 7 | 48 | 12 | 3.5 | 500 | ~70? | V HK | none | 20 | B |
| rava_dosa | Rava dosa | South | 90 | 210 | 4 | 30 | 8 | 1.5 | 300 | ? | V GL | gluten | 15 | B |
| ragi_dosa | Ragi dosa | Karnataka | 100 | 150 | 4 | 28 | 2 | 3 | 200 | ~55-60? | V VG | none | 15 | B |
| pesarattu | Pesarattu (moong dosa) | Andhra | 100 | 150 | 8 | 22 | 3 | 3.5 | 200 | low? | V VG | none | 15 | B |
| uttapam | Uttapam | South | 120 | 200 | 6 | 32 | 5 | 2 | 300 | ? | V VG J* | none | 15 | B |
| sambar | Sambar (1 katori) | South | 150 | 80 | 4 | 11 | 2.5 | 3 | 400 | low | V VG | none | 30 | B L D |
| dalia | Dalia (broken wheat) porridge | North | 200 | 170 | 5 | 34 | 1.5 | 4 | 10 | ~45-55? | V VG GL | gluten | 20 | B |
| oats_milk | Oats porridge with milk | Urban | 200 | 180 | 7 | 28 | 4 | 3 | 60 | ~55 | V LAC | milk, (gluten cross-contact) | 8 | B |
| sabudana_khichdi | Sabudana khichdi | Maharashtra | 150 | 300 | 3 | 50 | 10 | 1 | 250 | ~65-70? | V VG J NF | peanut | 20 | B S |
| kuttu_roti | Kuttu (buckwheat) roti | North | 50 | 140 | 4 | 28 | 1.5 | 3 | 100 | ~50-55? | V VG gluten-free NF | none | 15 | L D |
| samak_rice | Samak/barnyard millet rice | North | 150 | 170 | 3 | 35 | 1 | 2 | 5 | low-mod? | V VG gluten-free NF | none | 20 | L |
| makhana_roast | Roasted makhana | Bihar/North | 30 | 105 | 3 | 22 | 0.3 | 2 | 5 | low? | V VG J NF | none | 8 | S |
| dal_tadka | Dal tadka (toor/mixed) | North | 150 | 170 | 8 | 22 | 5 | 5 | 350 | 30-40 | V J* | none | 30 | L D |
| moong_dal | Moong dal (yellow) | Pan-India | 150 | 140 | 8 | 20 | 3 | 4 | 300 | ~38 | V VG J | none | 25 | L D |
| masoor_dal | Masoor dal | North/East | 150 | 150 | 9 | 21 | 3 | 4 | 300 | ~29 | V VG J* | none | 25 | L D |
| toor_dal | Toor/arhar dal | Pan-India | 150 | 160 | 8 | 22 | 4 | 4 | 300 | ~30-40? | V J | none | 30 | L D |
| chana_masala | Chana masala | Punjab | 150 | 220 | 9 | 28 | 8 | 8 | 450 | ~35-40 | V VG J* | none | 40 | L D |
| rajma | Rajma masala | Punjab | 150 | 200 | 9 | 28 | 6 | 8 | 400 | ~30-40 | V VG J* | none | 45 | L D |
| dal_makhani | Dal makhani | Punjab | 150 | 250 | 9 | 22 | 14 | 6 | 450 | ~30? | V LAC J* | milk | 60 | D |
| chole_bhature | Chole bhature (2 bhature) | Punjab/Delhi | 300 | 650 | 16 | 80 | 30 | 9 | 800 | ~65-75? | V VG? (bhatura may include curd) GL | gluten, milk | 45 | L |
| sprouts_salad | Moong sprouts salad | Pan-India | 100 | 80 | 7 | 12 | 0.7 | 4 | 10 | low | V VG J* | none | 10 | S B |
| kala_chana | Boiled kala chana | North | 100 | 150 | 8 | 22 | 2.5 | 7 | 10 | ~28-35 | V VG J | none | 10 (soaked) | S |
| soya_chunks | Soya chunks (30 g dry, as ~90 g cooked) | Urban | 30 dry | 100 | 15.5 | 9 | 0.4 | 4 | 5 | low | V VG | soy | 15 | L D |
| paneer_raw | Paneer (100 g) | North | 100 | 290 | 18 | 4 | 22 | 0 | 40 | ~0 | V LAC(low) J | milk | 0 | any |
| paneer_bhurji | Paneer bhurji | North | 150 | 290 | 16 | 7 | 22 | 1 | 400 | low | V LAC(low) J* | milk | 15 | B L |
| palak_paneer | Palak paneer | Punjab | 200 | 300 | 14 | 10 | 24 | 3 | 500 | low | V LAC(low) HK J* | milk | 35 | L D |
| matar_paneer | Matar paneer | North | 200 | 340 | 15 | 14 | 25 | 4 | 550 | low | V LAC(low) J* | milk | 35 | L D |
| paneer_tikka | Paneer tikka | Punjab | 120 | 250 | 16 | 6 | 18 | 1 | 400 | low | V LAC(low) | milk | 30 | S D |
| curd | Curd/dahi (100 g, whole milk) | Pan-India | 100 | 60 | 3.5 | 4.5 | 3.3 | 0 | 45 | ~36 | V LAC J NF | milk | 0 | any |
| raita | Veg raita | North | 100 | 60 | 3 | 5 | 3 | 0.5 | 200 | low | V LAC J* NF* | milk | 5 | L D |
| chaas | Buttermilk/chaas (200 ml) | Pan-India | 200 | 40 | 2 | 3 | 1.5 | 0 | 250 | low | V LAC J NF | milk | 2 | any |
| lassi_sweet | Sweet lassi | Punjab | 250 | 250 | 7 | 40 | 6 | 0 | 90 | ~? | V LAC NF | milk | 5 | S X |
| milk_cow | Cow milk (200 ml, toned/whole) | Pan-India | 200 | 120 | 6.5 | 9.5 | 6 | 0 | 100 | ~30-40 | V LAC J NF | milk | 2 | any |
| tofu | Tofu (100 g) | Urban | 100 | 80 | 8 | 2 | 4.8 | 0.3 | 10 | low | V VG | soy | 10 | L D |
| egg_boiled | Boiled egg (1) | Pan-India | 50 | 75 | 6.5 | 0.5 | 5 | 0 | 65 | ~0 | E | egg | 12 | B S |
| egg_bhurji | Egg bhurji (2 eggs) | Pan-India | 120 | 220 | 13 | 3 | 17 | 0.5 | 300 | low | E | egg | 10 | B |
| omelette | Masala omelette (2 eggs) | Pan-India | 110 | 200 | 13 | 1 | 15 | 0.3 | 300 | low | E | egg | 8 | B |
| egg_curry | Egg curry (2 eggs) | Pan-India | 200 | 300 | 14 | 10 | 22 | 2 | 550 | low | E | egg | 30 | L D |
| chicken_curry | Chicken curry (bone-in, ~150 g meat) | Pan-India | 200 | 280 | 24 | 7 | 17 | 1 | 550 | low | NV HP(moderate) | none | 40 | L D |
| chicken_tandoori | Tandoori chicken | Punjab | 150 | 240 | 30 | 4 | 11 | 0.5 | 500 | low | NV HP LAC(marinade) | milk | 40 | D |
| butter_chicken | Butter chicken | Delhi | 200 | 390 | 22 | 10 | 29 | 1.5 | 650 | low | NV LAC | milk, treenut(cashew) | 45 | D |
| chicken_breast | Grilled chicken breast (100 g) | Urban | 100 | 165 | 31 | 0 | 3.6 | 0 | 75 | 0 | NV HP | none | 20 | L D |
| fish_curry_rohu | Fish curry (rohu/other, 200 g) | Bengal/Kerala/Goa | 200 | 220 | 22 | 6 | 12 | 1 | 500 | low | NV HP(oily small fish e.g. sardine/anchovy: high) | fish, mustard | 35 | L D |
| fish_fry | Fish fry (100 g) | Coastal | 100 | 200 | 19 | 8 | 10 | 0.5 | 400 | low | NV HP | fish | 25 | L D S |
| prawn_curry | Prawn curry | Coastal | 200 | 220 | 24 | 8 | 10 | 1 | 600 | low | NV HP | shellfish | 30 | L D |
| mutton_curry | Mutton curry | Pan-India | 200 | 340 | 24 | 6 | 25 | 1 | 600 | low | NV HP | none | 75 | L D |
| aloo_gobi | Aloo gobi | North | 150 | 150 | 4 | 18 | 7 | 4 | 350 | ~55-65? | V VG HK | none | 25 | L D |
| bhindi | Bhindi sabzi | Pan-India | 100 | 110 | 2 | 9 | 8 | 3.5 | 250 | low | V VG J | none | 20 | L D |
| baingan_bharta | Baingan bharta | North | 150 | 130 | 3 | 11 | 8 | 4 | 300 | low | V VG | none | 30 | L D |
| lauki_sabzi | Lauki sabzi | Pan-India | 150 | 70 | 1.5 | 8 | 3.5 | 2 | 250 | low | V VG J | none | 20 | L D |
| mixed_veg | Mixed vegetable sabzi | Pan-India | 150 | 130 | 3 | 13 | 7 | 4 | 300 | low | V VG J* | none | 25 | L D |
| aloo_jeera | Jeera aloo | North | 150 | 190 | 3 | 26 | 8 | 3 | 300 | ~70-80? | V VG HK J* NF | none | 20 | L D |
| cabbage_poriyal | Cabbage poriyal | South | 100 | 90 | 2 | 8 | 5 | 2.5 | 200 | low | V VG | none | 15 | L D |
| thepla | Methi thepla (1) | Gujarat | 40 | 120 | 3.5 | 16 | 4.5 | 2.5 | 150 | ? | V VG J* GL | gluten | 20 | B S |
| gobi_manchurian | Gobi manchurian (dry) | Indo-Chinese | 150 | 300 | 6 | 32 | 16 | 3 | 900 | ? | V GL | gluten, soy | 30 | S |
| kachumber | Kachumber/green salad | Pan-India | 100 | 25 | 1 | 5 | 0.2 | 1.5 | 100 | low | V VG HK(tomato) | none | 5 | any |
| papad | Roasted papad (1) | Pan-India | 10 | 35 | 2.5 | 5 | 0.3 | 1 | 300 (range 250-450) | ? | V VG | none | 2 | L D |
| pickle | Pickle (1 tsp, 10 g) | Pan-India | 10 | 25 | 0.2 | 1 | 2.5 | 0.3 | 400 (range 250-600) | - | V VG | mustard | 0 | L D |
| samosa | Samosa (1, fried) | North | 90 | 260 | 4 | 28 | 15 | 2.5 | 300 | ? | V VG GL | gluten | 40 | S |
| kachori | Kachori (1) | Rajasthan/UP | 70 | 220 | 4 | 24 | 12 | 2 | 250 | ? | V GL | gluten | 40 | S |
| vada_pav | Vada pav | Mumbai | 110 | 290 | 7 | 40 | 12 | 3 | 500 | ~70? | V VG GL J* | gluten | 20 | S B |
| pav_bhaji | Pav bhaji (bhaji + 2 pav) | Mumbai | 300 | 520 | 12 | 70 | 22 | 8 | 1000 | ~70? | V LAC(butter) GL | gluten, milk | 40 | D S |
| pani_puri | Pani puri (6) | North/West | 120 | 200 | 3 | 30 | 8 | 2 | 450 | ? | V VG | gluten | 5 | S |
| bhel_puri | Bhel puri | Mumbai | 100 | 160 | 4 | 28 | 4 | 3 | 400 | ? | V VG GL | gluten, peanut | 5 | S |
| aloo_tikki | Aloo tikki (2) | North | 100 | 250 | 3 | 30 | 12 | 3 | 350 | high? | V VG HK | none | 20 | S |
| dhokla | Dhokla (3 pcs) | Gujarat | 100 | 160 | 6 | 24 | 5 | 2 | 400 | ~35-50? | V VG J gluten-free | none | 20 (batter ready) | B S |
| medu_vada | Medu vada (2) | South | 80 | 220 | 7 | 22 | 12 | 3 | 300 | ? | V VG | none | 30 | B S |
| masala_chai | Masala chai with milk+sugar (150 ml) | Pan-India | 150 | 70 | 2 | 10 | 2.5 | 0 | 30 | - | V LAC | milk | 5 | S |
| filter_coffee | Filter coffee (150 ml) | South | 150 | 60 | 2 | 8 | 2.5 | 0 | 30 | - | V LAC | milk | 5 | B S |
| roasted_chana | Roasted chana (30 g) | Pan-India | 30 | 110 | 6 | 18 | 2 | 5 | 10 | ~28 | V VG J | none | 0 | S |
| peanuts | Roasted peanuts (30 g) | Pan-India | 30 | 170 | 8 | 5 | 14 | 2.5 | 5 | low | V VG J | peanut | 0 | S |
| almonds | Almonds (15, 20 g) | Pan-India | 20 | 115 | 4 | 2.5 | 10 | 2.5 | 0 | low | V VG J NF | treenut | 0 | S |
| walnuts | Walnuts (20 g) | Kashmir/imported | 20 | 130 | 3 | 3 | 13 | 1.5 | 0 | low | V VG J NF | treenut | 0 | S |
| cashews | Cashews (20 g) | Coastal | 20 | 110 | 3.5 | 6 | 9 | 0.7 | 3 | low | V VG J NF | treenut | 0 | S |
| chikki | Peanut chikki (30 g) | Maharashtra | 30 | 140 | 3 | 19 | 6 | 1.5 | 10 | ? | V VG | peanut | 0 | S X |
| bhujia | Bhujia/namkeen (30 g) | Rajasthan | 30 | 160 | 5 | 15 | 10 | 2 | 350 | ~35 (sev) | V VG | none | 0 | S |
| gulab_jamun | Gulab jamun (1) | North | 50 | 175 | 2.5 | 26 | 7 | 0.2 | 30 | ~70? | V LAC GL | milk, gluten | 45 | X |
| jalebi | Jalebi (50 g) | North | 50 | 190 | 1 | 34 | 6 | 0.3 | 10 | high ? | V GL | gluten | 30 | X |
| rasgulla | Rasgulla (1) | Bengal/Odisha | 50 | 100 | 2.5 | 20 | 1.5 | 0 | 15 | ? | V LAC | milk | 40 | X |
| kheer | Rice kheer (150 g) | Pan-India | 150 | 230 | 6 | 35 | 7 | 0.3 | 70 | ? | V LAC NF* | milk | 40 | X |
| suji_halwa | Suji halwa (80 g) | North | 80 | 250 | 3 | 34 | 12 | 1 | 20 | ? | V LAC GL | gluten, milk | 20 | X |
| gajar_halwa | Gajar halwa (100 g) | North | 100 | 200 | 4 | 24 | 10 | 2 | 40 | ? | V LAC | milk, treenut | 60 | X |
| besan_ladoo | Besan ladoo (1) | North | 40 | 190 | 3.5 | 22 | 10 | 1.5 | 5 | ? | V LAC | milk(ghee) | 30 | X |
| barfi | Milk barfi (1) | North | 40 | 170 | 4 | 22 | 7.5 | 0 | 20 | ? | V LAC | milk | 40 | X |
| millet_barfi | Foxtail-millet burfi (ref only) | - | 40 | 160 | 3 | 24 | 6 | 1 | 10 | 37.5 (c) | V | - | 30 | X |
| dates | Dates (2) | Pan-India | 20 | 55 | 0.4 | 14 | 0.1 | 1.4 | 1 | ~42-55 | V VG J NF HK | none | 0 | S X |
| banana | Banana (1 medium) | Pan-India | 100 | 90 | 1 | 23 | 0.3 | 2 | 1 | 43 (c) | V VG J NF HK | none | 0 | any |
| mango | Mango (150 g flesh) | Pan-India | 150 | 100 | 1 | 25 | 0.5 | 2.5 | 2 | 35 (c) | V VG NF | none | 0 | any |
| apple | Apple (150 g) | North | 150 | 80 | 0.4 | 20 | 0.3 | 3 | 2 | ~36 | V VG J NF | none | 0 | any |
| papaya | Papaya (150 g) | Pan-India | 150 | 60 | 0.6 | 14 | 0.2 | 2.5 | 10 | 19 (c) vs ~56-60 elsewhere | V VG NF | none | 0 | any |
| watermelon | Watermelon (150 g) | Pan-India | 150 | 45 | 0.9 | 11 | 0.2 | 0.6 | 2 | 37 (c) vs ~72-80 elsewhere; GL low | V VG NF | none | 0 | any |
| guava | Guava (100 g) | North | 100 | 68 | 2.6 | 14 | 1 | 5 | 2 | low (~12-24?) | V VG NF HK? | none | 0 | any |
| orange | Orange/mosambi (130 g) | Pan-India | 130 | 60 | 1 | 14 | 0.2 | 2.5 | 0 | ~40-45 | V VG NF | none | 0 | any |
| pomegranate | Pomegranate (100 g) | Pan-India | 100 | 85 | 1.7 | 19 | 1.2 | 4 | 3 | ~35 | V VG NF | none | 0 | any |

Notes for the encoder: GL examples: basmati 150 g (41 g C x 55) = ~23 (high); brown rice (35 x 66) = ~23; idli x2 (26 x 67) = ~17; ragi roti (31 x 61) = ~19; mango 150 g (25 x 35) = ~9; watermelon (11 x 37..75) = 4-8; dal (22 x 35) = ~8.
Purine guidance (background knowledge): HP flagged for organ meats, shellfish, sardines/anchovy/mackerel, red meat, game; moderate for chicken/most fish; legumes/dals are moderate-purine but plant purines are not associated with gout flares in cohort data (background knowledge, not verified here), so do not flag dals HP for gout by default. High-potassium (>~400 mg per serving): potato, banana, tomato gravies, spinach, coconut water, dates/dried fruit, lentils/beans (relevant for CKD only).

## 2. Which substitutions are evidence-backed?

### Takeaway
Best-supported: (a) meal composition/order (veg/protein before starch) lowers post-meal glucose in short crossover trials, though a longer prediabetes RCT showed no meaningful change in overall glycaemic control; (b) cooling cooked rice raises resistant starch and modestly lowers glycaemic response in small trials; (c) swapping to lower-GI starches (basmati, millet/ragi, pulses) and pairing carbs with dal/curd/veg is plausible but evidence for specific Indian-dish swaps is small-sample.

### Cited Findings
- Crossover trial, 16 people with T2D: eating protein+vegetables first (carbs 10 min later) cut incremental glucose peak >40% vs carbs first and iAUC ~38.8% lower; vegetables-first also lowered peak. — [search-result summary; underlying papers PMC5604719 / DRC BMJ](https://pmc.ncbi.nlm.nih.gov/articles/PMC5604719)
- Counter-evidence: an RCT in prediabetes found that eating protein/non-starchy vegetables before starchy carbs at each meal did not meaningfully change glycaemic control or cardiometabolic risk factors. — [same search results (RCT not individually opened)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10005673/)
- Cooked white rice resistant starch: 0.64 g/100 g fresh; 1.30 g/100 g after 10 h room-temp cooling; 1.65 g/100 g after 24 h at 4 C then reheating. — [PubMed 26693746](https://pubmed.ncbi.nlm.nih.gov/26693746/)
- Healthy adults: cooled rice glycaemic response 125 vs 152 mmol.min/L for fresh (p=0.047). — [IJRMS crossover study](https://www.msjonline.org/index.php/ijrms/article/view/9324)
- In type 1 diabetes, cooled rice lowered max glycaemia and AUC but raised risk of postprandial hypoglycaemia with a standard insulin dose. — [PMC9013350](https://pmc.ncbi.nlm.nih.gov/articles/PMC9013350/)
- Basmati GI 55 vs white rice 79; ragi roti 61 vs whole-wheat chapatti 84 (different studies); idli 67, dosa 78, upma 71 — supports basmati/ragi/idli over dosa/upma as relative ordering but not as strong head-to-head evidence. — [compendium](https://pmc.ncbi.nlm.nih.gov/articles/PMC7791047/)
- ICMR-NIN 2024: cap cereal/millet energy ~45%, increase pulses/vegetables, no protein supplements. — [The South First](https://thesouthfirst.com/news/icmr-releases-dietary-guidelines-for-indians-after-13-years-says-no-to-protein-supplements)

### Inferences
Rows below are the proposed substitution map. Evidence grade: A = cited above; B = plausible physiology/composition, background knowledge, not verified in session; C = culinary-similarity only.

### DATASET B. Substitution map (blocked wish -> alternatives)

| blocked wish | constraint | alternatives (ids from table A) | why (keeps taste/occasion) | evidence |
|---|---|---|---|---|
| white-rice biryani | diabetes | (1) veg biryani/pulao with basmati, smaller rice portion (100 g), double veg + raita; (2) moong khichdi; (3) foxtail/barnyard millet pulao; (4) cooled-then-reheated basmati biryani | Keep festive rice dish; basmati GI ~55 vs 79; legumes + veg + curd slow absorption; cooled rice has higher RS | A (basmati GI, cooling), B (portion/millet) |
| plain white rice with dal | diabetes | basmati, rice_brown (small gain), samak/millet rice, roti jowar/bajra/ragi + dal | Brown rice GI ~65-68 still medium; the portion and pairing matter more than the swap | B (brown rice caveat from Atkinson-type tables, background) |
| dosa/upma breakfast | diabetes | pesarattu, besan chilla, ragi dosa, moong-vegetable chilla, idli with sambar (more sambar) | Same south/north tiffin occasion; legume batters raise protein/fibre, dosa GI 78/upma 71 | A (GI), B (pulse batters) |
| paneer sabzi | lactose intolerance | tofu (soy; allergen), chickpea/chana masala, soya chunk curry, egg bhurji if eggetarian; note paneer itself is relatively low in lactose (whey drained) so mild intolerance may tolerate small portions | Similar protein, texture; paneer has low lactose; lactose-free milk paneer exists | B (paneer low lactose is background knowledge) |
| curd/raita/lassi | lactose intolerance | lactose-free curd; chaas fermented (often tolerated); coconut/soy curd (vegan); raita with coconut-yogurt | Fermented dairy has less lactose but not zero; individual tolerance varies | B |
| curd/raita/lassi/paneer/ghee | vegan | soy/coconut/almond curd, peanut-sesame chutney as cooling side, tofu/soya/besan for paneer, oil for ghee, jaggery-nut sweets | Cooling-side role of raita and protein role of paneer separately replaced | B |
| roti/naan/paratha | gluten-free (coeliac) | jowar roti, bajra roti, ragi roti, kuttu roti (verify GF flour, cross-contact), rice roti, besan chilla, rice/idli/dosa | Same bread-with-curry format; millets are naturally gluten-free | A (millets GF, secondary) / B (cross-contamination caveat) |
| onion-garlic dishes | Jain | use hing + ginger-free? (Jain often avoids root veg incl. ginger, potato): hing, cumin, tomato-free/curd-based gravy, raw-banana/lauki/bhindi/paneer sabzi, moong dal with hing, dhokla, thepla | Hing mimics allium savoury note | B (Jain rules vary by household; ask about roots, potatoes, ginger, fermented items, post-sunset eating) |
| pickle/papad | high BP | fresh lemon/green-chilli wedge, kachumber, mint-coriander chutney (low salt), unsalted roasted papad alternatives (roasted makhana, murmura), homemade low-salt pickle | Tangy/crunchy accompaniment without ~400 mg Na per teaspoon | B (sodium approx) |
| salty snacks (namkeen, bhujia) | high BP | unsalted roasted chana, murmura/ puffed rice bhel with lemon, makhana, unsalted nuts | Crunch and spice | B |
| high-protein vegetarian meal | gym-goer, veg | paneer bhurji/tikka (100 g = 18 g P), soya chunks (30 g dry = ~15 g P), moong/chana chilla, sprouts, rajma/chana, curd/chaas, tofu, dal + roti/rice combos; add eggs if eggetarian | ICMR 2024 favours food-based protein over supplements; pulses + cereal gives complementary amino acids | A (ICMR advice) / B (numbers) |
| fried snack (samosa/vada pav) | weight loss / diabetes | roasted chana, sprouts bhel, dhokla, idli, air-fried tikki, makhana | Same snack slot, less fat/refined flour | B |
| mithai (jalebi/gulab jamun) | diabetes | small portion of milk barfi/kheer, nut-based ladoo, fruit (mango portion GL ~9), foxtail-millet burfi (GI 37.5, single study) | Portion and pairing after a meal matter more than "sugar-free" claims | A (burfi/mango GI), B |
| mutton/organ meat/prawn | gout/high uric acid | chicken breast (moderate), egg, paneer/curd (low-fat dairy), tofu, dals in moderation | Lower purine proteins | B |
| potato/banana/tomato gravies | CKD high-potassium | cabbage, lauki, cauliflower (leach/boil veg), apple, papaya | Lower K per serving | B (needs clinician sign-off) |
| Navratri fasting with grain/dal | fasting | kuttu roti, samak rice, sabudana khichdi, aloo jeera, curd/raita, makhana, fruits, milk, paneer, singhara flour | Strictly: no wheat/rice/dal/onion/garlic; sendha namak only | B (regional variation; some skip potatoes/curd) |
| any meal | diabetes (technique, not swap) | eat vegetables/protein before starch; add dal/curd; cool-and-reheat rice; walk 10-15 min after meals | Lowers peak glucose in short trials | A (food order; cooling) with caveats |

### Gaps
- No head-to-head Indian trial found for biryani vs millet pulao, or for many specific swaps.
- Brown-rice, curd-lowers-GI, pulse-pairing, post-meal-walk and purine claims were not retrieved/verified from sources in this session (background knowledge).
- Jain restrictions are household-variable; no authoritative reference fetched.
- Cooled-rice evidence is from small trials; T1D hypoglycaemia caveat means do not auto-recommend to insulin users without a disclaimer.

## 3. Which commonly believed food rules are myths and should not be encoded?

### Takeaway
Do not encode absolute rules; encode soft, evidence-graded preferences. Items below are from background knowledge (no source fetched this session) unless a citation is given; verify before presenting as fact.

### Cited Findings
- ICMR-NIN 2024 explicitly does not promote protein supplements and does not call for eliminating wheat (millets as an addition in at least one meal, secondary-source paraphrase). — [The South First](https://thesouthfirst.com/news/icmr-releases-dietary-guidelines-for-indians-after-13-years-says-no-to-protein-supplements), [Organic Mandya](https://organicmandya.com/blogs/news/millet-vs-wheat-which-is-better-for-your-health)
- Food-order benefit is not consistent across all trials (prediabetes RCT null result). — [PMC10005673](https://pmc.ncbi.nlm.nih.gov/articles/PMC10005673/)
- Cooled rice can cause hypoglycaemia in insulin-treated T1D with fixed doses. — [PMC9013350](https://pmc.ncbi.nlm.nih.gov/articles/PMC9013350/)
- GI values for the same food differ greatly across studies (watermelon 37 vs ~70+; chapatti 84 vs ~60s), so GI is not a fixed property. — [compendium](https://pmc.ncbi.nlm.nih.gov/articles/PMC7791047/)

### Inferences
Myths / rules NOT to encode as hard rules (background knowledge; unverified in session):
1. "Fruit is banned for diabetics" or "mango/banana are forbidden" - portions (GL ~9 for 150 g mango) matter; low-GI fruit values above.
2. "Brown rice or millets are automatically low-GI/safe in any quantity" - brown rice GI is still medium; millet rotis are not carb-free; ragi roti GL ~19.
3. "Rice at night causes weight gain / curd at night causes cold" - no good evidence; do not encode time-of-day bans (Ayurvedic rules are tradition, not evidence).
4. "Milk + fish (or curd + fish) is toxic" - no evidence of harm; do not block.
5. "Eggs raise cholesterol so avoid" - dietary cholesterol has modest effect for most; do not auto-block eggs except on clinician instruction.
6. "Dal/legumes cause gout" - plant purines not consistently linked to gout; flag organ meat, shellfish, sardines, red meat, alcohol (beer) instead.
7. "Lactose intolerant must avoid all dairy" - tolerance is dose-dependent; paneer and fermented curd/chaas often tolerated; offer as caution not ban.
8. "Gluten-free = healthy/low GI" - GF breads (rice flour) can be high GI.
9. "Ghee/coconut oil are health foods without limit" - still energy-dense; keep portion-based.
10. "Detox/ cleanse juices, protein supplements are needed by gym-goers" - ICMR 2024 advises food first.
11. "Sugar-free/jaggery/honey sweets are safe for diabetics" - jaggery/honey/dates still raise glucose; use portion and GL.
12. "Pickle/papad are fine in small amounts for BP" - not harmless; a teaspoon of pickle may carry ~250-600 mg sodium (approx.), so keep as flagged-high-sodium.
13. "Eating very late or skipping meals controls weight/diabetes" - skipped meals can cause rebound hunger and, for insulin/sulfonylurea users, hypoglycaemia.
14. Fixed GI "bands" as clinical advice - encode as informational; recommend medical supervision for diabetes/CKD/gout/coeliac.

### Gaps
- No source fetched for individual myths; each should be validated (e.g., against ICMR-NIN 2024 PDF, ADA/ESC/gout guidelines) before the app asserts it.
- FSSAI labelling thresholds (e.g., "high salt/sugar/fat" front-of-pack definitions) not researched in this session.

## Source list (all opened or surfaced this session)
- [Atkinson et al. 2021 summary](https://nutrition.org/ajcn-publishes-international-tables-of-glycemic-index-and-glycemic-load-values-2021-a-systematic-review/)
- [Non-Western GI compendium, Nutr Diabetes 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC7791047/)
- [ICMR-NIN 2024 coverage](https://thesouthfirst.com/news/icmr-releases-dietary-guidelines-for-indians-after-13-years-says-no-to-protein-supplements)
- [Cooled rice RS, PubMed](https://pubmed.ncbi.nlm.nih.gov/26693746/)
- [Cooled rice T1D](https://pmc.ncbi.nlm.nih.gov/articles/PMC9013350/)
- [Hot vs cooled carbs crossover](https://www.msjonline.org/index.php/ijrms/article/view/9324)
- [Food order T2D](https://pmc.ncbi.nlm.nih.gov/articles/PMC5604719), [prediabetes RCT](https://pmc.ncbi.nlm.nih.gov/articles/PMC10005673/)
