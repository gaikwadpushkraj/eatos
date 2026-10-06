# Zoya (24, Mumbai foodie influencer) - persona test of EatOS
Setup: omnivore, spice 3, cuisines mumbai/hyderabadi/punjabi, Playwright 390px, clock pinned Wed 2026-10-14 13:00 IST. Screens: / /ask /wishes /taste /plan /grocery /household /profile /integrations /cook. Catalog counted from packages/core/src/india.ts.

## Verdict
1. Her three cuisines work well (Mumbai/Hyderabadi/Punjabi dishes lead, "A taste you grew up with"), and tone is never preachy about health. That part feels like her food.
2. The novelty promise fails: Ask silently ignores "Goan", "Assamese", "Korean", "Italian", "Chinese", "something new", "surprise me" and returns the identical 3 cards (Keema pav, Mirchi ka salan, Chicken biryani) with no "I did not understand". The catalog is 112 dishes, 16 cuisine tags, and the plan cycles about 10 dishes a week.
3. Nothing is shareable and nothing is photo-worthy: no share on a dish, no image anywhere. She would use it once to check, then leave.

## Expectations scorecard
| Expectation | Result | Evidence |
|---|---|---|
| Variety / not the same 3 cards | NOT MET | 25 Ask phrasings -> 21 distinct dish names, but 13 of 25 returned Mirchi ka salan and 14 returned Chicken biryani, always the same trio for any unknown phrase. Plan Wed-Tue: 10 distinct dishes, Keema pav, Mirchi ka salan, Murmura bhel each 3x; plan says "6 cooked in batches" |
| Surprise me / Choose for me | PARTLY | "Choose for me" button exists and tags one card "Chosen for you" - but it only picks among the same 3. "surprise me" typed = same trio as "dinner idea". After taste cards the pick was Egg bhurji / Aloo paratha / Veg biryani (Veg biryani 3 of 6 runs). Not random, no real surprise |
| Regional exploration | NOT MET | Goan, Assamese, Korean, Italian, Chinese, "never tried", "rolls", "dessert", "photogenic" all ignored silently (no chip of what was understood). Kerala returned Veg stew with appam + Keema pav. Catalog cuisines: pan-indian 18, south-indian 17, north-indian 17, punjabi 11, bengali 11, hyderabadi 10, maharashtrian 7, mumbai 6, gujarati 6, kerala 2, karnataka 2, rajasthani 1, northeast 1, kolkata 1, bihari 1, andhra 1. No Goan/Assamese/Korean/Chinese/Italian cuisine at all (only a "Basil pasta, nut-free") |
| Understands dish names / cuisines | PARTLY | Works for biryani, pav bhaji, Hyderabadi, Bengali fish (Macher jhol, Fish curry), chaat, "street food" (Pav bhaji, Misal pav), "pasta". "vada pav" in Ask returns Egg bhurji with pav + Pav bhaji with no hint that vada pav is unknown; Wishes does say "EatOS does not know this dish yet" |
| Street-food culture respected | PARTLY | Misal pav, pav bhaji, Egg bhurji pav, Keema pav present, copy neutral. But no vada pav, pani puri, sev puri, Bombay sandwich, dabeli, ragda pattice, frankie - only 6 "mumbai" dishes. Street food is cooked at home with "Missing: ..." lists, never "where to eat" |
| Shareable pick | NOT MET | No share on Ask cards, Cook, Plan or Today. Share exists only on /grocery (IconBtn "Share list"). No image, no card, no deep link |
| No health lecture | MET | Today/Ask/Plan/Taste copy has no scolding. Only mild: Today shows "Hydration 0.0 / 2.5 L, Protein 0 / 68 g, Fibre 0 / 30 g" bars and Profile "Safety floor ... 1200 kcal". Nothing moralises about biryani or street food |
| Taste cards for a foodie | PARTLY | 8 cards: Egg bhurji pav, Veg biryani, Aloo paratha, Fruit chaat with sendha namak, Idli sambar, Misal pav, Kosha mangsho luchi, Mango curd cup. Fun mix, but plain text only (no photo), 8 then done ("Thanks, EatOS knows you better"), no "show me more". Fruit chaat and Mango curd cup are filler for her |
| Delivery / menu import | NOT MET (for her) | /integrations "Food delivery" = "Paste a menu as JSON" + "Try a sample". No Swiggy/Zomato link or share text, no order history, no restaurant lens. Earlier-round finding still stands |

