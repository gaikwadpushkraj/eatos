# EatOS as Anil (29, Kerala migrant, Delhi PG, homesick)

Driven via persona-kit at 390x844, Wed 14 Oct 2026 19:30 IST; member omnivore, spice 3, cuisines kerala + south-indian, kitchen basic. No JS errors. Source untouched.

## Verdict
- The south-Indian lean works: Today, Plan and Ask lead with curd rice, rasam rice, sambar rice, idli, and the plan has little North-Indian bias.
- Kerala itself barely exists: 2 dishes (both vegetarian), no fish, beef, appam, puttu or parotta. He eats beef and fish, so the "taste of home" flow dead-ends.
- Substitutes for curry leaves, coconut, coconut oil and kokum are not mentioned anywhere. The app is honest about unknown wishes but gives him nowhere to go next.

## Expectations scorecard
| Expectation | Result | Evidence |
|---|---|---|
| Kerala comfort food | NOT MET | india.ts has exactly 2 `kerala` dishes: avial-rice, kerala-stew-appam (grep). Ask "something Kerala" returns them, then pads slot 3 with oats upma. |
| Cuisines weighting | MET (south), PARTLY (Kerala) | Home pick "Curd rice with pickle: A taste you grew up with". Plan week is all south-Indian. "Fish curry" returns the Bengali mustard-oil dish first. |
| Substitutes for unsold ingredients | NOT MET | Cook screens for avial and stew list curry leaves, raw banana, drumstick, coconut milk as plain "Missing". No "no X? use Y", no sold-near-you hint. No substitution code is surfaced. |
| Taste of home when low | PARTLY | Wish "appam stew" is recognised ("Nothing is in the way", close alternatives). "puttu", "beef fry", "fish curry meal", "karimeen pollichathu" all get "does not know this dish yet", no alternatives, only "Save to my wish list". |
| Honest about what cannot be made | PARTLY | The unknown-dish card is honest, but its "Ask how it is made" has no button or link. Ask "beef fry" does not say it has no beef dish; it silently returns tofu stir fry, oats upma, idli. |
| Basic kitchen respected | MET | Everything shown is stovetop; no oven dish seen. Stew with appam is listed as 35 min, but the appam step needs a kadai and batter fermenting, unaddressed. |
| No North-Indian bias | MET for Today/Plan/Ask; PARTLY for taste cards | Taste 8: Avial, Idli sambar, Fruit chaat (N. Indian), Kosha mangsho luchi (Bengali), Misal pav, Pesarattu, Mango curd, Sattu sharbat (Bihari). Only 2 of 8 match his cuisines. |
| Malayalam | NOT MET | No language option anywhere (Profile has none). Dish names are English only. Expected, reported. |

