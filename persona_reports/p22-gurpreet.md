# EatOS as Gurpreet (47, Delhi, Sikh family cook, joint family of 6, elder veto)

Driven via persona-kit at 390x844, clock Wed 14 Oct 2026 19:00 IST. Seeded Gurpreet (omnivore, punjabi) + Dadaji 72 veg (hypertension, older-adult-soft), Dadi 70 veg (diabetes), Harjeet omnivore, Jaspreet 19 omnivore (gym goals), Simran 14 veg (minor, mild). No JS errors. Source untouched; scripts deleted. Shots: persona-shots/p22_*.png (looked at today, hh_add). Plan numbers measured with the core library (Kernel.week + fitsAll).

## Verdict
- The safety side holds for six: every dish in the week plan and Ask passes all six people's diet/spice rules, and Household shows per-person yes/no reasons ("Dadaji: not vegetarian") plus a "make the shared base and add it on the side" hint.
- But it plans for the lowest common denominator, not for a family: 28/28 planned meals fit everyone, zero ever contain meat, no base-plus-variant plan exists, and nothing scales to six (no quantities anywhere, "serves 6" is just a member count).
- Dadaji's and Dadi's conditions are invisible and uneditable after adding; there is no Edit in Household, so the elder veto cannot be set on the people already in the house.

## Expectations scorecard
| Expectation | Rating | Evidence |
|---|---|---|
| Cook once for many with variants | PARTLY | Household "Chicken curry": "Dadaji, Dadi, Simran cannot eat it. Cook it on a day when others eat out, or make the shared base and add it on the side." Good words, but no variant dish, no split recipe. Plan only picks all-fit dishes (28/28). |
| Hot/cold beliefs respected, no myth endorsed/mocked | MET (by neutral tags) | "something thanda, cooling" -> Sattu sharbat, Curd poha ("cold, cooling" chips, "Matches cooling"). No claim, no ridicule. "garam taasir / heating" ignored ("does not have taasir, heating") and returns generic khichdi; 43 foods carry cold/cooling tags but no "warm/heating" counterpart searchable. |
| Big batch | NOT MET | Cook screen subtitle "40 min · serves 6" but steps stay "Soak 3/4 cup rajma, 3 cups water"; ingredient list has no amounts at all. Plan says "5 cooked in batches" (leftover reuse), not family-size. |
| Festival/langar dishes | PARTLY | Catalogue has sarson ka saag+makki roti, dal makhani, Amritsari chole kulcha, kadhi pakora, rajma, kheers, halwas (suji, gajar), jalebi, lassi. Missing: karah prasad, langar dal, kadhi-chawal for 50, gur ka halwa, pinni, meethe chawal, parshad. Ask "langar style food for 6" -> Jain-style moong dal (best fit), bajra khichdi. |
| Elder veto (hard per-person never) | PARTLY | Diet/rules are hard and work (veg elders never see meat). But "Never" exists only as a taste-card per self ("removes dish for a year") and as `dislikes` which the Household UI cannot add; dislikes are soft ("Dislikes X" yellow chip), not a veto. Ask "dadaji never eats it" -> "does not have dadaji". |
| Grocery for a family | NOT MET | /grocery: "53 items" listed as "Cumin 13 meals", "Moong dal 7 meals", "Paneer 2 meals": counts of meals, no kg/litres/packs, no scaling for 6. Cumin heads the list. |
| Today hero for six | MET / UX | "Good evening, Gurpreet ... Bajra khichdi with curd. Works for everyone at home." Right voice for the cook, but the dish is one a Punjabi omnivore family would not choose and hero never says "for 6". |
| Edit existing member | NOT MET | Household cards have only "Remove". No edit of diet, rules, conditions, spice, dislikes. |
| Conflict resolution | PARTLY | "Two wishes, one meal" works for dal tadka ("Works for everyone"); Rajma chawal -> "No safe version found. Plan something else for Simran" (spice 2 vs mild) with no alternative offered; chicken -> same text for 3 people, no fallback dish. |

