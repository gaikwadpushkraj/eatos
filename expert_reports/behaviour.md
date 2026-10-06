# EatOS behavioural and product-psychology review

Method: read onboarding.tsx, taste.tsx, profile.tsx, FoodProfile.tsx, (tabs)/index.tsx, rules.ts (fastingGate), the two research notes; ran dist at 390px.
Screenshots: apps/app/persona-shots/beh_onboard1-3, beh_today, beh_ask, beh_wishes, beh_taste, beh_profile, beh_pantry (.png).
Evidence caveat: the research note cites only search snippets; behaviour-change effects below are background knowledge unless marked "(note)". Treat effect sizes as directional.

## 1. First-run analysis

### What happens today (observed)
- Cold start lands on "Who is EatOS feeding?" (5 checkboxes, "Just me" preselected). Step 2 "About you": name, 4 diets, 9 allergens, 4 goals, weight (optional). Step 3 "Ready": fixed meal times, medication free-text, "sample pantry" toggle. Then Today.
- Taps to first suggestion on the happy path: Continue, Continue, Continue, Start EatOS = 4 taps, about 20 s if the user changes nothing. Taps with a real profile (diet, 2 allergens, goals): about 8-10, about 45-60 s. Good: first suggestion is fast.
- But the first suggestion is generic: spice, Jain/halal/no-onion-garlic rules, kitchen, cuisine and taste are NOT collected in onboarding. They are deferred to Profile > Your food (a long page, the "Next, add your rules..." card is the only pointer) and Taste cards (Profile > "Start the taste cards"). Defaults assume omnivore, full kitchen, 13:00 lunch.
- Result: the safety-critical religious rules are opt-in after the first suggestion. A Jain user can be shown a lunch with onion/garlic on first view. Defaults are unsafe for the exact users the product is for. This is the largest first-run defect.

### Observed issues from screenshots
1. beh_onboard1: "Just me" label renders with strike-through when checked (looks like "removed"); label column is squeezed (title wraps to 3 lines for "Caring for someone"). Reads as an error.
2. beh_onboard1: step 1 mixes personas ("A health condition", "Caring for someone") before any value is shown; a minor or someone with an eating-disorder history may tick "A health condition" and gets reassurance copy only.
3. beh_today (Riya, vegetarian, 13:00): hero is "Dahi chivda, ready in 4 min" with "Core" priority pill, then a "NOW . CORE: Drink 500 ml water" card, then 3 progress tiles all at 0 (Hydration 0.0/2.5 L, Protein 0/68 g, Fibre 0/30 g), then "Fasting today?" Navratri/Ekadashi chips. For a first-day user: 3 zero meters read as "behind" on minute one; "Core" is jargon; the water task competes with the meal as primary action; no "why this dish for you" beyond "Ready in 4 min".
4. beh_ask: the first two of 3 options at lunch are Coconut water and Banana, each with "Cook this" and "Missing: coconut water / banana". A drink and a fruit as lunch options with a Cook button is a trust-breaker. (Pantry empty in this persona; the sample pantry toggle default is on in real onboarding, but anyone who turns it off sees this.) "Not for me" gives no reason chips on the card.
5. beh_taste: card is text-only ("Sheer khurma, Hyderabadi . No spice . 25 min"). No photo, so recognition and craving cues are weak, and a dessert is the first card for a vegetarian at lunch. Buttons: 4 (Yes love it / Not today / Never for me / Skip); "Not today" vs "Skip" is ambiguous. Only 8 cards, shown 1 at a time, with no progress reward ("1 of 8" is fine).
6. beh_wishes: a single field with a placeholder "chicken biryani, pav bhaji, gulab jamu" and a greyed button; no tappable starter chips, so it is a blank-page problem. The placeholder shows non-veg food to a vegetarian.
7. beh_pantry: empty state "Nothing here." with a photo/receipt prompt. Camera-first is high-effort and high-privacy-concern for a first minute; no "add 5 staples" one-tap.
8. beh_profile: Goals chips appear above "Your food", so the least important choices come first; the rules (Jain, Satvik, no onion or garlic) are below the fold at 390px.

