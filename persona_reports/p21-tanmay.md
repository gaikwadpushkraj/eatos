# EatOS as Tanmay (26, Hyderabad, WFH techie, basic kitchen, 20 min)

Driven via persona-kit at 390x844, clock Wed 14 Oct 2026 20:00 IST. Seeded Tanmay omnivore, spice 3, hyderabadi+north-indian, kitchen basic. No JS errors. Source untouched; scripts deleted. Shots: persona-shots/p21_*.png (looked at cook, grocery, pantry).

## Verdict
- The quick-dinner path works: "20 minute dinner", "one pot", "15 minute dinner" return real 15-20 min dishes, and the cook screen gives one big step at a time with quantities and "Start N min timer" buttons.
- It breaks on the "I have eggs, rice, dal, onion, tomato, maggi, bread" flow: nothing makes the app suggest from the pantry, "maggi" finds nothing, and the grocery list has no quantities.
- Chicken hygiene and doneness are mostly missing from the main chicken dishes, and beginner words and heat levels are barely explained.

## Expectations scorecard
| Expectation | Rating | Evidence |
|---|---|---|
| 15/20 minute dinners | MET | "20 minute dinner": Samak rice pulao 20 min, 15-minute one-pot masoor dal, Curd rice. "15 minute dinner": masoor dal, curd rice, grilled cheese sandwich. "one pot" matches (matched "pot" in name). |
| Steps he can follow | PARTLY | Quantities, minutes and timer buttons are good (masoor dal: "Simmer 10 minutes until soft", "Start 10 min timer"). Weak on heat, doneness cues, how to chop, "make rotis" (see #4, #5). |
| Grocery list short | NOT MET | Default plan gives 48 items (41 after pantry), no quantities, only "13 meals" counts. Fine grouping (Produce / Other / Grains / Dairy) but "Other" is a 28-item dump. |
| Pantry-driven suggestions | NOT MET | After Quick Add of 7 items, "what can I make with what I have" still tops with Chicken curry (Missing 4 items), above Egg dishes. Only "egg" query says "Uses what you already have". |
| Delivery fallback honesty | NOT MET | No delivery or order option anywhere in the UI. "too tired to cook order in", "swiggy" return Chicken curry (40 min) and a 90-min biryani with no acknowledgement. |
| No jargon | PARTLY | "Dal tadka" steps say "crackle 1 tsp cumin ... tadka" with no explanation; "3 whistles", "pour tadka" assumed. See #6. |
| Works at 390 px | MET | Cook and grocery screens read cleanly; sticky Previous/Next bar is thumb-friendly. |

## Findings
| # | Sev | What I did | What I saw | Suggested fix |
|---|-----|-----------|-----------|---------------|
| 1 | BUG | Quick Add "eggs, rice, dal, onion, tomato, maggi, bread", then Ask "what can I make with what I have" | Result: Chicken curry (Missing chicken, flour, garlic, ginger), Besan chilla, Dal tadka. Egg paratha, Eggs on toast, Maggi dish never shown. Header says "Using pantry" but ranking barely uses it. | When the query is pantry-intent (or always when pantry non-empty), rank by fewest missing items and put "Uses what you already have" first; add a "Cook from pantry" chip. |
| 2 | BUG | Same, then Ask "maggi" | "EatOS does not have 'maggi' yet", though "Veg instant noodles with an egg" (7 min, maggi-veg) exists. "instant noodles" does find it. Pantry item "Maggi" never links to it. | Add alias maggi/noodles to maggi-veg; map pantry brand names to ingredients. |
| 3 | BUG | Pantry quick add, then Ask 'dal tadka' | I added "dal", still "Missing: toor dal". Generic "dal" does not satisfy any specific dal. Also every item shows "1 pc" (Rice 1 pc, Dal 1 pc) and "Used" label; rice 179 days. | Treat "dal" as any dal; parse default units (rice/dal in kg, eggs pcs). |
| 4 | SAFETY-BLOCKER | Read chicken-curry-roti, chicken-biryani, butter-chicken-naan steps | No doneness cue ("no pink", 75 C) or raw-chicken handwashing. Only tandoori salad, chettinad and a couple of others have it. Butter chicken: "Cook 400 g chicken in 1 tbsp butter 6 minutes" then simmer; biryani relies on timing only. For a beginner, the top suggested dish is the least safe-worded. | Add one line to every raw chicken/mince/egg step: wash hands and board after raw meat; cooked when no pink, juices clear. Make it a content-validator rule for any recipe containing chicken, mutton, mince or fish. |
| 5 | CONTENT-GAP | Chicken curry steps 1-5 | No spices at all (no turmeric, chilli, garam masala); "Make rotis from 1 cup wheat flour; serve." is one line (a 10-step skill) for a beginner. No heat for steps 1-3, no "until oil separates". Ingredient list has no quantities and omits oil/salt; "serves 1" with 400 g chicken. | Add masala to ingredients and steps; offer "buy 4 rotis / use bread" fallback; show quantities in the ingredient list. |
| 6 | UX | Cook dal tadka, dalia khichdi | Terms like "tadka", "whistle", "dum", "sear", "simmer" are unexplained. bhuno is never used (good). Pressure-cooker steps say "3 whistles" with no "on high, then turn off" or alternative if he lacks a cooker (basic kitchen). | Tap-to-explain glossary chips on step text; add a one-line "no cooker? simmer 25 min" alternative. |
| 7 | UX | Ask "pressure cooker" | "EatOS does not have 'pressure', 'cooker' yet", then Chicken curry and 90-min biryani. Equipment is not searchable even though steps mention whistles. | Tag recipes by equipment; match "pressure cooker/one pot/microwave/kadai". |
| 8 | UX | Grocery list | 48 items, no quantities, "13 meals" counts, a 28-item "Other" bucket mixing spices, sugar, saffron, oil, nuts. Check-boxes don't suggest "Tanmay needs only 5 things for tonight". Plan is 28 meals including a 90-min mutton biryani for someone with 20 minutes. | Add quantity totals (e.g. "Onion 6"), split Spices/Pantry staples/Dairy, a "Just tonight's dinner" list, and a quick-meal plan mode when kitchen is basic. |
| 9 | UX | Home at 20:00 | "Dinner 19:30 Chicken curry with roti, 40 min" is already past; pantry full but home still suggests needing chicken. 90-min biryani appears in the default Ask top 3 for a 20-min persona. | Respect a "time I have" profile field and "already late" state; show a quick option first. |
| 10 | UX | Ask for delivery | No honest "this is not available in the app" answer; "swiggy"/"order" get random cooking picks. | Reply "EatOS does not order food. Closest quick cooks: ..." and list 10-min options (Maggi egg, eggs on toast). |
| 11 | CONTENT-GAP | Ask "egg curry" then Cook this | First result was Kerala parotta with egg roast (40 min, 6 steps with 1 hour dough rest) not Egg curry with rice (30 min). Parotta step 1 crams kneading, 1-hour rest, balls, stretch, pleat and coil into one line. | Rank exact-name match first; split long steps. |

## Steps plausibility (10 sampled)
- Masoor dal one-pot (4 steps): good, safe, 15 min plausible. Pea pulao one-pot: not fully read.
- Dal tadka rice, dalia khichdi, egg curry rice (boil 10 min, prick with fork): plausible; egg dishes cooked through.
- Maggi-veg (5 steps, 7 min): great beginner steps, "Crack 1 egg in and stir briskly 1 minute".
- Chicken curry, biryani, butter chicken, keema pav: no doneness line (see #4). Keema "fry 8, cover 15 minutes" is sound.
- Thukpa, chicken-chettinad: chettinad has handwashing and 75 C - the model to copy.

## Delights
- Timer buttons on each timed step ("Start 6 min timer") and sticky Next/Previous; one step per screen is exactly right for a beginner.
- Real quantities in steps (3/4 cup, 150 g), and "Ready in 15 min" reason lines; "one pot" and time queries work.
- "Missing" list per dish shows what to buy; chettinad steps show good hygiene wording.

## Missing
- Quantities on ingredient list and grocery list; a "tonight only" shopping list.
- Pantry-first ranking, "cook from what I have", brand aliases (Maggi), default units.
- Equipment tags (pressure cooker, no oven), time-budget profile field, glossary of cooking terms, food-safety line on all raw-meat dishes, honest delivery fallback.
