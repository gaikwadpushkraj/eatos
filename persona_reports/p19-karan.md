# EatOS as Karan (31, Bengaluru, GERD + IBS, spice 1)

Driven via persona-kit at 390x844, clock Wed 14 Oct 2026 21:30 IST. Seeded omnivore, conditions ['gerd'], spice 1, dinner 22:00. No JS errors. Source untouched; scripts deleted. Shots: persona-shots/p19_{today,taste,profile,plan,grocery,pantry,ask,wish,health,unwell,cook}.png (looked at today).

## Verdict
- Gentle in tone and never medical (profile copy: "never gives medical advice"), and 'gerd' is a real condition: the gentle dishes exist (lauki moong dal soup, Ven pongal, kootu) and "small light dinner" surfaces them.
- But the GERD ranking is crude (only spicy/fried -2, gentle +1): tomato, tamarind, onion-garlic and citrus are not demoted, so his tonight dinner pick is Rasam rice (tomato, tamarind, pepper, garlic) and "small light dinner" lists Tomato soup.
- No way to mark an ingredient or tag as a trigger, no IBS support at all, and no late-dinner nudge: 22:00 dinner passes silently.

## Expectations scorecard
| Expectation | Rating | Evidence |
|---|---|---|
| Gentle, low-acid, small meals | PARTLY | "small light dinner": Lauki moong dal soup (soft), Rasam rice, Tomato soup with bread. "low acid" -> "does not have 'acid' yet" then matches "low" (low-sodium dishes). "acidity" same fallback. |
| Ranking demotes spicy/fried/tomato/citrus/onion-garlic | PARTLY | rules.ts:130 only spicy(-2), fried(-2), gentle(+1). No tomato/citrus/onion/garlic/tamarind/coffee tags considered. Home dinner top pick: Rasam rice (tomato, tamarind, garlic). |
| Mark personal triggers (ingredient/tag) | NOT MET | Taste cards: Yes / Not today / Never for me (whole dish only); per-dish "Not for me". No ingredient or tag trigger in Profile (rules list: Jain...Pork, Halal only; "No onion or garlic" is the sole ingredient rule). |
| Ask "no tomato" exclusion | MET | "no tomato", "without tomato", "no tomato no onion": none of the 3 picks contain tomato (Ven pongal, kootu, Akki roti). |
| Ask exclusion robustness | PARTLY | "dinner without tomato or tamarind" returned Bisi bele bath and Goan fish curry labelled "Matches 'tamarind'" (the exclusion became a match, both contain tamarind). "no onion no garlic" returned Akki roti-style dishes with onion listed in Missing in a sibling query ("no tomato": Akki roti missing: onion). |
| Late-night eating guidance | NOT MET | Dinner 22:00: hero says only "Good evening", plan has dinner at 22:00; no nudge, no shaming (good) but also no "earlier dinner" idea or "small, then wait before lying down". Wind down card "no caffeine" P3 at 22:00 only. |
| IBS (onion/garlic/legumes/wheat/dairy) | NOT MET | No IBS/FODMAP condition. Plan week has Tomatoes 7 meals, Onion 5, Garlic 4, Green chilli 7 in grocery (spice 1 user), many dals/rajma-type. Nothing misleads, but nothing helps. |
| No diagnosis / medical advice | MET | Health section copy: "never works out a condition from what you eat, and never gives medical advice". No askDoctorFlags for gerd (none shown). Wording fine. |
| "I'm unwell" safe mode | MET (mostly) | Hero "GENTLE DINNER ... Gentle on the stomach.", "SAFETY FIRST: Drink 500 ml water", goals paused, easy off-switch. But still Rasam rice (tomato/tamarind) as "gentle"; water-first for nausea/reflux is not tailored. |
| Smaller portions in Ask | PARTLY | "light and small" -> Jeera ajwain saunf water (0 g protein, a drink as "best fit" for a dinner), Lauki soup, Rasam rice. No portion size shown or controllable. |
| Tea/coffee honesty | PARTLY | "tea" -> Masala chai with biscuits (fine) but also Amritsari chole kulcha "Matches 'tea'" (tea leaves in ingredients). "coffee" -> not in catalogue, fallback picks. Wish tea/coffee: "does not know this dish yet, so it cannot check it" with no caffeine/acid note. |