## Findings
| # | Sev | What I did | What I saw | Suggested fix |
|---|-----|-----------|-----------|---------------|
| 1 | CONTENT-GAP | grep kerala in india.ts; Ask "something Kerala" | Only avial and veg stew with appam. Both are vegetarian. Missing: appam (alone), puttu-kadala, fish molee, beef fry, karimeen pollichathu, thoran, olan, parippu curry, Kerala sambar, Kerala parotta (+ beef/chicken curry), payasam (only a south-Indian semiya payasam exists), meen curry, idiyappam, kappa-meen, egg roast, fish fry. | Add 15 to 20 Kerala dishes, with at least 5 fish/meat, tagged `kerala` and `coconut-oil`. |
| 2 | CONTENT-GAP | Ask "fish curry for dinner" | Best fit: Bengali "Fish curry with rice" (mustard oil). Macher jhol also Bengali. No Kerala meen curry (kokum, coconut). | Add meen curry (kodampuli), fish molee, fish fry. |
| 3 | UX | Ask "beef fry", "non veg"; Anil is "Eats everything" | "beef fry" returns tofu stir fry as Best fit, "Matches fry", with no word that beef is unknown. "non veg" yields oats upma and idli. Home/Plan for an omnivore were 100% vegetarian across the week I read. | Say "no beef dish yet" and offer chicken/fish; ask "veg or non-veg tonight?". Allow non-veg in plan for omnivores. |
| 4 | UX | Wish "puttu" / "beef fry" / "karimeen pollichathu" | Card says "Ask how it is made, or pick something from the list below" but nothing is below and there is no ask control. A dead end when he is homesick. | Add a real "Ask how it's made" button, or show nearest dishes (kerala + coconut). |
| 5 | CONTENT-GAP | Cook avial-rice, stew-appam | Ingredients are only "Missing". No substitutes for curry leaves, coconut, coconut milk, raw banana, yam, drumstick. Delhi reality: fresh curry leaves only at INA/Mother Dairy-type stores, raw banana and drumstick seasonal. | Substitution line per ingredient (frozen grated coconut or desiccated + milk, coconut milk powder, plantain/ash gourd for raw banana, dried curry leaves with honest "not the same"). |
| 6 | UX | Grocery: Build list for the week | 29 items; curry leaves (8 meals), drumstick, tamarind, coconut, coconut water, sambar powder, hing are listed with no "hard to find near you" flag or alternative. Generic "Other" bucket holds spices, tamarind, curry leaves, cashews, sugar. Coconut oil is not listed (no dish uses it), which is itself unrealistic for Kerala cooking; a Kerala sambar or avial needs it. | Add "may be hard to find" chips and a "where in Delhi" hint (INA Market, Lajpat, Kerala stores, online). Add coconut oil to Kerala dishes. |
| 7 | UX | Taste cards | 6 of 8 not his cuisine (kosha mangsho, misal pav, sattu, fruit chaat); kosha mangsho (Hot, 70 min) offered to a basic kitchen. | Weight cards by stated cuisines; cap time for basic. |
| 8 | UX | Ask "no curry leaves substitute" | Parsed as the word "leaves"; returns curd rice and Amritsari chole. | Recognise "substitute for X"; answer plainly. |
| 9 | CONTENT-GAP | Cook stew appam | Steps are generic (4 steps: "Gather the ingredients: ..."), with no mention of batter, fermenting, or using a tawa for appam on a single plate. | Per-dish steps and a "no appachatti? use a small kadai/tawa or buy readymade appam/idiyappam/parotta" note. |
| 10 | CONTENT-GAP | Profile | No Kerala/Malayali dishes named; Cuisine chips: Gujarati...Mumbai street, with **no "Kerala"** chip. Karnataka present, Kerala absent, so how did I set it? (Only by seed.) A real Anil cannot pick Kerala in Profile. | Add Kerala, Tamil, Andhra, Goan, Assamese chips. |
| 11 | CONTENT-GAP | Profile "No beef" | Present as a rule, good. But no matching beef dishes, so a "no beef" rule exists with nothing to exclude, and the beef-eating Anil has no beef. | See #1/#3. |

## Delights
- "A taste you grew up with" wording on Today and Ask cards: warm, not jargon.
- Wish "appam stew" understood and accepted, with sensible close alternatives (pongal, khichdi).
- Honest "does not know this dish, cannot check it against your rules" for unknown wishes, with no fake green tick.
- Plan reuses rasam rice as dinner then lunch ("cook once, eat twice"), apt for a one-plate PG.
- No Hindi-belt default: Fri/Sat plan lean on sambar rice and kootu.

## Missing
- Kerala in the cuisine chip list; Malayalam names or language.
- Ingredient substitutes and "hard to find in Delhi" hints; coconut oil and kokum/kodampuli.
- Non-veg Kerala coverage (beef, fish, chicken, egg roast); beef-eaters generally.
- Ask: "substitute for X", "how is it made" for unknown dishes; stating clearly when no dish matches (Ask returns three unrelated cards).
- Screenshots in apps/app/persona-shots (p15-*.png); wish-puttu and grocery viewed.
