# Kamla (72, Delhi grandmother, vegetarian, no-onion-garlic, diabetes + hypertension, spice 1, dentures) - EatOS test

Method: persona-kit at 390x844 (and 260px-wide viewport = 150% zoom), clock 2026-10-14 at 08/13/17/19:30, profile seeded as listed. Shots: apps/app/persona-shots/p9_*.png. No source edited; scripts deleted.

## Verdict
- Safe on her rules (zero onion/garlic, egg, meat in Today x4 slots, 19 Ask queries, 7-day plan) and the dish list is mostly hers: dalia khichdi, bajra khichdi, kootu, rasam, chaas. Diabetes/low-salt reasons are shown plainly ("Steadier on blood sugar. Easy on salt.").
- NOT ready for her: no Hindi at all, no "soft food / dentures" concept, so crunchy roasted chana is her snack "Best fit" every day and nuts/seeds appear; text is 12-16px; a caregiver cannot set her up (no "set up for someone else").
- Cook steps are generic ("Wash and chop what needs it. Cook or assemble, about 30 minutes."), useless for a 72-year-old who needs real steps.

## Expectations scorecard
| Expectation | Result | Evidence |
|---|---|---|
| Plain big words, no jargon | PARTLY | Dish cards are plain. But "Core", "Treat", "NOW · CORE", "P1/P3" chips in Coming up, "Needs attention" header after cooking, "Missing" on every ingredient. Fonts: 12px x4, 13px x6, body 14-16px, nothing larger than 16 except 26 headings |
| Nothing hard to chew | NOT MET | Snack Best fit = "Roasted chana with lemon" (dish roasted-chana) on Today 17:00, plan Wed and Sat, and Ask "soft food easy to chew" (3rd), Ask "something crunchy" (Best fit). Also "Dahi chivda" (flattened rice + peanuts) for "low salt", "Curd with fruit and nuts", wish "dalia" suggests "Samak rice pulao with peanuts"; wish "kheer" suggests "Apple and almonds", "Apple and pumpkin seeds". No texture tag in catalog (grep soft/chew in core: only cook text) |
| Low-salt | MET | "Easy on salt" on sattu, chana, kootu; "low salt" Ask ranks them first. (But Dahi chivda matched "salt" via the word "black salt", see F9) |
| Diabetes-aware | PARTLY | "Steadier on blood sugar" on most cards. But Ragi malt (milk + jaggery, id ragi-malt) is her snack option and the plan's Thu/Sun snack with no sugar note; Taste card #1 for her is "Sheer khurma" (Hyderabadi sweet); wish "jalebi" suggests "Apple and almonds"/"Curd with fruit and nuts" which is fine |
| Sees dishes she knows (khichdi, dalia, lauki, dal) | MET | Ask "khichdi" -> Bajra khichdi, Vegetable dalia khichdi, "Matches 'khichdi'"; "dalia" -> Vegetable dalia khichdi best; "lauki" -> Lauki sabzi with roti and dal; "dal" -> Moong dal chilla. Plain moong khichdi and plain dal-chawal missing from Today/Plan; plan loops 6 dishes |
| Asks for Hindi | NOT MET | No language setting anywhere in /profile (sections: Goals, Your food, Rules, Spice, Day, Kitchen, Health, Taste, I'm unwell, Hide numbers, Appearance, Sync, Smarter Ask). Typing "hindi" in Ask returns the same 3 English cards; "मूंग दाल" in Ask is ignored (Roasted chana, Bajra khichdi, Sattu); wish "मीठा" says "EatOS does not know this dish yet". All UI, dish names and steps are English |
| Caregiver (daughter-in-law) can set it up | NOT MET | /profile has no "setting up for someone" path; the first member is "You". Household > Add someone works (Name, diet, allergens, rules, health, "Prefers mild food") but a household member never gets her own phone view; the DIL would have to type Kamla into the DIL's own profile. No soft food/dentures/low-salt switch exists in Health options (Diabetes ... Under 18) |
| No-onion-garlic | MET | Always on, "These are never broken." Rasam rice shown as "Rasam rice without garlic" (rasam-rice-satvik, hing). Festival-day-only nuance not offered (it is permanent), fine for her |

## Findings
| # | Sev | What I did | What I saw | Fix |
|---|---|---|---|---|
| 1 | SAFETY-BLOCKER | Today 17:00; plan; Ask "soft food easy to chew" | Roasted chana (hard, a choking/denture risk) is the default Best fit snack, 68 of ~76 Best-fit hits across my 4-slot scan; plan has it Wed, Sat, Tue | Add a `soft`/`texture` need ("Easy to chew") in profile; exclude hard/crunchy/whole nuts/seeds/chana/popcorn/makhana/chivda for it. Without it, never default to roasted chana for 60+ |
| 2 | SAFETY-BLOCKER (trust) | Ask "something crunchy", "soft food easy to chew" | Both return Roasted chana with lemon, never acknowledging chewing difficulty; the app says "3 options that fit right now" | Honour texture words; say "I have not marked softness for dishes yet" |
| 3 | CONTENT-GAP | Ask "hindi", "मूंग दाल"; wish "मीठा"; browse every screen | Zero Hindi in UI or input. Devanagari typed in Ask/wish is silently treated as unknown. Hindi dish names (khichdi, lauki, dalia) work only in Latin letters | Language switch (Hindi/Hinglish) at first screen; at least accept Devanagari dish names; say "Hindi is coming" instead of silently ignoring |
| 4 | UX | /profile for a caregiver | No "this is for my mother" flow; self is "You"; Household members cannot get their own Today view | "Setting this up for someone else": ask the person's name first, caregiver can switch the whole app to her profile and lock it |
| 5 | UX | Count font sizes at 390px | 12px (tab labels, status), 13px (chips), 14px (most text), 16px body; no larger-text setting in Appearance (only Light/Dark/System) | Add Text size (Large/Extra large) in Appearance; base 18px, min 15 |
| 6 | BUG | 260px-wide viewport (150% zoom) | /ask horizontally overflows (scrollWidth 300 > 260); bottom tab "Household" truncates to "Househ..." | Allow wrapping on Ask chips; shorten tab to "Home"/"Family" or wrap |
| 7 | UX | Cook /cook/dalia-khichdi, kootu-rice, ragi-malt, bajra-khichdi | Steps are the same 4 templated lines: "Gather the ingredients...", "Wash and chop what needs it.", "Cook or assemble, about 20 minutes.", "Taste, season and serve." No heat, soak, pressure-cooker whistles, "until soft/mushy" for dentures. Step text 16px bold white on black (readable), buttons 50px high (good). "Serves 1" and "Missing" beside every ingredient (looks like an error with an empty pantry) | Real per-dish steps; "cook until very soft" note; "Not in pantry" -> hide when pantry empty |
| 8 | BUG | Cook /cook/sattu-sharbat and /cook/moong-chilla | Ids differ from the card (sattu-drink, moong-chilla-jain) so I could not tell if a cook screen exists; /cook/rasam-rice (plain) lists garlic - only reachable by URL, plan uses the satvik variant | Check deep links do not expose the garlic version |
| 9 | BUG | Ask "low salt" | "Dahi chivda" ranks 3rd with "Matches 'salt'" because black salt is an ingredient; chivda with peanuts is salty and hard | Match on tags (low-sodium), not words in ingredient text |
| 10 | UX | Tap "Ramzan fast" at 08:00 (mis-tap) | Instantly applies ("Fits your ramzan fast. It lapses at midnight"), no confirm or undo; breakfast stays. Tapping "I already ate this" also immediate with no Undo (checked: no "Undo" text on Today after) | Confirm fasting for 60+ (fasting with diabetes/BP meds is a risk); add Undo toast for I already ate this |
| 11 | UX | Plan week | Six dishes on loop (Sattu x3, Bajra khichdi x4, Roasted chana x2...). Ragi malt Thu/Sun is a milk+jaggery drink for a diabetic with no note; Thursday dinner kootu then Fri lunch kootu | More dal-chawal, plain moong khichdi, lauki sabzi, curd rice in rotation |
| 12 | UX | Taste cards | First card "Sheer khurma" (Hyderabadi, sweet) for a diabetic vegetarian Delhi woman | Rank cards by her cuisine/health; do not lead with sweets |
| 13 | UX | Today | "Hydration 0.0 / 2.5 L" target and "+ 250 ml water" with a hypertensive 72-year-old; "Protein 0 / 68 g"; no "ask your doctor if on fluid restriction" line; "Hide numbers" exists but buried in Profile | Offer "Hide numbers" at onboarding for elders; gentler tone |
| 14 | UX | After tapping Start cooking > last step | "Done, I ate this" logs the meal in one tap, then Today header says "Needs attention" (unexplained) | Rename or remove; confirm |

## Delights
- "Steadier on blood sugar. Easy on salt." and "Matches 'khichdi'" read like a person, not a dashboard.
- "Vegetable dalia khichdi" at 25 min with "gentle" tag, "Gentle, I feel unwell" chip, "Choose for me" button: right shape for someone who wants one answer.
- Big "Start cooking" button (50px+), cook screen with progress bar and "Previous / Next step" is easy to tap; unknown-dish wish honestly says "EatOS does not know this dish yet, so it cannot check it" (rotla, aam ras).
- No horizontal overflow at 390px; no console errors anywhere.

## Missing for her
- Hindi (UI, Devanagari search, dish names), a larger-text setting, a soft-food/denture preference, a caregiver set-up path and a "mother's mode" with fewer options.
- Plain dishes: moong dal khichdi, dal chawal, curd rice, lauki kofta/sabzi in plan, dalia porridge, ragi porridge, sattu without roasted chana; texture tags for every dish.
- Medicine/doctor line and salt amounts in grams or spoons.