## Findings
| # | Sev | What I did | What I saw | Suggested fix |
|---|-----|-----------|-----------|---------------|
| 1 | UX | Household after seeding Dadaji (hypertension + older-adult-soft), Dadi (diabetes) | Cards show only "Vegetarian", "Mild", "Under 18". Conditions of adults never shown, so she cannot confirm what the app knows; only 'minor' renders | Show declared conditions as quiet chips (or "health notes set") on every card |
| 2 | UX | Looked for editing a member | Only "Remove"; Add form has rules/conditions/allergies/mild but existing people (and her own card) can't be changed. Removing and re-adding loses id/history | Add Edit on each card reusing the add form; allow spice, dislikes, cuisines too |
| 3 | UX | Added-member form | No field for dislikes/"never eats X", spice, age, or "managed by me"; Simran needed managedBy set by seed | Add "Never eats" free-text/dish picker as hard veto; optional age |
| 4 | BUG/UX | Opened Plan | All 28 meals fit all six: 19 distinct dishes, 0 non-veg, 0 Punjabi dinners (Jowar roti, soup, lauki, GERD-gentle idli, quinoa bowl). 184/265 catalogue dishes fit everyone, 84/147 dinners. Harjeet/Jaspreet never get meat, so veg-only plan | Plan "base + add-on" days: shared veg dish plus a meat side/variant for those who eat it; weight cuisines chosen (punjabi) |
| 5 | CONTENT-GAP | Plan cuisine | Gurpreet picked Punjabi but dinners are jowar/bajra/kootu/idli; Dadaji "older-adult-soft" + GERD-gentle idli leak into whole-family plan | Respect cuisine weight in planner; apply softness only to the person it concerns |
| 6 | BUG | /cook/rajma-chawal; also /cook/bajra-khichdi-with-curd | Header "serves 6" but all quantities unchanged ("3/4 cup rajma, 3 cups water"); ingredients list has no amounts; Simran line says "Too spicy" yet the screen offers no "make milder portion" step. (Slug guess for bajra gave "That recipe was not found." - fine, wrong id) | Scale step quantities by head count (or show "x6" amounts); add "set aside Simran's portion before the chilli" tip |
| 7 | UX | /grocery | "Cumin 13 meals" instead of amounts; no packs/kg; 53 items for 6 people | Show quantity with household multiplier; sort staples by need; group Other less |
| 8 | CONTENT-GAP | Ask/Wishes for karah prasad, langar, gur ka halwa, pinni | "does not know this dish yet" / generic khichdi. Ask "langar style food for 6" best fit = Jain-style moong dal, an odd langar answer | Add langar/gurdwara set (langar dal, kadhi chawal, karah prasad, pinni, meethe chawal, kheer for a crowd) with big-batch tag; map "langar" to it |
| 9 | UX | Ask "big batch for a gathering" | Matches nothing ("big","batch","gathering"), returns the same khichdi/jowar/kootu | Add batch/serves-N intent and a servings stepper |
| 10 | UX | Household "Rajma chawal" and "Chicken curry" | "No safe version found. Plan something else for Simran" ends the flow; no suggested close dish; rajma failed only on spice 2 vs a mild 14 year old | Offer the nearest all-fit dish or "cook mild, add chilli tadka at the table" |
| 11 | UX | Ask hot/cold phrasing | "thanda/cooling" works; "garam/taasir/heating" ignored with "does not have..." copy implying her words are wrong | Add garam/heating synonyms mapped to warm tags, no health claims, optionally "tradition says" label |
| 12 | UX | "Wishes" for chicken curry | Good message "Dadaji and Dadi and Simran cannot eat it" - but grammar "Dadaji and Dadi and Simran" and the "others eat out" advice doesn't fit a family that cooks once | "Dadaji, Dadi and Simran"; add "cook the veg base first, set aside, then add chicken" |

## Delights
- Household matrix with names and reasons ("Dadaji: not vegetarian") is exactly how an Indian family conversation goes; "Everyone" chip is clear.
- Hero addresses Gurpreet by name and says "Works for everyone at home", calm and not a diagnosis.
- Hot/cold handled neutrally: "cooling" chips only, no benefit claims, no mockery.
- Wish screen is kind ("cannot eat it", close alternatives, "does the same job").
- Catalogue has real Punjabi staples (saag, makki, dal makhani, Amritsari chole kulcha, kadhi pakora, halwa).

## Missing
- Edit member; show conditions on cards; hard per-person "never"; dislikes input.
- Servings scaling in cook/grocery; quantities with units; big-batch/langar recipes.
- Base-plus-variant meal planning (veg base, meat add-on), cuisine-weighted plan, who's-eating-tonight toggles (guests, one member away).
- Hero line stating "for 6" and who needs a variant tonight.
