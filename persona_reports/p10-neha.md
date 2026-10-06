# EatOS as Neha (34, Pune working mother; Aarav 3 mild, Diya 8 no nuts/peanuts, Rohan omnivore)

Driven via persona-kit at 390x844, clock Wed 14 Oct 2026 19:00 IST. Household seeded by member.added events (Neha veg, kids veg, Diya nuts+peanuts, Rohan omnivore). No JS errors. Source untouched. Screenshots: persona-shots/p10_*.png (household, ask, pasta cook looked at).

## Verdict
- Allergen layer is solid for Diya: nothing with nuts or peanuts is ever surfaced (Ask, plan, grocery all clean) and chikki, muesli, makhana kheer, pesto wishes are blocked with a household reason.
- Child safety beyond allergies does not exist: popcorn is offered "Works for everyone at home" with a 3-year-old, roasted chana is a top snack pick, and no choking or toddler spice guidance appears anywhere.
- As a family planner it is too thin: lunchbox Ask returns coconut water/banana, the week is cold poha/sandwich/kachumber on loop, and a "nut free lunchbox" query gets a pasta with sunflower seeds.

## Expectations scorecard
| Expectation | Rating | Evidence |
|---|---|---|
| Lunchbox ideas, nut-free, school-safe | NOT MET | "tiffin for school": Coconut water, Banana, Roasted chana (0-1 min, 1 g protein; not tiffin food). "kids lunch" is better: poha with curd, paneer sandwich, kachumber (but cold, leaky, no "packs well" notion). "nut free lunchbox": Basil pasta nut-free (dinner, 15 min, sunflower seeds, matched on words "nut"/"free"), idli, veg poha peanut-free. |
| Nut/peanut-free guarantee for everything shown | MET (known dishes) / PARTLY | Ask, plan (7 days), grocery list (no almonds/peanuts once Diya added; before Diya, plan had "Curd with fruit and nuts", Dahi chivda, 3x almonds, 3x peanuts), cook pages all clean. Unknown dishes: "almond halwa" says "EatOS does not know this dish yet, cannot check" although the word "almond" is a nut; "peanut butter sandwich" same. Honest, but a nut keyword check is trivial. No school-label/cross-contact/"may contain" text anywhere. |
| Choking hazards for a 3-year-old | NOT MET | Zero choke/toddler logic in core (grep). Ask "popcorn snack for kids" -> Popcorn best fit, "No common allergens", Aarav "Fits". Roasted chana, whole-grape wish ("not known"), chivda, makhana etc. all unmarked. "Under 18" is one bucket; no age. |
| Nothing too spicy for a 3-year-old | PARTLY | "Prefers mild food" toggle on Aarav, shows "Mild" chip; picks look mild. Cook pages show green chilli in ingredients (paneer sandwich) with no "leave out for Aarav". Wish "hot spicy mirchi bhajiya": unknown dish, no spice caution. Spice is per-dish but never says "reduce chilli for the small one". |
| Picky eaters: dislikes per child, "never" | NOT MET | Add-someone form (and member data) has diet/allergen/rule/health/mild only; no dislikes field in UI. Taste cards ("Never for me", "removes a dish for a year") live in Profile for Neha only; no per-child taste. |
| One meal for the whole table | MET | Household "Who each dinner works for" lists per-person yes/no with reasons ("not vegetarian"), tonight's shared dinner with 4 "Fits" chips, "Works for everyone" on cards. Rajma chawal pick -> "Works for everyone". |
| Conflict resolution | PARTLY | Rohan omnivore vs rest veg: biryani/curry rows show reasons, but picking "Chicken biryani with raita" gave no visible result in my run (page unchanged; Rajma did show). Wish flow says "Cook it on a day when the others eat out" for chikki: reasonable, no "veg base + chicken on the side" for Rohan. |
| Weekly plan quality, repetition | PARTLY | Dinners: poha with curd (3x), paneer sandwich (3x), egg noodles (2x), kachumber (2x), chana chaat (2x). Breakfast cycles sattu sharbat / banana-oats shake / yogurt bowl. Only 6 distinct dinners; no dal, roti-sabzi, khichdi, paratha. "Cook once, eat twice" is nice. |
| Grocery list sanity | PARTLY | 28 items, grouped by aisle, "N meals" counts. But "Water" as an item (3 meals), "Curd 5 meals", "Instant noodles", no quantities for a family of 4; "Other" bucket holds black salt, curd, cumin, coconut water. |
| Quick weekday dinners, 19:00 with kids | PARTLY | Everything is 5-8 min, hero says "Ready in 5 min. Works for everyone at home". But dinners are cold/assembled; a hot family dinner (khichdi, dal-rice, paratha) never appears; Today at 19:00 shows "NEXT UP DINNER 19:30" (cold poha). |