### Drop-off risks (ranked)
1. Step 1 persona question is abstract and yields no value; users who see 5 options with a condition option bounce or over-disclose.
2. Zero personalisation at first suggestion (no spice, rules, taste): the first lunch looks "off", the user concludes "not for me" within one session. Cold-start trust is made or lost on the first card.
3. Health and weight fields before trust is earned (weight shown at step 2 with a protein-target justification).
4. Taste work hidden in Profile: most users never reach it; the 6-8 taps that would most improve relevance are not in the funnel.
5. Today's three zeroed meters and a water task on day one: reads as a to-do list, not a helper.
6. No re-entry hook: no reminder, no "same as yesterday", no weekly summary (grep found none of: streak, notification, reminder, surprise, weekly, same-as-yesterday). Good for safety, but there is nothing to bring a user back on day 2.

### Proposed 90-second onboarding (target: first tailored suggestion in <=12 taps, all skippable except none)
Principles: progressive disclosure (one question per screen, big tap targets, visible "Skip"), safe defaults (assume the stricter reading when unsure, and say so), consent before any health data, no weight/height, no calories. Order is "rules before taste before health" so the first suggestion is already safe.

Screen 0 - Welcome (5 s)
- Title: "Meals that fit your home, your rules and your mood."
- Body: "Two minutes of questions. Everything stays on this phone."
- Buttons: "Let's start" / link "Restore from backup or another device".

Screen 1 - What do you eat? (single choice, 1 tap, auto-advance) [diet identity]
- Title: "What do you eat?"
- Options: "Vegetarian" / "Vegetarian + eggs" / "Eats everything" / "Fish, no meat" / "Vegan"; footer chip "Jain" jumps to rules prefilled.
- Helper: "Not sure? Pick the stricter one. You can change it any time."
- Default if skipped: Vegetarian (safer than omnivore). Skip copy: "Skip, I'll decide later" and the hero shows a one-line "Showing vegetarian meals until you tell us."

Screen 2 - Rules at home (multi, 1-3 taps) [rules]
- Title: "Anything your home never cooks or eats?"
- Chips: "Jain (no root vegetables)" / "No onion or garlic" / "Satvik" / "Halal" / "No beef" / "No pork" / "No egg" / "None of these".
- Helper: "We will never suggest a dish that breaks these. Dishes we are not sure about are marked 'check ingredients', never 'safe'."
- Allergy line: button "I have an allergy" opens the 9 allergen chips inline (progressive disclosure; "Nuts, peanuts, dairy, gluten, egg, soy, fish, shellfish, sesame"; footer "Packaged food only: we cannot see restaurant kitchens.").

Screen 3 - Kitchen and cook (single choice) [kitchen]
- Title: "Who cooks, and with what?"
- Options: "I cook, full kitchen" / "I cook, basic (no oven)" / "A cook or family member cooks" / "Mostly delivery or canteen" / "No kitchen (hostel/PG)".
- Helper: "So we do not suggest what you cannot make."

Screen 4 - Spice (single choice, slider-like four chips)
- Title: "How spicy do you like it?"
- Chips: "Mild" / "Medium" / "Hot" / "Depends on the dish" (default Medium).
- Helper: "Mild is always available later."

Screen 5 - Six taste cards (about 20 s) [taste]
- Header: "Tap what you would happily eat." progress dots 1/6.
- Card: dish photo (real, regional), name, cuisine, "25 min". Two big buttons: "Yes please" / "Not for me"; tertiary small "Never" and "Skip". Swipe equivalents for gestures.
- Selection: first card per cuisine of the user's region guess (city from timezone), then pairwise-ish contrasts (north vs south, dry vs gravy, sweet vs savoury). Only rule-compliant dishes appear (already true in code).
- After card 6: "Good start. Taste gets sharper every time you eat." (no score, no percentage).