## Findings
| # | Sev | What I did | What I saw | Suggested fix |
|---|-----|-----------|-----------|---------------|
| 1 | UX | Today and Ask "dinner" with gerd | Top pick Rasam rice with beans poriyal (tomato, tamarind, pepper, garlic); same on "I have acidity", "Tomato soup with bread" under "small light dinner". | Add gerd penalties for tomato-heavy, tamarind/citrus, raw onion-garlic, coffee, and +1 for lauki/oat/banana/idli; push reason "Mild on the stomach". |
| 2 | CONTENT-GAP | Looked for ingredient/tag triggers in Profile and Taste | Only whole-dish "Never"/"Not for me". Cannot say "tomato", "tea", "fried", "onion" once. | Profile "Foods that bother me" chips (ingredient + tag), applied as soft demote (or hide) with "Why not shown" note; also let Ask "no X" be remembered ("Always avoid tomato?"). |
| 3 | BUG | Ask "dinner without tomato or tamarind" | "tamarind" treated as a positive match ("Matches 'tamarind'"); both picks contain tamarind. Multi-item "or" negation fails (single "no tomato" works). | Parse "without A or B" / "no A, B" as exclusions for all items. |
| 4 | BUG | Ask "low acid" / "acidity" | "low" matched low-sodium dishes ("Matches 'low'"); Egg white bhurji and cauliflower sabzi with onion-garlic as low-acid picks. | Add alias acidity/reflux/heartburn/low acid -> gentle + non-tomato/non-citrus filter; never match on "low" alone. |
| 5 | UX | Dinner at 22:00 | No timing note at all. Nothing about an earlier or lighter dinner, nothing about staying upright afterwards. | Kind one-liner for gerd when dinner after ~21:00: "A lighter dinner, and a couple of hours before lying down, often sits easier." Optional, dismissible, no scolding. Offer "Make dinner a bit earlier" nudge in routine. |
| 6 | CONTENT-GAP | IBS | No IBS/FODMAP option; grocery shows onion/garlic/tomato/legumes each in many meals. | Add 'ibs' condition (soft: demote onion-garlic heavy, large legumes; hing/ginger/curd-free, rice-based tags); phrase as "some people find...". |
| 7 | UX | Ask "small light dinner" | Result gives no portion cue; "light and small" best fit is a spice water (0 g protein). | Add "small portion" tag and Smaller portion label; skip drinks as dinner "best fit". |
| 8 | UX | Wish tea / coffee | "Does not know this dish yet... pick something from the list below" with no list; coffee not in catalogue. | Add tea/coffee/chai variants with caffeine note; fix dead "list below" copy. |
| 9 | UX | Today hero, normal mode | The subtitle under dish name is a lone "." (seen in screenshot) where a reason belongs. | Hide empty reason or fill it (healthFit reason). |
| 10 | UX | Plan/Grocery week at spice 1 | Green chilli 7 meals, tomatoes 7 meals, tamarind 5; plan not tuned for gerd. | Apply gerd weighting in planner too; show "swap" for trigger-heavy days. |
| 11 | BUG | /cook/rasam-rice-with-beans-poriyal | "That recipe was not found." (slug guess; may just be wrong id, not verified via UI). | Check the cook route id format. |

## Delights
- Kind, non-diagnostic copy throughout; no shaming of the late dinner or the condition.
- "no tomato" in Ask works and the picks are plausible (Ven pongal, kootu).
- GERD-gentle dishes exist in the catalogue (Lauki dal phulka, oat-banana porridge, idli with mild chutney) and "Jeera ajwain saunf water" is a nice touch.
- Safe mode copy "Gentle on the stomach" and fluids-first is calm.

## Missing
- Personal trigger list (ingredient and tag), applied everywhere with a visible "because you avoid tomato".
- Meal-timing nudge for late dinners; "small portion" concept; IBS/low-FODMAP mode; reflux-aware tea/coffee guidance; gerd penalties for tomato/tamarind/citrus/onion-garlic.
