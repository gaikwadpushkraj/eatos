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