Screen 6 - Optional: your day (single tap) 
- Title: "What does your day look like?" Chips: "Regular" / "Early riser" / "Night shift" / "It changes". Skippable.

Screen 7 - Optional health (collapsed by default, own consent) 
- Title: "Do you want to tell us about health?"
- Body: "This is optional. EatOS does not diagnose or treat. If you add something, it is used on this phone to avoid unsuitable food and to say 'ask your doctor' where needed. You can see, edit or erase it any time in Profile > Privacy."
- Buttons: "Not now" (primary-weight, equal visual weight) / "Yes, add" (opens chips: Diabetes, Prediabetes, High BP, High cholesterol, PCOS, Thyroid, Anaemia, Lactose intolerant, Coeliac, Gout, Kidney, Pregnant, On insulin or sulfonylureas, "Prefer not to say").
- Consent record stored per category with timestamp (consent ledger from the research P0). Eating-disorder history and Under 18 are NOT chips here: see section 5.

Screen 8 - First suggestion (the payoff)
- Title: "Here's your {meal}." Hero card with dish, "Why: Vegetarian, no onion or garlic, mild, 10 min, you liked Poha." Buttons: "Looks good" / "Show another" / "Not now".
- Sub-line: "Your answers are saved. Change them any time in Profile."

Counts: screens 1-4 = 4-8 taps, 5 = 6-8 taps, 6 and 7 skippable, 8 first suggestion. Realistic 30-45 s typed-free, 90 s with reading.
Never ask at onboarding: weight, height, medication names, calorie targets, goal of weight loss. The old weight field and medication free text move to Profile with their own just-in-time reasons.

## 2. Habit and nudge plan

Evidence base: app-based diet interventions have small average effects (+0.48 veg/fruit portions/day, 2025 meta-analysis (note)); the useful techniques are goal setting, planning, feedback, personalisation. No recsys study measured long-term behaviour (note). Claim only "less decision effort, more variety, safer fits".

### Mechanisms and concrete designs
| Mechanism | Design for EatOS | Rationale |
|---|---|---|
| Implementation intentions (if-then) | After the first "ate it", offer one optional plan: "If it's 4 pm and I'm tired, I'll have my roasted chana saved snack." User picks cue (time or situation chips) and a saved dish. Stored as a Plan card on Today at that time. | Gollwitzer-type plans raise follow-through modestly; one trial in the note found saturated-fat benefit. Keep to one active plan, user-authored. |
| Defaults | Top-1 pre-selected suggestion per slot; one tap "Looks good" logs and opens cook steps; rules-first safe defaults (stricter diet). | Defaults are the strongest low-cost nudge; must be safe by construction. |
| Friction | Reduce for the wanted path (one-tap eat, same as yesterday); add friction only to destructive actions (delete, "Never"). Do not hide "Other options". | Ease beats motivation. Override must stay frictionless to stay ethical. |
| "Same as yesterday" | Chip on Today hero when yesterday's same-slot meal was eaten and still rule-compliant and not eaten 3 days running; also "Same as last {weekday}". | Repetition is how most people actually eat; cheapest path to a habit. Repeat-penalty in the scorer should not apply when the user explicitly asks. |
| "Surprise me" | Button next to "Other options": picks a liked cuisine + one novel dish from a 1-in-4 explore slot, with a "Not this" one-tap that learns a reason. | Serves novelty seekers without long lists; exploration needs a cheap escape. |
| Choice size | Max 3 options, always (already so in Ask). | Avoids overload (evidence on choice overload is mixed (note)). |
| Reminders | Opt-in only, one per day at a user-chosen time anchored to an existing routine ("When you put the kettle on, I'll show tonight's idea"). Local notification, no content beyond "Your {meal} idea is ready". Auto-pause after 3 ignored in a row (ask "Fewer or none?"). | Time anchoring and ignoring-based back-off prevent spam. |
| Timing | Surface the next-meal card 60-90 min before the slot (decision window), and "what's for dinner" hour-before-cook for family cooks; late night (after 22:30) shows a light default, no moralising. | Decision is made before hunger peaks; cook needs lead time. |
| Weekly review (Sunday, opt-in) | 4 lines: "You tried 3 new dishes", "Dinners cooked at home: 5", "Favourite: Poha", "Next week: try ___ (tap to add)". No numbers about weight or calories. | Reflection plus planning; positive-only framing. |
| Reason chips on "Not for me" | Taste / Too long / Missing something / Family / Not feeling it. One tap. | Failure is usually a constraint (note); learns without nagging. |
| Gentle feedback | "Ate it and felt fine?" thumb, once a day at most, user-selected time, can be turned off. | Success metric and learning signal; keep it optional. |

