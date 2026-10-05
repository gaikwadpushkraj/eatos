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
