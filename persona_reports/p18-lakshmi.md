# EatOS as Lakshmi (58, Chennai, CKD 3 + hypertension + diabetes)

Driven via persona-kit at 390x844, Wed 14 Oct 2026 (08:00, 13:00, 17:00, 20:00 IST); member vegetarian, conditions kidney/hypertension/diabetes, spice 1, south-indian. No JS errors. Source untouched; scripts deleted; shots in apps/app/persona-shots/p18-*.png.

## Verdict
- Tone is mostly right: the one Profile line "Kidney conditions need limits set for you. Please follow your dietitian's plan." is humble, and no K/P/protein numbers are quoted. Water reminders are gone.
- But the Today screen still shows a Hydration 0/2.5 L tile, a Protein 0/68 g tile and "+ 250 ml water", and Profile goals offer "More protein" and "Stay hydrated". This is the opposite of her ask.
- Ranking only knows `high-potassium` on about 10 patched dishes, so tomato-heavy, spinach, legume and sattu dishes rank freely. The wish flow tells her to "keep the real thing for a weekend meal in a smaller portion", and a "protein shake" wish offers paneer tikka and soya chunks.

## Expectations scorecard
| Expectation | Result | Evidence |
|---|---|---|
| Low potassium nudges | PARTLY | Banana, coconut water: "ranks low rather than ruled out" (good). Tomato, spinach, peas, coconut, legumes not penalised (F4). Today picks all day were fine: oats upma, millet pulao, roasted chana, kootu. |
| Low sodium nudges | MET | "Easy on salt" on kootu/roasted chana. Curd rice with pickle is `high-sodium` and ranks down; pickle wish offers lemon/chutney/makhana. |
| Clear "follow your dietitian" message | PARTLY | Only inside Profile > Health options. Not on Today, Ask or wish cards (F5). |
| No protein-pushing | NOT MET | Protein 0/68 g tile; Ask chip "High protein dinner"; protein shake wish returns paneer/soya; every card shows "N g protein"; Profile goal "More protein" (F1, F2). |
| No water pushing | NOT MET | Hydration 0.0/2.5 L tile and "+ 250 ml water" button on every Today screen (F1). Reminders are paused, which is good. |
| No supplements | PARTLY | "Protein shake" is unknown to the app (honest) but redirects to whole-food protein dishes. No supplement is recommended. |
| Nothing that sounds like a medical plan | PARTLY | "Keep the real thing for a weekend meal in a smaller portion" reads as a portion plan (F3). |
| Humble wording, no numbers | PARTLY | No potassium or phosphorus figures. But 2.5 L and 68 g are displayed targets, which is exactly a fluid and protein number. |

## Findings
| # | Sev | What I did | What I saw | Suggested fix |
|---|-----|-----------|-----------|---------------|
| 1 | SAFETY-BLOCKER | Opened Today at 08/13/17/20h | Tiles "Hydration 0.0 / 2.5 L", "Protein 0 / 68 g", "+ 250 ml water" still shown, unchanged from a healthy adult. A CKD 3 dietitian typically sets a fluid limit; a daily 2.5 L target with an add-water button is the wrong direction. health.ts pauses the checks, but the tiles are still drawn. | With `kidney` hide Hydration and Protein tiles and the quick-water button (or show "Ask your dietitian"). Keep Fibre. Also drop "More protein" and "Stay hydrated" goal chips (or warn) in Profile. |
| 2 | BUG | Ask > "High protein dinner" chip, and typed "high protein dinner" | The chip is offered. Typed query reads "EatOS does not have 'high' yet", then returns kootu 14 g and pulao. Wish "protein shake" returns paneer tikka, soya chunk curry, sprouts, besan chilla under "A version you can have" with ICMR "food over supplements". Every card prints "N g protein". | For kidney: hide that chip, drop `high-protein` boosts, never suggest paneer/soya for protein, and drop protein-gram chips on cards (or honour "Hide numbers" by default). |
| 3 | UX | Wishes: banana, coconut water, sweet, pickle, idli sambar | Card says "Keep the real thing for a weekend meal in a smaller portion, with vegetables and dal or curd alongside." For a kidney patient banana/coconut water this is an implied portion plan. "sweet" returns Sweet lassi and "Have mithai after a meal, in a small portion" (a diabetic and CKD case). Idli sambar says "It conflicts with what you told EatOS about your food." (wrong, she is vegetarian; presumably a tomato/potassium tag). | For kidney: replace with "Please check this with your dietitian." Keep the humble "ranks low". Fix the "conflicts" wording; say which condition. Skip the mithai tip for kidney/diabetes. |
| 4 | CONTENT-GAP | Ask "light lunch", "salty snack"; grocery; plan; tag grep | Chana chaat (tomatoes) is Best fit for "light lunch"; sprouts salad second. Neither is tagged. Plan and grocery: Tomatoes in 6 meals, Spinach (dinner), Peas 7 meals, Coconut 4, Roasted peanuts, Moong sprouts. Plan dinner "Ragi mudde with greens saaru". `high-potassium` exists on about 10 dishes in patches.ts only; tomato, spinach/greens, ragi, legumes, sattu and nuts unmarked. Sattu sharbat ranked 1 for "how much water should I drink". | Tag by ingredient (tomatoes, spinach, greens, potato, banana, coconut, dates, orange, rajma, sweet potato) so every dish inherits it. Stop matching "water"/"drink" to sattu. |
| 5 | UX | Looked for the dietitian message | Only in Profile Health options (3 set). Today/Ask/Plan/Cook show nothing, though she may never open Profile. Her profile's "Health options" collapsed text is bland. | Show a small line once on Today and Ask for kidney: "Follow your dietitian's plan. EatOS only ranks gently." |
| 6 | CONTENT-GAP | Profile cuisines; Ask "tomato rasam" | No Tamil/Chennai-style chips (only South Indian); Chennai is a city chip. "Tomato rasam", "protein shake" unknown. Honest "does not know this dish", but there is no alternative (rasam rice suggested elsewhere). Tomato-free sambar and idli suggestion appear, a good sign. | Add Tamil cuisine chip, rasam, tamarind rasam, sambar variants; list kidney-friendly alternatives (low-K) for unknown dishes. |
| 7 | UX | Fasting card | Navratri/Ekadashi/Ramzan cards on Today for a kidney patient; the note says to check with doctor (good) but the cards are prominent. | Keep, but hide when `kidney`, or move below. |
| 8 | UX | Cooking suggestions | Gentle tag on dishes, but "Best fit" pulao has peas, carrots, beans, raita (curd). Dairy, peas not considered. | Covered by F4. |

## Delights
- "ranks low rather than being ruled out" is humble and honest, not a ban.
- Pickle wish: "A lemon or green chilli wedge gives the tang a pickle does", with roasted chana/makhana/bhel. Real South-Indian craving handled gently.
- Idli sambar wish offers "tomato-free sambar" and coconut chutney, and Today (08:00) gives plain oats upma, "Steadier on blood sugar. A taste you grew up with".
- No water push notifications and no "drink more" text in Ask. Safe-mode-style "Hide numbers" toggle exists in Profile.

## Missing
- A kidney-specific mode: hidden hydration/protein tiles, no protein goal, no gram displays by default.
- Ingredient-level potassium and phosphorus tagging (tomato, spinach, banana, coconut, potato, dates, legumes, dairy, nuts) feeding ranking.
- Tamil/Chennai cuisine content, rasam and tomato-free sambar dishes, and an "ask your dietitian" prompt in Ask and Cook.