### Anti-patterns (explicit do-not-ship list)
1. Streaks, "days in a row", broken-streak messages, loss-framed copy ("You missed lunch"). Today's schedule chip "Missed" and the "Missed/Queued" labels should be reworded ("Passed", "Skipped") because they read as failure; hydration "Behind" in the tiles likewise.
2. Calorie or macro counting as default. Today shows protein g and fibre g at 0 on day one; default to qualitative ("Some protein soon") and keep numbers behind opt-in. hideNumbers exists: invert it to default on for new users.
3. Good/bad, clean/junk, cheat day, "burn it off", guilt copy. Allowed vocabulary: "fits your rules", "lighter", "heartier", "check ingredients".
4. Notification spam, FOMO ("Don't lose your plan!"), red badges, daily counts, sync nagging.
5. Dark patterns: pre-ticked health consent, hidden "skip", confirm-shaming ("No, I don't care about my health").
6. Rewarding restriction (praising a skipped meal, a "fasting streak", "light day" badges). The scheduler's "kept light" explanations must never be celebrated.
7. Shame in the weekly review: no comparison with others, no "worse than last week".
8. Gamified points tied to eating less or logging precisely.

### Eating-disorder-safe design (on-device supportive mode)
Triggers computed locally from event log, never shown as a diagnosis:
- Self-declared: "Eating disorder history" or "Prefer a gentler mode" toggle in Profile (not at onboarding, to avoid labelling) -> immediate supportive mode.
- Behavioural (any two within 14 days): (a) 5 or more distinct foods marked "Never" in a week; (b) 3 or more fast-related taps or fasting plans without a religious calendar match; (c) 3 or more skipped main meals in 7 days; (d) logged intake persistently under the floor and the user manually edits kcal numbers; (e) repeated "I feel guilty" or "I overate" taps if such a button exists; (f) late-night searching of "fewer calories" style wishes (the wish text is local; match a small phrase list).
Supportive mode behaviour: numbers hidden, no protein/fibre/hydration meters, no goals except "Steady energy", no fasting card or fast gating shown ("regular meals only"), no weekly stats, no "light" suggestions, no restriction-flavoured alternatives in Wishes ("lighter version of" removed), wording shifts to "Your body needs regular meals."; a single dismissible card: "If food feels stressful, talking to someone can help. {Helpline/clinician information, region-appropriate}" with "Not now" respected and no repeat for 14 days. User can leave the mode in one tap with no lecture; revoke is always visible.
Keep the existing safety floor but stop showing "never plans below 1200 kcal" as a number to the user in supportive mode (it anchors a target).

## 3. Success metrics for a privacy-first on-device app
No analytics server: compute locally from the event log (already append-only), show in a "Your EatOS this month" card the user can see and wipe; optionally export a CSV or share a screenshot voluntarily for research with explicit consent. Never transmit.

