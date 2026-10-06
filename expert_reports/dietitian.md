# EatOS dietitian audit

Scope: rules.ts, india.ts, catalog.ts, aspire.ts, DECISIONS.md. Web checks done this session were limited to NHS pregnancy foods and the FSSAI allergen groups; the rest cites guidelines from knowledge and was not re-fetched. The ICMR-NIN 2024 PDF and IFCT 2017 tables were not read, so nutrient figures stay directional. Patches are in `dietitian-patches.json`. Evidence tiers: G guideline, T trial, Tr tradition, U unverified.

## CRITICAL (safety)
1. Allergen arrays miss ingredients (G, FSSAI groups). The hard rule reads only the `allergens` array, so these slip through:
   - thepla: sesame seeds, no sesame flag.
   - thukpa: soy sauce, no soy flag.
   - makhana-roasted, haleem, nihari-roti, jalebi: ghee, no dairy flag.
   - egg-fried-rice, veg-stir-fry: soy sauce usually contains wheat, no gluten flag.
   - Fix: patches, plus a build test that cross-checks ingredients against allergens.
2. Hing (asafoetida) is usually compounded with wheat flour (G, Coeliac UK/CDF). Eight Jain/Satvik dishes carry hing with no gluten flag: idli-chutney-jain, moong-chilla-jain, dhokla, lauki-roti, dal-rice-jain, khichdi-kadhi, rasam-rice-satvik, sambar-rice-satvik. Patched to gluten (conservative). Pure-resin hing exists, so consider an "ingredient: gluten-free hing" variant later.
3. The `high-potassium` tag does not exist in any dish, so the kidney nudge in rules.ts never fires. Patches tag coconut water, banana, fruit chaat, sweet potato, spinach, rajma, dates and similar (USDA). `kidney` also lumps CKD, dialysis and stones. KDIGO 2024 individualises potassium and gives dialysis patients higher protein, so do not penalise protein globally. Propose splitting the condition (rule `condition-split`).
4. Fasting gate keys on `insulin` only. A person on a sulfonylurea who ticks only "diabetes" gets Navratri/Ramzan planning (IDF-DAR 2021, ADA). Gate or ask-doctor for any diabetes, and for kidney, lactation, gout and underweight.
5. Pregnancy hazard list gaps (G, NHS). Missing: liver and pate (vitamin A), king mackerel, tilefish and marlin (mercury), sushi, sashimi, oysters, smoked salmon, raw meat, mould-ripened soft cheese, bhang, other liquor words, and "kaccha papita"/"green papaya". Also `sprouts` over-blocks cooked sprouts and Brussels sprouts; narrow it to raw sprouts. Caffeine over 200 mg/day is a soft nudge, not yet modelled (G).
6. No under-5 or infant safeguards. `minor` is the only age gate. Missing (G, NHS, AAP, ICMR-NIN 2024):
   - whole nuts, popcorn, hard roasted chana, chikki, boned fish (hilsa)
   - honey under 12 months
   - raw sprouts
   - high-sodium dishes
   - cow's milk as the main drink under 12 months
   - Patches add `choking-hazard` and `raw-sprouts` tags; rules `child-under-5` and `infant-under-12m` are proposed.

## HIGH
7. `low-sodium` over-claims (G, FSSAI claim at most 120 mg per 100 g; ICMR-NIN 2024 salt under 5 g/day). Rasam rice (x2), masala chaas, dhokla and sattu (black salt) give hypertension/CKD users a false "Easy on salt". Removed.
8. `high-sodium` is missing on the salty dishes: thukpa, egg-fried-rice, veg-stir-fry, pav-bhaji (x2), dal-makhani, dahi-chivda, kachumber-curd. kachumber-curd (with roasted papad) is itself offered as a low-salt swap in aspire.ts. Patched. Also review: veg-pizza, chole-kulcha, puliyodarai, samosa, murmura-bhel.
9. `high-purine` is applied inconsistently. chicken-curry-roti and keema-pav have it; seekh kebab, butter chicken, tandoori chicken, catalog chicken curries and chingri curry do not. Patched for consistency. Note (G, ACR 2020): chicken is only moderate purine, so tag red meat, organ meat, shellfish, sardine and mackerel first. Gout swaps should add beer and sweet drinks.
10. Tip evidence over-claims in aspire.ts:
    - "mithai after a meal" is marked `guideline`. It is trial-level mixed-meal data, so downgrade it.
    - "cooled, reheated rice has more resistant starch" is a small trial in healthy people with a small effect. It needs a Bacillus cereus safety line (NHS/FSA): refrigerate within 1 hour, reheat once until steaming hot. Matters for pregnancy, children and older adults.