## Findings
| # | Sev | What I did | What I saw | Suggested fix |
|---|-----|-----------|-----------|---------------|
| 1 | SAFETY-BLOCKER | Ask "popcorn snack for kids", household has Aarav (3, Under 18) | Popcorn is Best fit, "Works for everyone", cook page says "No common allergens", Fits for Aarav. Also Roasted chana (hard, choking under 5) is a standard top snack for "kids"/"3 year old". | Add `choking` tag (popcorn, whole nuts/seeds, roasted chana, whole grapes, hard raw carrot, chivda) and an age field; for under-5 hide or show "cut/mash or skip, not for under 5". Show "Check: Aarav" chip rather than Fits. |
| 2 | SAFETY-BLOCKER | Same, "Under 18" toggle only | No age anywhere (3 vs 8 vs 16 are one bucket). Toddler needs differ (honey under 1, choking under 4-5, spice, salt). | Replace "Under 18" with age or age band; wire to choking/honey/spice rules. |
| 3 | BUG | Ask "nut free lunchbox" | Top result "Basil pasta, nut-free" matched words "nut"/"free"; it is a dinner, contains sunflower seeds (seed allergy risk) and parmesan; idli with coconut chutney (coconut is a tree nut for some labelling). | Don't rank on "nut"/"free" as dish words; treat "nut free" as a hard filter and slot to lunch; flag seeds/coconut as "check with school". |
| 4 | CONTENT-GAP | Ask "tiffin for school" | Coconut water, banana, roasted chana. No roti rolls, parathas, idli, cheela, mini sandwiches, veg pulao, dry sabzi, fruit box. | Add `tiffin` tag (packs well, eats cold, dry, no refrigeration, leak-free) and 15-20 dishes; "tiffin" intent. |
| 5 | BUG | Ask "something for my 3 year old" | Same generic coconut water/banana/roasted chana; no age awareness; "my 3 year old" not parsed. | Parse child mention; use household minor/mild member, prefer soft, mild, finger foods (khichdi, idli, banana, curd rice, dosa). |
| 6 | CONTENT-GAP | Wishes "almond halwa", "peanut butter sandwich" with Diya in household | "EatOS does not know this dish yet..." with no nut warning. Honest, but a family with a nut ban should get "contains almond: Diya cannot have it" from keywords. | Keyword-scan unknown wishes against members' allergens (almond, cashew, peanut, pista, walnut, nutella...). |
| 7 | UX | Add someone form | Allergen buttons good, "Prefers mild food" good, but no dislikes/"never" field and no per-child taste; "No nuts" doesn't say "includes peanut" (separate buttons; I had to add both). | Add "Won't eat" chips per member (feeds dislikes); make "No nuts" offer to add peanuts and mention school ban/trace. |
| 8 | UX | Household, tapped "Chicken biryani with raita" | Row selected but nothing new rendered (Rajma chawal rendered "Works for everyone"). No "veg base plus chicken on the side for Rohan". | Show a split plan: shared veg dal/rice + Rohan's chicken add-on. |
| 9 | CONTENT-GAP | Plan, 7 days | Only about 6 distinct dinners (poha, sandwich, noodles, kachumber, chana chaat), repeating by day 3; cold dinners; egg noodles (instant noodles, maida) for a veg family; no hot cooked dinner a working mother serves at 19:00. | Broaden dinner pool for households with children; cap repeat at once/week; prefer 15-25 min hot family dinners. |
| 10 | BUG | Plan before Diya existed | Plan had "Curd with fruit and nuts", Dahi chivda, almonds x3, peanuts x3 (then correctly vanished after Diya added). Fine, but profile.set vs member.added ordering matters: members added before profile.set were silently dropped in my first run (test artefact). | none for app; just confirm onboarding adds children before plan is built. |
| 11 | UX | Grocery list | "Water" listed as an item, curd "5 meals" with no quantity, black salt/cumin/coconut water in "Other", no scaling to 4 people. | Drop water; show quantity per household; use Dairy/Spices sections. |
| 12 | UX | Wish "chikki" alternatives | "Close in taste": Jalebi, Veg instant noodles with an egg, Gulab jamun (noodles for a chikki wish; sugar-heavy for kids). | Rank snack-type, tiffin-safe swaps (til-gud ladoo, murmura ladoo, banana chips). |
| 13 | UX | Spice for the 3-year-old | Paneer sandwich lists green chilli with no child note; no "make it mild for Aarav" on cook steps. | Cook page: "For Aarav: skip green chilli" line for mild/minor members. |

## Delights
- Household screen is clear and fast: four cards with "No nuts · always" / "No peanuts · always" chips, and a "TONIGHT · SHARED DINNER" card with Fits per person.
- Block reasons are plain and kind ("Household: Diya cannot eat it", "not vegetarian").
- Pesto wish offers "Basil pasta, nut-free" as a real variant; "Cook once, eat twice" plan notes; every cook page shows an ingredient list I could audit.
- Hidden-nut dishes (chikki, makhana kheer, muesli with almonds, dahi chivda with peanuts) are tagged and never leak to Diya.

## Missing
- Child age, choking guidance, toddler salt/honey/spice notes; "school tiffin" mode (no refrigeration, eat cold, leak-free, nut-free label, "check the school list").
- Per-child dislikes and "never" (kids refusing lauki), "kid-approved" feedback, hidden-veg ideas.
- Hot family dinners (khichdi, dal-chawal, parathas), batch cooking Sunday plan, reuse of leftovers for next-day tiffin.
- Quantities scaled to household; per-person portion hints (Aarav smaller).
- Cross-contact/"may contain traces" advice for packaged items (bread, biscuits, muesli).