### Core outcome metrics (user-visible, local)
| Metric | Definition | Display |
|---|---|---|
| Time to first useful suggestion | profile.set to first "Looks good"/cook/eat event | Dev-only, in the debug screen |
| Follow-through rate | ate or cooked after suggestion shown / suggestions shown (7 and 30 d) | "You used 4 of 6 ideas this week" |
| Ate it and felt fine | thumbs-up after eaten / feedback prompts answered; and prompt rate = answered/ shown | "5 of 6 meals sat well" (positive only) |
| Rejection reasons mix | counts of reason chips | Used to adjust scoring, shown in Profile > "What I've learned" |
| Variety | distinct dishes and cuisines per 14 days | "11 different dishes" |
| Home-cooked share | cooked at home / meals logged | Optional, hidden in supportive mode |
| Decision effort | taps from open app to eaten; use of Same-as-yesterday | Dev metric |
| Rule violations shown | must be 0 (fuzz in CI; local assertion counter in debug) | Dev |
| Retention proxy | days with any event in last 14; open-without-event days | Dev, not shown as a streak |

### Guardrail metrics (stop-the-line)
- Supportive-mode trigger rate and exit rate; rising "Never" taps; skipped main-meal frequency. If a build increases them, roll back.
- Notification: opt-out rate within 7 days, ignored-in-a-row count; target <10% turn off.
- "Not for me" with reason "health/guilt": any rise is a copy bug.
- Zero numbers shown to users in supportive mode (assertion).

### Research-grade (opt-in, voluntary, aggregate-only)
- A once-a-quarter 3-question check ("Meals feel easier / I trust the suggestions / I feel pressured by the app", 1-5) stored locally with a "Share anonymous results" button producing a copyable string. The "pressured" item is the early harm detector.
- Evaluate with offline persona replay (the eight personas) before each release: constraint violations = 0, top-3 diversity, fit to stated taste.

## 4. Ranked list of 12 UX changes
Impact: H/M/L on activation and safety. Effort S (<1 day), M (1-3 days), L (>3 days).
| # | Change | Effort | Impact | Why |
|---|---|---|---|---|
| 1 | Move diet identity, rules (Jain, no onion-garlic, halal, no egg), allergens, spice, kitchen into onboarding (screens 1-4) with stricter safe default | M | H | Removes unsafe cold-start; core to trust |
| 2 | Add 6 taste cards with photos inside onboarding; first suggestion explains why it was chosen (rules + taste) | M | H | Personalisation within first 90 s; evidence for 15-card elicitation (note) |
| 3 | Meal-appropriate Ask/Today: never offer a drink or lone fruit as a main meal option; "Cook this" becomes "Eat this" for no-cook items; add reason chips on "Not for me" | M | H | Fixes beh_ask; learns constraints instead of repeating |
| 4 | Day-one Today: hide meters until data exists or show words; default hideNumbers on; move water task below the meal hero; rename "Core" | S | H | Avoids day-one failure feeling and calorie/number anchoring |
| 5 | Consent-gated optional health step (equal-weight "Not now", per-category consent ledger, no weight at onboarding) and "Privacy" screen to view/erase | M | H | DPDP-style consent, ED/over-disclosure safety |
| 6 | "Same as yesterday" and "Surprise me" buttons on the Today hero | S | H | Cheapest habit builders; reduces taps to 1 |
| 7 | On-device supportive mode with the triggers in section 2 and a helpline card; remove kcal floor number from view when active | L | H | Harm prevention for ED-vulnerable users |
| 8 | Fix checked-label strike-through and tight column in onboarding step 1; simplify "Who is EatOS feeding?" to optional later | S | M | Looks like a bug; removes drop-off screen |
| 9 | Opt-in single daily reminder, user-chosen time, local, backs off after 3 ignores; plus 'ate and felt fine?' one-tap prompt | M | M | Re-entry without spam; feeds metric |
| 10 | Wish list starter chips (vegetarian-aware: pav bhaji, gulab jamun, biryani only if allowed), "Save for weekend" rung | S | M | Blank-page problem; aligns with research alternatives ladder |
| 11 | Weekly review card (Sunday, positive-only, opt-in) with next-week "try this" | M | M | Reflection + planning; retention |
| 12 | Pantry empty state: "Add 5 staples" one-tap chips before camera; wording "Passed" instead of "Missed" in schedule; fasting card moved off Today for users with no fasting calendar match | S | M | Low-effort polish removing negative language |