11. No cholesterol saturated-fat lever (G, ICMR-NIN 2024). Only "fried" is penalised; ghee, butter, cream and red-meat gravies are untouched. Propose a `high-satfat` tag and a -2 nudge. Tagged butter chicken, dal makhani and pav bhaji.
12. Anaemia: red-meat dishes (haleem, keema pav, kosha mangsho, seekh kebab, nihari) lack `iron`. Add a tip: pair with lemon or amla, keep tea or coffee away from meals (G, ICMR-NIN 2024/WHO).

## MEDIUM
13. `low-gi` is not supported (G, Atkinson 2021 GI tables) on:
    - ragi-malt: jaggery porridge. Patched to remove `low-gi` and add `sweet`.
    - ragi-dosa, jowar-roti-dal, bajra-khichdi, oats-upma: medium GI (about 55-70), not patched. Prefer "fibre" and "millet" over `low-gi`.
    - rice-congee (GI about 80-100) and catalog `poha` lack `high-gi`. Patched.
14. Vegan with ghee: makhana-roasted is tagged vegan but lists ghee. Changed to vegetarian.
15. Lactose tagging is inconsistent. Catalog items oats-banana, overnight-oats, yogurt-bowl, yogurt-seeds and recovery-shake carry no `lactose` tag; patched. Paneer is low in lactose (Tr/U), yet some paneer dishes carry `lactose` and are dropped at -4 while the swap text says paneer is often tolerated. Choose a policy: milk and curd = `lactose`; paneer, ghee and hard cheese = `low-lactose`.
16. Sattu may be barley-based (a gluten hazard) in some regions. Ask the user or check the pack. kuttu: buckwheat flour spoilage has caused Navratri poisonings, so tell users to buy fresh stock (Tr/U).
17. `later` text for the `health` blocker says "keep it for a weekend meal". That is wrong for gout flare, CKD potassium and insulin users. For gout, kidney and insulin say "ask your clinician".
18. Vegetarian-labelled parmesan and pesto use animal rennet in some brands (Tr). Mention in the Jain/vegetarian caveat.
19. Mustard and poppy are not allergens in the model. Poppy seed (aloo-posto) is wrongly mapped to sesame; harmless over-flag, left in place as a conservative cross-reactivity choice. FSSAI lists sulphite and "cereals containing gluten"; sesame is not in the Indian list but is still reasonable to keep.
20. RESTRICTIVE misses "intermittent fasting", "OMAD", "keto", "laxative" and "diet pill" (G/Tr, NICE NG69). Text allergen lexicon misses suji, rava, atta, khoya, kaju, badam, groundnut, bombil and similar words (patch rule `text-allergen-add`).

## LOW (nutrients)
- coconut-water fibre 3 g is wrong (about 1 g; patched).
- sprouts-salad protein 14 g, sattu-drink 12 g and lentil-spinach-bowl 32 g look 30-50 percent high for the portions. Re-derive from IFCT 2017; not patched.
- Other kcal, protein and fibre figures are plausible for the stated portion.

## Proposed safeguards (evidence tier)
| Condition | Safeguard | Tier |
|---|---|---|
| Under 5 | Hard-deny `choking-hazard`, raw sprouts, honey; spice 0-1; no high-sodium | G |
| Infant under 12 m | No honey, whole nuts, cow's milk as main drink, added salt or sugar | G |
| Older adult | Soft-texture tag nudge; protein and fluid nudge (conflicts with CKD, so ask-doctor) | T |
| CKD | Potassium and phosphorus (processed foods, colas) as ask-doctor plus soft nudge; never auto-restrict | G |
| Lactation | Ask-doctor; alcohol and mercury-fish cautions; no fast plan | G |
| Post-bariatric | Ask-doctor; down-rank sweet, fried and high-gi; no fast plan | G |
| GERD | Soft -1 for spicy and fried only; ACG 2022 finds no routine food elimination; advise dinner 2-3 h before bed | U |
| Diabetes | Fasting ask-doctor; any medicine-change warning stays with the doctor | G |

## What is sound
- Hard versus soft split (D4) and the no-diagnosis stance (D5).
- Fast gates for pregnancy, minors and eating-disorder history.
- The ICMR-NIN 2024 "food over protein supplements" swap.
- Lactose swap guidance (live curd better tolerated; NIDDK).
- Coeliac swap warning about shared mills.
- Sugar nudges for PCOS (international PCOS guideline 2023).
- Thyroid ask-doctor timing flag (levothyroxine on an empty stomach, apart from iron and calcium).

## Sources
NHS Foods to avoid in pregnancy (checked online); FSSAI allergen labelling (checked online); ACR 2020 gout; KDIGO 2024 CKD; IDF-DAR 2021; ADA Standards of Care; ACG 2022 GERD; ICMR-NIN 2024; IFCT 2017; USDA FoodData Central; Atkinson 2021 GI tables; Coeliac UK; NICE NG69.
