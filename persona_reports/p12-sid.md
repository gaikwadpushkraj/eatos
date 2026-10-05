# EatOS as Sid (30, Bengaluru vegan, South Indian, spice 2)

Driven via persona-kit at 390x844, clock pinned to Wed 14 Oct 2026 (08:00, 13:00, 17:00, 20:00 IST). Seeded vegan, spice 2, south-indian. No JS errors. Source untouched. Also audited every dish with diet 'vegan' in packages/core/src/catalog.ts and india.ts (about 63 unique).

## Verdict
- The vegan filter on shown dishes is mostly honest: all four Today slots, the 7-day plan, 8 taste cards and 11 Ask phrasings showed nothing with dairy or egg, except one dish: "Roasted makhana" is tagged Vegan but its ingredients are makhana, ghee, black pepper.
- Wishes block known non-vegan dishes well (paneer, butter, ghee, milk, honey, cheese), but anything outside the catalogue (lassi, ice cream, kulfi, rasmalai, dahi puri, malai kofta, mayonnaise, whey shake, omelette) gets no vegan check, and there are no real swaps (paneer butter masala, filter coffee, honey: "nothing safe to offer").
- Variety is thin (the week is about 4 dinners on repeat), and the protein / B12 / eating-out awareness he expected does not exist anywhere in the app.

## Expectations scorecard
| Expectation | Result | Evidence |
|---|---|---|
| Truly vegan dishes (no ghee, curd, paneer, honey) | PARTLY | Plan/Today/Taste/Ask clean, but makhana-roasted (vegan tag) has ghee; shows in Ask "makhana" and cook screen badge "Vegan". Other vegan rows checked by hand (khichdi = moong dal, rice, turmeric; kerala stew = coconut milk; rajma, chole, sambar, rasam) are clean. Minor hidden risks not flagged: pav, kulkcha, samosa pastry, dhokla, sambar often finished with ghee or butter in restaurants; jaggery/sugar not discussed. |
| Protein and B12 awareness, not medical advice | NOT MET | "B12" appears nowhere in the app (grep of packages/core and src: zero). Ask "what has vitamin B12" and "breakfast with B12" return generic oats upma / sambar rice. Wish "B12 tablets" = "does not know this dish". No "speak to a doctor or dietitian" for vegans (askDoctorFlags only covers kidney/insulin/pregnancy/thyroid). Protein is shown (68 g target, per-dish grams), which is fine. |
| Plant-based swaps for wishes | PARTLY | See wish table below. Curd rice and butter chicken get alternatives, but none of the swaps is a vegan version of the same dish. |
| Restaurant caution | NOT MET | Wishes say "ask the cook about the version above" (no such version). No line like "ask for no ghee/butter/curd, many restaurant dosas and dals use ghee or butter". |
| Enough variety | NOT MET | Vegan per slot (unique): breakfast about 24, lunch about 30, snack about 22, dinner about 28 in the catalogue, but the weekly plan uses 3 breakfasts, 4 lunches, 3 snacks (medu vada, samosa, coconut water) and 3 dinners (two sambar rice, rasam rice). Only 20 grocery items. |
| Common: plain words, no scolding, 390 px | MET | Text readable, no overflow, rule wording kind ("the rule doing its job, not a gap in you"). |

