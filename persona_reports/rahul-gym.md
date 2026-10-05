# EatOS as Rahul (26, Punjabi veg gym-goer, Delhi PG, 1 induction plate)

Driven via persona-kit at 390x844, clock pinned to Wed 14 Oct 2026 19:00 IST. No JS errors seen. Source untouched.

## Verdict
- Core promise (veg, protein-forward, Punjabi-flavoured) works: Today/Ask show paneer tikka, soya chunk curry, rajma with plausible protein numbers.
- It breaks trust on the PG constraints: the oven pizza IS offered on "basic", the no-cook list is thin (one dinner), and a post-workout Today card suggests coconut water.
- Wishes are the weakest screen: "mutton" and "whey protein shake" say "Nothing is in the way", and "protein bar" is silently turned into idli.

## Findings
| # | Sev | What I did | What I saw | Suggested fix |
|---|-----|-----------|-----------|---------------|
| 1 | BUG | Kitchen "basic (no oven)"; pantry had pizza dough, mozzarella etc.; Ask "dinner" | "Homemade vegetable pizza" is 3rd pick ("Uses what you already have"), cook screen opens it. Code: recommend.ts filters tag `oven`, but no dish in catalog.ts/india.ts carries that tag (grep: zero). Pizza steps are the generic "Cook or assemble, about 35 minutes". | Tag veg-pizza `oven` (or give a tawa/pan version). Add a test: no dish with oven words is returned for kitchen!=full. |
| 2 | BUG | Wish "mutton" (Rahul is vegetarian) | Green card "Mutton. Nothing is in the way." No diet-rule block, no alternatives. "chicken tikka" IS blocked ("Your rules: Not vegetarian") because it matches a catalog dish; free-text meat is not checked. | Run unknown wishes through a keyword diet check (meat/fish/egg words vs diet+rules) before saying "Nothing is in the way". |
| 3 | BUG | Wish "protein bar" | Resolved to "Idli with sambar", "Nothing is in the way" (twice), alternatives masala dosa, rava upma, oats upma. Fuzzy match is wrong and the alternatives are not protein foods. | Do not fuzzy-match to a dish unless similarity is high; otherwise say "not in our list" and offer food-first protein picks (chana, paneer, curd, eggs). |
| 4 | BUG | Seeded high-intensity 60 min workout 20 min ago, time 17:30 | Notice "Plan adjusted: Recovery snack at 17:40", but hero card "NEXT UP SNACK 17:00" is Coconut water, 1 g protein, button "Start cooking". Recovery shake exists in catalog (18 g) but is not what Today shows. Hydration target 2.5 L to 3.0 L and protein 90 to 110 g did update (good). | Make the next-up card the recovery pick (protein + carb, e.g. milk/banana/oats shake, curd, boiled eggs); never "Start cooking" on a 0-min item. |
| 5 | BUG | Wish "whey protein shake", "egg white omelette" | Both: "Nothing is in the way." and only "Save to my wish list". No supplement mention (good, no endorsement) but also no food-first alternative; egg white omelette has no egg dish suggested though eggs-toast, egg bhurji, egg curry exist. | Unknown wish: show "Food-first options" (paneer, curd, eggs, soya, sprouts). Do not show green "Nothing is in the way" for a thing the app does not know. |
| 6 | BUG | Quick Add "paneer 500g, 12 eggs, soya chunks, dal 1 kg, rice 2 kg, curd 1 kg" | Parsed 6 items. Curd 1 kg filed under Cupboard with "29 days" shelf life (should be Fridge, a few days). Soya chunks stored as "1 pc". Eggs 6 days (ok). "dal" never matches dish ingredients (moong dal, toor dal), so dal gives no coverage. | Curd/milk/paneer to fridge with short expiry; soya chunks default pack/g; alias dal to specific dals. |
| 7 | UX | Ask "dinner with what I have" after Quick Add | Coverage works: tikka "Missing" drops from 6 to 4 (capsicum, onion, cucumber, lemon), soya curry from 5 to 4 on "high protein dinner". But "with what I have" is not parsed; plain "dinner" order is tikka, rajma, chole while soya chunk curry (4 missing, 32 g) is not shown. 12 eggs in pantry never lead to an egg dinner. | Parse "what I have" as pantry-first weighting; surface egg dishes when eggs are stocked. |
| 8 | CONTENT-GAP | Kitchen "none"; high protein dinner | "1 option fits right now": Curd rice, 10 g protein. Whole no-cook set is 12 items (curd bowl, curd rice, sprouts salad, kachumber, fruit chaat, roasted chana, makhana, murmura bhel, chaas, coconut water, boiled eggs, PB-banana toast). Only ONE has a dinner slot. Missing: paneer cubes/chilli paneer salad, soya/chana chaat, dahi + chana/ sattu drink, peanut-chana chaat, milk+oats/muesli, bread-omelette-free sandwiches (curd/paneer), peanut butter + roti, roasted soya, protein lassi. "No-cook" boiled eggs needs a heat source/kettle and 10 min. | Add 8 to 10 no-cook/single-kettle protein dishes with L/D slots; add an "electric kettle only" tier. |
| 9 | CONTENT-GAP | Ask "something vegetarian with at least 30 g protein" | Parser ignores the number: basic gives paneer tikka 24 g as Best fit. none-kitchen gives 14, 13, 12 g and still says nothing about not meeting 30. | Parse "N g protein" as a hard filter; if nothing qualifies say so plainly. |
| 10 | CONTENT-GAP | Ask "cheap protein" / "what can I eat without cooking" | "cheap" ignored (identical to "high protein"). "without cooking" parsed as exclude word "cooking"; on basic it returns cooked dishes (tikka, paratha, rajma), not no-cook. Free-text "paneer", "eggs", "sattu", "chana", "pizza" all ignored, same default 3. | Support ingredient words, "no cook", "cheap" (needs price tags). |
| 11 | UX | Wish "chicken tikka" | Consistent with food-first: blocked with reason, alternatives paneer tikka, rajma, chole; "same job": soya curry, paneer salad, eggs on toast. All doable on one plate. But "close in taste" listing rajma/chole for tikka is a stretch, and no word on eggs as the veg-egg bridge. | Rank egg/paneer higher; keep wording. |
| 12 | UX | Today default view | Protein "0 / 90 g", Fibre "0 / 30 g", Hydration "0.0 / 2.5 L" with progress bars on first screen; Ask cards say "24 g protein closes today's gap". For a gym-goer, ok, but it is gram-tracking by default; "Hide numbers" exists only deep in Profile. Dinner card also shows nothing meaningful for the 0/90 g number because eating is not logged unless "I already ate this". | Default hide for non-tracking goals, or offer the toggle on Today; avoid "closes today's gap" wording. |
| 13 | CONTENT-GAP | Taste cards (8) | Zero Punjabi dishes despite cuisines=[punjabi]: Lauki sabzi (No spice), Misal pav, Luchi aloo dum, Mango curd cup, Idli sambar, Pesarattu, Ragi dosa, Moong chilla. Spice 3 user shown "No spice"/"Mild" dishes first. Catalog has just 4 Punjabi veg dishes (aloo paratha, rajma chawal, chole roti, paneer tikka); no palak paneer, dal makhani, paneer bhurji, kadhi, butter paneer, egg curry Punjabi, lassi, sattu. | Seed taste cards from stated cuisine/spice; expand Punjabi/North Indian veg set. |
| 14 | UX | Cook screen | Steps are generic: "Gather the ingredients", "Wash and chop what needs it", "Cook or assemble, about 35 minutes", "Taste, season and serve" (pizza, tikka). Paneer tikka does not say tawa/pan, no equipment line. | Per-dish steps, with "on one burner" variants. |
| 15 | UX | Pantry search UI | Pantry says "Used" button next to every item; "Add items" is a one-line input. Fine on 390 px; no horizontal overflow at 320 px. | none |
| 16 | UX | No price data | Nothing about cost anywhere. Student expects rupees per meal. Misleading bits: "cheap protein" answers with paneer tikka first (paneer is the dearest protein per gram), "Best fit" paneer wrap/lentil bowl use greek yogurt, berries, tortilla, hummus, pine nuts, tofu: not Delhi-PG staples. | Add rough cost band per dish; boost soya chunks, chana, eggs, dal, curd, sattu for "cheap protein"; ingredient names in Indian terms (dahi, capsicum, atta). |

