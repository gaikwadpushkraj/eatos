# EatOS as Riya (27, Mumbai, coeliac, vegetarian, spice 2)

Driven via persona-kit at 390x844 (clock pinned Wed 14 Oct 2026 at 08/13/17/20 h, plus 5 other dates for Today and the Plan). Seeded `conditions:['celiac']`. Plus a static audit of all 215 catalog dishes vs. the 101 that pass Riya's rules. No JS errors. Source untouched, scripts deleted.

## Verdict
- The hard filter works: across 20 Today views (4 slots x 5 dates), 12 distinct Plan meals, 8 taste cards, ~25 Ask phrasings and wish alternatives I saw ZERO gluten dishes (roti, pav, noodles, upma, oats, seviyan, kadhi-with-gluten-flag, momos all blocked or swapped).
- But the app only ever says "Contains gluten" when a dish is blocked. For dishes it lets through it says "No common allergens" and never mentions cross-contact, flour or masala labels, besan adulteration, or eating out. There is no hidden-gluten education and no restaurant guidance anywhere.
- Free text is blind: "gluten free", "is hing safe", "beer", "restaurant" and "a bite of cake is fine?" all return the default 3 dishes with no answer; nothing says "just a little is fine" (good) but nothing says "never" either.

## Expectations scorecard
| Expectation | Result | Evidence |
|---|---|---|
| Zero gluten in any suggestion | MET (with a latent gap) | Today 08/13/17/20 x 5 dates: besan chilla, sambar rice, sweet potato chaat, bisi bele bath, biryani, banana, chaas, paneer tikka... none flagged gluten. 101/215 dishes pass (breakfast 28, lunch 51, snack 36, dinner 49). Gap: `haak-rice` lists asafoetida but is not gluten-flagged. |
| Honest about hidden hing/asafoetida | PARTLY | Hing is in the gluten word list, but "asafoetida" is not, so Haak (collard greens) with rice passes and its cook page says "No common allergens". Idli sambar (sambar powder) and bisi bele bath (bisi bele bath powder) also say it. |
| Soy sauce, malt, sooji, papad | PARTLY | Wish "soy sauce noodles" blocked ("Contains gluten (noodles)"); soy sauce, malt, sooji/rava, bhajani are in the list. Papad is not: "Kachumber with curd and roasted papad" is shown as Best fit for "light dinner" and wish "papad" says "Nothing is in the way." Papad is a known hidden-gluten item for coeliacs (wheat/hing/atta dusting). |
| Safe eating-out guidance | NOT MET | Ask "I am eating out at a restaurant, what should I ask" gets the default 3 dishes. No page mentions restaurants, shared tawa/fryer, cross-contact (only a one-liner "Check flours and cross-contact" under wish alternatives). |
| Millet and rice options | MET | Wish roti/pizza/upma/naan: "A version you can have" = jowar roti, bajra khichdi, ragi dosa, besan chilla. Ask "millet options": foxtail millet pulao first. Akki roti, ragi mudde, kuttu roti, puttu appear. |
| Not told "just a little is fine" | MET (by silence) | "can I eat a little gluten" and "just a bite of cake is fine right" get no reassurance, but also no answer: "EatOS does not have 'little', 'gluten' yet". Never says "never". |
| Wishes (roti/pizza/naan/idli/dosa/upma/papdi chaat/beer/soy noodles/momos) | PARTLY | roti, pizza, naan, upma, noodles, momos, oats, seviyan, kadhi, biscuits: blocked with GF swaps. idli and dosa: fine ("Nothing is in the way"). "chaat with papdi", "beer", "sooji halwa", "dal with hing tadka": "does not know this dish yet", no gluten warning (beer = barley is exactly what she needs told). |
| Plan and grocery safety | PARTLY | Plan 7 days: all dishes pass; the grocery list has Besan (3 meals), Biryani masala, Ragi, Jowar flour with no "buy certified GF / check the label" note. |