## 5. Ethical review

### Health condition collection
- Risks: sensitive inference, over-disclosure, medicalisation, false reassurance ("EatOS will keep you safe").
- Positives in code: conditions are optional, collapsed behind "Add health options", copy says "never sent to Claude" and "never works out a condition from what you eat". Keep that.
- Required: consent per category with timestamp, view/edit/erase and "Prefer not to say"; no onboarding weight; show exactly what each condition changes ("Hypertension: lower-salt dishes first"); every condition-driven tweak carries "Ask your doctor" and evidence tier; no diagnosis wording linter bypass; do not infer (as stated in the research note).
- The "Under 18" and "Eating disorder history" chips sit in the same list as "Diabetes". Labelling oneself in that list is stigmatising and for a minor is a self-declared age gate that is easily skipped. Split them out (below).
- Backup/sync exports health data: the export must be encrypted with a visible warning; deleting should wipe server copy (already messaged in onboarding lastWipe card).

### Religion-linked rules
- Rules (Jain, Satvik, Halal, no beef/pork) inherently reveal religion or community. On-device storage is the mitigation; store as "food rules", not "religion"; never ask religion. Label neutrally: "Jain" is acceptable as a rule name, avoid asking sect or practice.
- Treat as hard constraints with asymmetric safety: unknown ingredient status = "check ingredients", not compliant. Disclose that halal/jain certification cannot be verified for outside food.
- Avoid stereotyping defaults: do not guess a community from name or city. Surface rules inline in onboarding without a religion prompt, and allow household-specific rules per member (mixed households).
- Do not use rules for ads, ranking, or any export beyond the user's backup. Wipe on request.

### Fasting gates
- Today: gated for insulin/sulfonylureas, pregnancy, minors, ED history (good). Gaps: diabetes without insulin, kidney, gout, anaemia, thyroid, older adults and elders in the household, and "no condition declared but health unknown". Recommend a gentle gate: for these, show the fast only with "Check with your doctor first if you take medicines" and offer an "Allowed-food list only, no skipped meals" variant (which is how Navratri/Ekadashi plan is already deny-list based). Ramzan's "skip lunch" slot needs the strongest copy and a hydration/iftar reminder; never show it as a goal or streak.
- Fasting card on Today shows chips to anyone: consider showing only when the calendar suggests the date or when user enabled, so non-fasters (and ED-vulnerable) are not primed. Ensure the gate message is not shown as a refusal to a religiously motivated fast without a path ("Talk to a parent or doctor").
- Fasting rules disagree between sources (research note gap 9): ship them as editable defaults, say "traditions vary", never police compliance, and never track "fast completed".

### Minors
- DPDP: under-18 means verifiable parental consent and no behavioural tracking (note). EatOS is on-device with no server, but the app still builds a behavioural event log. A "Under 18" condition chip is a weak age gate.
- Required: ask age band (Under 13 / 13-17 / 18+) as an early neutral question on screen 0 or after rules; under 18: supportive-defaults (no numbers, no goals, no fasting, no weight, no health options other than allergies, no weekly review, no taste "Never" accumulation signals for restriction), parent-visible mode language ("Ask a parent or a doctor"), and a note that sync/backup is off for under-18 until a guardian enables it.
- "Caring for someone" in onboarding allows an adult managing a child profile; treat the child as a Member with managedBy set (already modelled) and apply the minor defaults to that member.
- Do not market as weight management for teens; keep copy neutral. Seek legal review of verifiable parental consent for on-device-only processing (research gap 4).

## Open questions
- Is a real dish photo library licensable? Taste cards without photos will underperform.
- Where do helplines and clinician info come from per region (maintenance owner)?
- Should reminders exist on web at all (no local notification API on iOS web).