## Findings
| # | Sev | What I did | What I saw | Suggested fix |
|---|---|---|---|---|
| 1 | SAFETY-BLOCKER | Ask "makhana", opened /cook/makhana-roasted | "Roasted makhana", badge Vegan, ingredients include Ghee ("Get out: makhana, ghee, black pepper"). Row in india.ts is diet 'vegan' with ghee. | Change to 'vegetarian' with a dairy/lactose tag, or ingredients "oil" and add a vegan variant. Add a test: no dish with diet vegan may contain ghee/curd/milk/paneer/butter/honey/cream/egg/cheese/whey words (my audit found only this one). |
| 2 | BUG | Wishes: lassi, buttermilk, ice cream, kulfi, rasmalai, dahi puri, boondi raita, dahi vada, malai kofta, khoya barfi, mayonnaise | All: "EatOS does not know this dish yet", no rule line, no "Not vegan". Only milk, paneer, curd, cheese, ghee, butter, egg, honey are checked (rules.ts textProblem), so "dahi", "malai", "khoya", "kulfi", "lassi", "whey", "mawa", "cream", "yogurt", "mayo" pass. | Extend the vegan word list (dahi, malai, khoya, mawa, cream, lassi, chaas, buttermilk, kulfi, ice cream, rasmalai, rabdi, whey, yogurt, mayonnaise, gelatin, gulab jamun, kheer). |
| 3 | BUG | Wish "omelette" | Not flagged for vegan; omelette/omelet/bhurji are excluded from the vegan check (only exempt for vegetarian-eggetarian). "egg white" style wishes depend on the word "egg". | Remove the omelette/bhurji exemption when diet is vegan. |
| 4 | BUG | Wish "whey protein" / "whey protein shake" | Treated as unknown; card says "A version you can have: Whole-food vegetarian protein". Whey is dairy and the wording says vegetarian to a vegan. | Add whey to vegan deny list; word the swap as plant protein (soya, chana, tofu, sattu). |
| 5 | CONTENT-GAP | Wishes paneer butter masala, filter coffee with milk, honey lemon tea, ghee roast dosa, cheese pizza, tofu butter masala | Each ends "EatOS found nothing safe to offer", no alternatives. Real swaps exist: tofu or soya-chunk masala with cashew/coconut gravy, filter coffee with soy/oat/almond milk, jaggery lemon tea, plain or oil dosa, vegan-cheese or hummus pizza. | Add a "plant-based version" block (swap ingredient, how to cook) for common non-vegan wishes; reuse the catalogue where a vegan dish exists. |
| 6 | UX | "tofu butter masala" | Flagged "Not vegan (butter)": a false positive (tofu masala in a butter-style gravy is vegan if made with oil/cashew). | Treat "butter" as a hit only when no plant word (tofu, soya, peanut, almond, cashew, nut) precedes; or soften the message to "may contain butter". |
| 7 | UX | Wishes curd rice, gulab jamun, mishti doi | Curd rice: alternatives are rasam rice, kootu rice (OK, savoury). Gulab jamun: "Close in taste" = samosa, fruit chaat. Mishti doi: coconut water, hummus and carrots. Not close; no sweet vegan options (payasam with coconut milk, ragi malt with jaggery, banana halwa, sweet pongal with oil). Sweets in the catalogue (payasam, kheer, seviyan, phirni, jalebi) are all non-vegan. | Add vegan sweets (coconut-milk payasam, ragi halwa, til ladoo, chikki variants, date-nut balls, aval payasam) and a vegan curd-rice variant (cooked rice with coconut or soya yogurt). |
| 8 | UX | Wish copy for every blocked dish | "ask the cook about the version above" but no version is shown above. | Reword when there is no variant: "Not on your plate while the rule applies." |
| 9 | CONTENT-GAP | Ask "I want paneer", "something with curd", "dessert" | Silent fallback to the same default (sambar rice with poriyal first). No "paneer isn't vegan, tofu or soya chunks would fit" line; "dessert" returns no sweet (chikki appears for "sweet" only). | Parse paneer/curd/dessert for vegans: acknowledge the word, offer tofu bhurji / soy yogurt / vegan sweets. |
| 10 | CONTENT-GAP | Plan tab and Today over a week | Dinner: sambar rice with poriyal / sambar rice without onion / rasam rice with beans poriyal / rasam rice without garlic, cycling. Breakfast: oats upma, idli sambar, idli with tomato-free sambar. Snack: medu vada, samosa, coconut water. The two "satvik" variants (no onion/garlic) appear as ordinary dishes for a person with no such rule. Meanwhile unused vegan dishes: rajma chawal, chole roti, soya chunk curry, tofu scramble, pesarattu, ragi dosa, kootu rice, lemon rice, khichdi. Soya curry (32 g) only shows when asked for protein. | Variety penalty across a week; do not select jain/satvik variants unless the rule is set; prefer 1 high-protein dinner (tofu, soya, chana, rajma) every other day. |
| 11 | UX | Taste cards | 8 cards: idli sambar, fruit chaat, misal pav, luchi aloo dum, pesarattu, sattu sharbat, ragi dosa, moong chilla. All vegan, good. Only 3 are South Indian (despite 1 chosen cuisine); misal pav "Hot" for a spice-2 person; luchi is traditionally fried in ghee in places. | Prefer chosen cuisine and spice; footnote hidden ghee on luchi. |
| 12 | CONTENT-GAP | Ask "cold evening", 16:00 snacks | "Cold evening" returns coconut water, apple and almonds (cold foods). Not vegan-specific, but weak. | Parse weather words (cold = warm foods). |
| 13 | CONTENT-GAP | Vegan with 16 g protein khichdi; 68 g target | No mention of the quick plant protein sources (tofu, soya, sattu, sprouts) as a pair-with idea; no iron/B12/omega-3/calcium notes on the dishes. | Add a plain-words vegan card on Profile or Today: "Plant-based eating can leave B12 low. A doctor or dietitian can advise on checks or supplements." No doses. |
| 14 | UX | Profile > What you eat | "Vegan" chip exists, but no vegan-specific explanation (what is excluded: dairy, ghee, honey, egg, hidden milk powder in sweets/biscuits/bread). | Add a short line under the chip. |

## Delights
- Wish rule lines are specific and kind: "Not vegan (paneer)", "Not vegan (ghee)", plus "the rule doing its job, not a gap in you".
- Taste cards, plan, grocery and Today stayed fully vegan with South Indian flavour (sambar, rasam, kootu, kerala stew, idli, dosa); the grocery list has no dairy.
- Cook screen carries a clear "Vegan" badge and an allergen line; khichdi, rajma, rasam rice have no hidden ghee.
- Whey/supplement wishes avoid doses and endorse food first (ICMR-NIN 2024 mentioned). Fast and readable at 390 px; no console errors.

## Missing
- Vegan variants of the dishes he will miss most: dal tadka (with oil), khichdi (no ghee), curd rice, kadhi, vegan payasam, tofu bhurji, soya yogurt.
- B12 / protein awareness card with "speak to a doctor or dietitian", no doses, no supplement brand pushing.
- Eating-out and delivery caution for vegans: ghee in dosas and rice, butter on pav and naan, milk in coffee, paneer in "veg" gravies, curd in biryani, honey in dressings. "Ask for oil, not ghee or butter."
- Label hidden-ingredient cues: milk powder in sweets/chocolate/bread, bone-char sugar, gelatin, whey.
- Vegan milks (soy, oat, almond) in coffee and tea; a filter coffee wish should be answerable.
