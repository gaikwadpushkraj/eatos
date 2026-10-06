# Persona testing

Eight agents each played one metro-Indian user against the real web build
(`apps/app/scripts/persona-kit.mjs`) and wrote a report in `persona_reports/`.
They do not edit code. Their findings drove Phase 7 fixes, and the same eight
profiles run in `packages/core/test/personas.test.ts` as a permanent safety net:
no hard-rule violation in any month or hour, something to eat at every meal, no
judgemental wording, alternatives that obey every rule.

| Persona | Hardest test | Main finding | Fixed |
|---|---|---|---|
| Priya, Jain, Mumbai | Onion, garlic, roots, fasts | Ekadashi offered pav and peas; sambar listed no onion | Fast deny list widened; sambar corrected; Jain idli added |
| Arjun, prediabetic, Hyderabad | Ranking without banning | Wish matching read "ice" inside "rice"; biryani buried; alternatives not health-filtered | Whole-word matching; alternatives filtered; Hyderabadi dishes added |
| Meenakshi, hypertensive, Chennai | Strict veg, salt, fasts | Unknown South Indian dishes read as approved; Ask ignored dish words | Unknown state; Ask words steer ranking; 15+ dishes added |
| Rahul, gym-goer, Delhi | Oven, protein, supplements | Oven rule never fired; recovery snack was coconut water | Oven tags; recovery needs protein; minimum protein understood |
| Ananya, pregnant, Bengaluru | Pregnancy hazards | Raw sprouts offered ("moong sprouts" slipped past "raw sprouts") | Sprouts blocked; skip-not-ration wording; clinician flags shown |
| Rohit, night shift, Kolkata | Shifted day | No way to set a night routine; water reminders never ran | Night routine chip; scheduler wraps midnight; Bengali dishes added |
| Fatima, insulin, Mumbai | Ramzan gate, halal, household | "rum" matched inside "drumstick"; gate left her with nothing; household soft nudges diluted | Word boundaries; kinder gate copy; Eid dishes and iftar tags; no dilution |
| Kabir, student, no kitchen | No-cook, minor | Only 1 no-cook dinner; a minor's weight-loss wish was waved through | 25+ no-cook dishes; kind refusal for restrictive wishes |

Open items are logged in `docs/DECISIONS.md` (D22, D23).

## Round 2 (roles and expectations in `docs/personas/round2.md`)

| Persona | Hardest test | Main finding | Fixed |
|---|---|---|---|
| Kamla, 72 | Soft food, Hindi, large text | Hard snacks as best fit; no Hindi; small text | Soft-food setting, Hindi UI, larger text, caregiver editing of members |
| Neha, working mother | Nut-free lunchbox, toddler | No choking logic; popcorn "works for everyone" | Child-under-5 condition with choking tags; mild children get no hot dishes |
| Zoya, foodie | Variety | Same three cards; Ask ignored cuisines | Words steer ranking; daily variety; Surprise me; unknown-word note |
| Sid, vegan | Truly vegan | Roasted makhana had ghee; wish words missed dahi, malai | Allergens derived from ingredients; diet-consistency test; vegan swaps |
| Vikram, traveller | Time zones, flights | Fixed IST; no travel guidance | Time-zone card; order-in note |
| Meera, runner | Fuelling | Recovery card stale; no carb idea | Recovery snacks need protein; run words understood |
| Anil, Kerala in Delhi | Taste of home | 2 Kerala dishes | Kerala, Goan, Bihari and more dishes; unknown-wish ideas |
| Riya, coeliac | Hidden gluten | Asafoetida, papad, masalas passed | Wider gluten lexicon; wish words; "not even a little" |
| Imran, nut-allergic child | Allergen certainty | Delivery menus with empty allergens passed; nut words missed for the child | Unverified is not safe; names and notes scanned; household-wide wish checks; likely-nut dishes flagged |
| Lakshmi, CKD | Humble limits | Still pushed water and protein | Hydration and protein paused; dietitian line; potassium tags derived |
| Karan, GERD | Triggers | Tomato and tamarind not demoted | Acidic tag; avoid list per person |
| Pooja, new mother | Tone | "Short sleep" reminder felt tone-deaf; no postpartum foods | Gentler wording; lactation dishes; one-hand and no-cook words |
| Tanmay, cook-challenged | Pantry-driven cooking | Pantry "dal" did not cover toor dal; no hygiene on chicken | Generic names covered; hygiene and doneness on every raw-meat dish |
| Gurpreet, joint family | One meal for six | Plan only dishes everyone eats, so never any meat | Base dish for meat eaters plus a separate dish for the rest |