## Findings
| Sev | What I did | What I saw | Suggested fix |
|---|---|---|---|
| UX | Ask: "something Goan", "Korean", "Italian", "Chinese", "Assamese", "something I have never tried", "surprise me" | Identical 3 cards (Keema pav / Mirchi ka salan / Chicken biryani) headed "3 options that fit right now." No acknowledgement the word was ignored | Show what was understood ("No Goan dishes yet - closest: ..."), and for unknown cuisines say so plainly; log as a request |
| CONTENT-GAP | Counted catalog | 112 dishes (+33 in catalog.ts), 16 cuisine tags, 6 Mumbai, 1 northeast, 0 Goan, 0 Chinese/Indo-Chinese, 0 Korean, 0 Italian cuisine | Add Goan (vindaloo, xacuti, sorpotel, prawn recheado), Assamese (khar, masor tenga), Indo-Chinese (hakka noodles, manchurian), 15+ Mumbai street dishes, and global comfort dishes |
| BUG | Ask "something new" / "never tried" | Returns her top-3 grew-up dishes, the opposite of novelty | Add a novelty mode: rank dishes outside chosen cuisines and not yet logged; label "New to you" |
| BUG | "Choose for me" x6 on "surprise me" | Picks only from the 3 shown; Veg biryani 3 of 6 runs; no randomness and no reason shown | Real "Surprise me" button drawing from top ~20 fitting dishes with a seed that avoids last 7 days |
| UX | Plan Wed-Tue | 10 distinct dishes over the week (Keema pav, Mirchi ka salan, Murmura bhel 3x each) | Add variety penalty across the week so each dish is at most 1-2x, cuisine rotation |
| UX | Looked for share on dish/cook/plan | Only grocery list has share | Add "Share this pick" (text + image card: dish, cuisine, time) on Ask card and Cook |
| UX | Taste cards | No photos, 8 only, filler like Fruit chaat; no "keep going" | Allow unlimited deck, prefer cuisines she has not rated; add pictures |
| UX | Ask "vada pav" | Not in catalog; Ask silently gives Egg bhurji with pav + Pav bhaji; Wishes says unknown dish honestly | Same honesty in Ask; add vada pav |
| CONTENT-GAP | Profile cuisines | Chips: Gujarati, Punjabi, North Indian, South Indian, Maharashtrian, Bengali, Hyderabadi, Rajasthani, Karnataka, Mumbai street (no Goan, Kerala, Assamese, Chinese, Kashmiri, etc., though dishes tagged kerala/andhra exist) | Match chips to catalog, add "Explore other cuisines" |
| UX | Today /ask cards | Every card says "A taste you grew up with" even for Chicken biryani, and "Missing: ..." lists 6-8 raw items. For a foodie who eats out, no "order it / where" | Vary reasons ("New this week", "Hyderabadi, your favourite"); offer "find it near me" |
| UX | Integrations | Menu paste only as JSON (earlier rounds: pound sign prices) | Accept pasted Swiggy/Zomato text |

## Delights
- Regional naming is real and respectful: Nihari with roti, Kosha mangsho with luchi, Mirchi ka salan, Seviyan, Misal pav.
- Her cuisines show up as genuinely top-ranked; Bengali fish query finds Macher jhol and Fish curry correctly.
- No judgement, no calorie scolds, clean 390px layout, no console errors, fast.
- Wishes is honest about unknown dishes ("does not know this dish yet").

## Missing
- A discovery mode ("New to you", "A cuisine you have not tried"), cuisine browse list, trending/seasonal picks.
- Share a pick, saved favourites, a "my cooking log" she can post from.
- Photos or visual cards; restaurant and street-food "where to eat" lens; Swiggy/Zomato order import.
- Honest "did not understand" chips on Ask for cuisine words the catalog lacks.
