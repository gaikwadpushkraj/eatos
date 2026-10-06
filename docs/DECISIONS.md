# Decisions and educated guesses

When a choice needed the owner's input, EatOS made a calculated guess, wrote
it here and moved on. Each one can be reversed; the "Check" column says what
would settle it. Phase 7 guesses come from `docs/research/` (evidence there is
mostly snippet-level, so numbers are directional).

| # | Decision | Why (the guess) | Check |
|---|---|---|---|
| D1 | Merge PR #48 (Quick Add, Photo Add) without waiting for a further reply | "Do it" was explicit | none |
| D2 | Scope "metro Indian resident" = Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata, Pune; English UI, Indian dish names | The brief says metropolitan global Indian city resident | Add Hindi and regional-language UI later |
| D3 | "Vegetarian" in the app means no meat or fish, **eggs allowed**; "No egg" is a separate rule | Western usage in the existing type; many Indians who say "veg" also exclude egg, so the rule chip is one tap | Ask a sample of users which default they expect |
| D4 | Declared health conditions only rank food lower or higher (soft). Only allergies, coeliac, religious or household rules, pregnancy hazards and fast gates are hard | Research: hard rules for unambiguous harm, soft for everything else; avoids banning foods | Clinician review of the pregnancy hazard list |
| D5 | EatOS never infers a condition, never states a diagnosis, never gives doses, and refuses to plan fasts for insulin, pregnancy, minors and eating-disorder history | Safety and regulation (CDSCO software-as-medical-device risk) | Legal review before store release |
| D6 | Jain rule = no onion, garlic, potato, carrot, radish, beetroot, turnip, ginger, yam, mushroom, honey, egg, meat | Common default; households differ (some allow ginger, some avoid fermented foods or night eating) | Make the deny list editable per household |
| D7 | Navratri and Ekadashi deny grains, pulses, onion, garlic, egg and meat, except samak rice, kuttu, rajgira, sabudana, singhara, makhana | Common vrat rules from recipe and news sources; regional variation is large (some skip potato or curd) | Editable fasting lists |
| D8 | Ramzan removes lunch; iftar and suhoor logic is not modelled yet | Sunset and dawn times need location and date | Add sunrise/sunset times by city |
| D9 | Season by month: summer Mar-May, monsoon Jun-Sep, post-monsoon Oct-Nov, winter Dec-Feb; monsoon lowers raw and street food, summer favours cooling and watery dishes | Typical Indian pattern; weak evidence (food-safety guidance only) | Per-city calendars and IMD data |
| D10 | Nutrient numbers in the dish catalogue are rounded estimates, never shown as medical data; GI is stored as a tag band (low-gi, high-gi) | IFCT 2017 was not accessible; GI studies conflict | Verify against IFCT 2017 tables and bundle with licence |
| D11 | The taste profile learns from tags, cuisine and spice with shrinkage, not from images | Research found no validated way to compare Indian food images; hand-built features are inspectable and offline | A/B test weights with real users |
| D12 | The scoring weights are a hand-tuned linear score, shown to users as plain reasons | No source validates a fusion rule | Replay logs once real usage exists |
| D13 | Budget and price are not modelled | No price source; prices swing (tomato, onion) | Optional price feed or manual flag |
| D14 | A kitchen setting (full, basic, none) is one profile switch; "none" allows only dishes tagged no-cook | PG and hostel life is common in metros | Add a kettle/microwave level |
| D15 | Group meals average soft health nudges across everyone eating; hard rules apply per person | Simple and predictable | Review with household personas |
| D16 | Persona agents test through the real web build with a seeded profile, not the live Pages site | Deterministic, no network, same code | Re-run after each release |
| D17 | Alternatives and taste cards are filtered to dishes safe for everyone in the household, not only the person asking | A suggestion that another member cannot eat is a safety miss | Option to show per-person versions |
| D18 | A health nudge is never diluted by household size; positive fits are shared | Persona test: dilution made an insulin user's penalty vanish | Review with real households |
| D19 | Wishes EatOS does not know are labelled unknown, never "nothing in the way"; obvious rule breaks in the typed words (meat for a vegetarian) are still caught | Persona tests: unknown dishes read as approval | A larger dish catalogue and ingredient inference |
| D20 | Skipping meals, crash dieting and fast weight loss get a kind refusal for everyone; no calories by default | Research on tracking harms; a minor tried it in testing | Clinician review of wording |
| D21 | Night routines are supported by wrapping times before waking into the next morning; the day still turns over at midnight | Cheapest change that keeps water and meals sensible; a true "day from wake" model is bigger | Day anchored to wake time |
| D22 | A kettle or microwave level now sits between basic and no kitchen; it allows no-cook dishes plus the few tagged kettle (instant noodles, boiled eggs) | Persona testing of hostels | More kettle dishes |
| D23 | Not built: price and budget, regional-language UI, cook-page method steps for new dishes, Quick Add receipt gaps (egg counts, dahi, chips) | Out of reach in this pass; listed by the personas | Next phase |
| D24 | Round 2 added 14 more personas (docs/personas/round2.md) and six expert reviewers (dietitian, chef, UX writer and Hindi localiser, security and privacy, regional scholar, behavioural scientist); their reports are in expert_reports and persona_reports | The brief asked for more roles, expectations and experts | Re-run after each release |
| D25 | Allergens are derived from ingredient lists as well as declared, so a dish can never list ghee and forget dairy; hing counts as gluten unless known to be gluten-free | Dietitian review; coeliac safety | Per-brand hing data |
| D26 | The API sends no CORS header unless EATOS_CORS_ORIGIN is set, binds to 127.0.0.1 in Docker compose, caps the users it creates, and caps ask text | Security review (open `*` CORS, no auth, ReDoS, key-derivation DoS) | Real authentication for hosted sync |
| D27 | Hindi UI lookup is by exact English string with English fallback; kernel reason strings are only partly translated | Expert dictionary of 569 strings; kernel should move to reason codes | Reason codes, then Marathi, Bengali, Tamil, Telugu, Kannada |
| D28 | A fast does not refuse diabetes alone (no way to know about medicines): it adds a "check with your doctor" note; insulin, pregnancy, under 18 and eating-disorder history are refused | Balance between safety and respect | Clinician review |
| D29 | Some agents hit the session usage limit and were re-run after it reset; the regional dish author was not re-run (its overlap with the scholar's list was dropped) | Session usage limit | Re-run when credit returns |
| D30 | Delivery menus: an empty allergen list is not trusted unless the restaurant confirmed it, and the name, description and tags are scanned for allergen words | Allergy safety | Per-restaurant confirmation flows |
| D31 | Dishes whose real recipes usually contain nuts (biryanis, haleem, seviyan, butter chicken) carry the nuts allergen | Conservative for severe allergy | Nut-free variants of these dishes |
| D32 | Family plans split dinners: those who eat meat or fish get a meat dish and everyone else a dish of their own | Persona testing of a joint family | Per-person portions and quantities |