Protein plausibility: boiled eggs 13 g, soya curry 32 g, paneer tikka 24 g, rajma chawal 20 g, wrap 28 g are in range. Lentil+spinach bowl 32 g and roasted chana 10 g look slightly generous. "Aloo paratha with curd" 11 g is honest and is the breakfast pick on the plan even for a protein goal.

Plan check (kitchen basic): Wed shows aloo paratha, tikka, boiled eggs, rajma; grocery list 29 items; "cook once, eat twice" works and suits a single plate.

## What delighted him
- Rajma chawal/chole/paneer tikka first on a bare profile; "A taste you grew up with" lands.
- Chicken wish: clear reason, no shaming, practical swaps (eggs on toast, soya curry, paneer salad).
- Kitchen "none" really limits to no-cook; Roasted chana and curd bowls appear instantly (0 to 3 min).
- Workout logging bumps water (2.5 to 3.0 L) and protein (90 to 110 g) and adds a "Plan adjusted" note.
- Quick Add parsed all six items from one line, and "Missing:" lists shrink as pantry fills.
- No supplement endorsement or medical claims seen; profile copy says no medical advice.

## Missing for him
- Oven rule that actually works, and a one-burner / kettle-only mode.
- Cost per meal and a "cheap protein" ranking (soya, chana, dal, eggs, curd, sattu).
- Real recovery snack surfaced on Today; protein-target parsing ("30 g").
- Egg dishes when eggs are in the pantry; whey/protein bar answered with food-first picks.
- Punjabi-weighted taste cards, hotter spice, more Punjabi veg dishes.
- Meat/fish wishes checked against diet even if not in catalog.
