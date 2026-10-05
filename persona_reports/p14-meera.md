# EatOS as Meera (33, Pune marathon runner, vegetarian/eggetarian, performance + more-protein, 55 kg)

Driven via persona-kit at 390x844, clock pinned to Wed 14 Oct 2026 (05:00, 09:30, 09:50, 16:00 IST). Seeded 6 days of training plus a 120 min high-intensity run. No JS errors. Source untouched; scripts deleted.

## Verdict
- Water scaling is right (1.8 L to 2.8 L after a 2 h run, the 500 ml/h rule) and the 05:00 pre-run Today pick (sattu sharbat) is a lovely, on-persona touch.
- Everywhere else it fails an endurance athlete: no recovery card appears after the run, Ask's "Best fit" after a 2 h run is a fried samosa, and there is no concept of carbs, sodium or race-week; "carb loading dinner" returns instant noodles / paneer rolls ranked by nothing carb-related.
- Honest on supplements and caffeine-by-silence (no pushing), but the free-text Ask is blind to the words a runner uses (pre-run, long run, chaas, coffee, ORS, curd rice).

## Expectations scorecard
| Expectation | Result | Evidence |
|---|---|---|
| Pre-run fuelling | PARTLY | 05:00 Today hero: "Sattu sharbat", light, 3 min (good). Ask "pre-run breakfast" at 05:00: sattu sharbat, fruit chaat, boiled eggs. At 09:30 the same ask gives egg bhurji with pav, besan chilla, pesarattu (no "pre"). Banana is only found if the word is typed. |
| Post-run fuelling | NOT MET | Workout 09:00/09:15, viewed 09:30/09:50: hero is still the stale "Breakfast 08:00, Egg bhurji with pav"; no recovery card in "Coming up"; no "Plan adjusted" notice. Ask "what to eat after a long run": Samosa (fried) Best fit, instant noodles, egg bhurji. |
| Long-run fuelling | NOT MET | "I have a long run tomorrow" returns the same default 3 as any query. No "night before / during run / gels" concept. |
| Carbs for endurance | NOT MET | App is protein-first: Protein target rises to 86 g (1.56 g/kg, fine), no carb target or carb chip anywhere on Today. Dishes show "g protein" only. |
| Indian foods: banana, poha, idli, dates, chaas, coconut water, sattu, curd rice | PARTLY | All exist (banana, dates, coconut water, sattu sharbat, idli sambar, vegetable poha at /cook/poha). Typed by name they match ("banana" gives Banana, Dates, Fruit chaat). "chaas" does NOT return chaas (shows samosa/noodles); "curd rice" returns Vegetable biryani with raita and Dahi chivda (a curd-rice dish exists in the catalog per the earlier Rahul report, but isn't matched). |
| Hydration target moves with training | MET | 05:00 1.8 L; after 120 min high: 2.8 L (+1.0 L = 500 ml/h, matches health.ts). Reminders go 350 ml to 550 ml per drink. Plausible for 55 kg. But hydration is plain water only. |
| Electrolytes after 2 h | NOT MET | Nothing mentions sodium/salt. "electrolyte drink ORS" returns sattu sharbat (with black salt, by luck) as Best fit, then samosa. Coconut water is only shown at 05:00 and 16:00-free runs, never post-run. |
| Recovery snack timing + protein | NOT MET | Scheduler adds "Recovery snack" at workout+30 min but suppresses it if any priority-1 meal is within 90 min, and the hero never promotes it. Even when shown elsewhere, "Samosa" snack ("Treat") sits at 17:00 for a 16:00 view. |
| No supplement pushing | MET | Wish "whey protein": "ICMR-NIN 2024 advises food over protein supplements", with paneer/soya/sprouts alternatives. Nothing pushes powders or gels anywhere. |
| Caffeine honesty | PARTLY | No caffeine content anywhere. Ask "coffee before my run" and "something with caffeine" ignore the words and return the default list. Only mention is the "Wind down, no caffeine" routine task. Wish "coffee": "does not know this dish". |
| Respects egg (vegetarian allows egg) | MET | Egg bhurji, noodles with an egg, boiled eggs appear; no meat/fish seen. Plan has eggs 6x in grocery. |
| Recovery vs post-workout hero duplication | NOT MET | No duplication, but the opposite: the recovery task is never the hero (see post-run). Hero + "Coming up" show Lunch 13:00 and water only. |
| Race-week / carb-loading ask | NOT MET | "carb loading dinner before marathon": Veg instant noodles with an egg (Best fit), Paneer kathi roll, Paneer bhurji with roti (22 and 28 g protein). At 05:00 it returned Kachumber, chana chaat, sprouts salad (low carb, "cold/cooling"). |
| Rest-day suggestions | PARTLY | "rest day lunch" is parsed as nothing special (kachumber, chana chaat, sprouts salad at 05:00). No rest-day concept; targets simply drop to 1.8 L / 66 g. |

## Findings
| # | Sev | What I did | What I saw | Suggested fix |
|---|-----|-----------|-----------|---------------|
| 1 | BUG | 120 min high run at 09:00, opened Today at 09:30 and 09:50 | Hero stays on stale "Breakfast 08:00 Egg bhurji with pav, Start cooking"; recovery snack task not visible. scheduler.ts:185-205 drops recovery when any P1 meal is within 90 min of workout+30 and never marks missed breakfast. Hydration/protein targets did update. | Hero should pick recovery (need=recovery) when a workout finished within 2 h and nothing eaten since; retire past un-eaten slots. |
| 2 | BUG | Ask "what to eat after a long run" | Samosa with chutney, "fried", Best fit; noodles second. ask.ts only maps "protein/workout/gym" to need=protein, never "run/long run/post-run/recovery". | Map run/marathon/post-run/recover to need=recovery (protein 10+ g and carbs); penalise "fried". |
| 3 | CONTENT-GAP | Looked for carb info on Today/Ask/Cook | No carb target, no carbs per dish; protein only. Endurance athlete needs 6-10 g/kg on long days. | Add carbs to nutrients; with goal performance show a carb chip and weight need=carb for long/high sessions. |
| 4 | CONTENT-GAP | Ask "carb loading dinner before marathon" (05:00 and 09:30) | Results swing between salads and instant noodles; no phrase handling; no race-week plan. | Add a carb-load intent (rice/khichdi, idli, poha, pasta-style, roti+dal, potato; low fibre, low fat) and a "race day -2/-1" plan template. |
| 5 | CONTENT-GAP | Searched electrolytes/ORS/sodium | No electrolyte item, no sodium/salt guidance; hydration is "drink 550 ml water" only. After 2 h high, nikanji/chaas with salt, coconut water, ORS-style lemon-salt-sugar are the Indian answer. | Add nimbu pani with salt+sugar, chaas, coconut water as recovery drinks; after >=90 min add a sodium note to the hydration reminder. |
| 6 | BUG | Ask "chaas" and "curd rice" | Chaas is not matched (Samosa/noodles shown); curd rice gives Vegetable biryani with raita and Dahi chivda. | Add aliases (chaas/buttermilk/mattha, thayir sadam/dahi bhaat) and rank exact name hits first. |
| 7 | UX | Ask "pre-run breakfast", "I have a long run tomorrow", "coffee before my run" | Free text keywords ignored; identical default list for the last two. At 05:00 the answer is good, at 09:30 the same query returns heavy egg bhurji/besan chilla. | Add pre-run (light, low fibre, 30-90 min before) and "tomorrow" handling. |
| 8 | CONTENT-GAP | Caffeine | No caffeine data or advice; Wish "coffee" is "not known". A runner wants timing guidance (30-60 min pre-run, not late evening). | Add tea/coffee dishes with caffeine tag; wire routine "no caffeine" wind-down to them. |
| 9 | UX | 16:00 view after the morning run (recovery done) | Today's next meal: "Snack 17:00 Samosa with chutney, tagged Treat". A 2 h-run day with performance goal gets a samosa; plan for the week is samosa, pav, instant noodles, noodles with egg. | Weight snack toward banana + curd/chana/lassi on high-load days; goal performance should demote fried snacks. |
| 10 | UX | "Hydration 0.0 / 2.8 L" | Only "+ 250 ml water" and "I worked out" buttons; no ml for coconut water/chaas log. "I worked out" has no intensity or duration prompts on Today (not exercised). | Let drink dishes count toward hydration; ask duration + intensity when logging a workout. |
| 11 | UX | Wish "banana poha", "energy gel" | "EatOS does not know this dish yet, so it cannot check it against your rules": honest, but offers nothing else (no alternatives shown). | For unknown wishes show food-first alternatives in the same category (banana, dates, poha). |
| 12 | CONTENT-GAP | Cook screen for poha | Generic steps ("Gather the ingredients..."), no ingredient-timing tips, no "eat 60-90 min before a run". | Add a run-timing tag per dish. |

## Delights
- Pre-run 05:00 hero "Sattu sharbat, light for this hour, 3 min" is exactly right for a Pune runner, with 12 g protein.
- Hydration target scales honestly by duration: 1.8 L to 2.8 L, drink reminders rise from 350 to 550 ml.
- Whey wish answered with an ICMR-NIN "food over protein supplements" line and paneer/soya/sprouts alternatives; nothing sells her a product.
- Egg dishes appear naturally for a vegetarian-with-egg diet; no meat leaks.

## Missing
- A training mode: long-run day, race week, taper, carb-load, rest day.
- Carb numbers, sodium/electrolyte guidance, gel-free in-run fuelling (dates, banana, salted chikki).
- Recovery window ("within 30-60 min: ~20 g protein + carbs") as the Today hero.
- Caffeine awareness and cutoff.
- Meal-timing relative to run start (pre-run 60-90 min, last meal night before).