## Findings
| # | Sev | What I did | What I saw | Suggested fix |
|---|-----|-----------|-----------|---------------|
| 1 | SAFETY-BLOCKER | Opened /cook/haak-rice | Ingredients list Asafoetida, badge "No common allergens", it is in the pool for Today/Ask/Plan. INGREDIENT_ALLERGENS has "hing" but not "asafoetida"/"heeng". | Add asafoetida, heeng, "sambar powder", "rasam powder", "bisi bele bath powder", "papad", "papdi", "biryani masala"/"garam masala" (compound) to the gluten list, or add a GF-hing variant. |
| 2 | SAFETY-BLOCKER | Ask "light dinner"; wish "papad"; /cook/kachumber-curd | Papad dish is "Best fit" and "Nothing is in the way", badge "Contains dairy" only. | Gluten-flag papad (or require "gluten-free papad / rice papad" ingredient). |
| 3 | BUG | Cook pages of besan chilla, idli sambar, sambar rice | "No common allergens" is a false all-clear for a coeliac: commercial besan is often adulterated, sambar/masala powders carry hing/wheat fillers, tawa shared with rotis. | For celiac members replace that badge with "Gluten-free ingredients. Use certified GF besan/masala/hing" (and keep "check labels" visible). |
| 4 | CONTENT-GAP | Ask "I am eating out...", "street food in Mumbai", "vada pav", "beer with friends" | Default 3 dishes; street food returns murmura bhel (fine) but no warning that bhel puri sev/papdi, chutneys, shared fryers carry gluten. | Add a "Eating out as a coeliac" card: ask about shared fryer/tawa, soy sauce, atta in gravies, hing, papad; say "when unsure, skip". Trigger on restaurant/eating out/outside/party/delivery. |
| 5 | UX | Ask "gluten free", "is hing safe", "little gluten", "chinese noodles" | "EatOS does not have 'gluten' yet, so these are the closest picks." Silent when pasta/sandwich/bread/noodles are asked (no "excluded for gluten" line). | Recognise "gluten" and the blocked-dish words: "I left out X because it contains gluten", and answer safety questions with a plain "never" plus what to check. |
| 6 | UX | Wish "beer", "chaat with papdi", "sooji halwa", "dal with hing tadka" | "EatOS does not know this dish yet, so it cannot check it" and nothing else. Beer/sooji/papdi are gluten words that textProblem should catch. | Run textProblem on wish text; for unknown dishes with a gluten keyword show "Contains gluten (barley)" and GF swaps (e.g. cider-free, rice halwa). |
| 7 | UX | /household "Two wishes, one meal" picker | Lists Chole with roti, Palak paneer with roti, Paneer bhurji roti etc.; picking Chole with roti says "No safe version found. Plan something else for Riya". Correct, but it offers 5+ gluten dishes to a solo user. | Hide gluten dishes in the picker for celiac members, or show "Contains gluten" next to them. |
| 8 | UX | Today at all 4 slots | Never a celiac note ("All on track"); no GF confidence marker, no "gluten-free" chip. | Add a small "Gluten-free" chip on dish cards for celiac members. |
| 9 | CONTENT-GAP | Counted pool | 101 safe dishes but thin evenings: Today repeats besan chilla, sambar rice, appam with egg roast, sweet potato chaat, biryani across days. Chinese, pasta and bread have no GF equivalents (rice noodles, GF bread, rice pasta). | Add rice-noodle stir fry (tamari), GF pasta, ragi/millet bread, rice-paper rolls. |

## Delights
- "Contains gluten (noodles)" is explained plainly in the wish card; "Check flours and cross-contact" appears with the swaps.
- "Jowar roti / bajra khichdi / ragi dosa / besan chilla" is exactly the swap list she would write herself; "chole kulcha" and "seviyan" are correctly blocked.
- Taste cards only show fitting dishes; Plan footer says "Every dish respects everyone's allergies and diet."

## Missing
- A coeliac mode explanation: what hidden gluten is, a "check labels" checklist, and a plain "never a little" line.
- Eating-out / delivery / travel / party guidance and a "tell the cook" phrase card (English/Hindi/Marathi).
- Ingredient-level "certified GF" notes in the grocery list (besan, masala, hing, oats, soy sauce/tamari).
- Cross-contact awareness in the household view (shared tawa/rolling board with a gluten eater).
