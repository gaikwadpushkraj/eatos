# EatOS as Pooja (29, Mumbai, 6 wk postpartum, lactating, anaemia, vegetarian, 3.5 h sleep)

Driven via persona-kit at 390x844, clock Wed 14 Oct 2026 (03:30, 21:15, 22:00 IST). Seeded Pooja veg, conditions lactation+anaemia, spice 1, Gujarati/Maharashtrian, sleep.logged 3.5 h. No JS errors. Source untouched; scripts deleted. Shots: persona-shots/p20_*.png (today, today_2115, wish_*, unwell_today, ask_*, cook) - looked at today and wish.

## Verdict
- Safe and gentle in tone, and the iron nudging works (anaemia + lactation puts Haak, jowar roti, methi thepla on top with "A good iron source"), with no weight-loss, milk-supply or scolding copy anywhere.
- But it has no postpartum content at all: gond/methi laddoo, panjiri, ajwain/jeera water, saunf are all unknown; and nothing in the app knows about one-handed food, night feeds, or newborn sleep.
- Today's wind-down card (21:30, "no caffeine", priority 2, "Only 3.5 h sleep last night...") is tone-deaf for a mother whose sleep is set by the baby; the 'lactation' condition is a tiny silent nudge (+1 iron/protein, +0.5 fluids) with no explanation.

## Expectations scorecard
| Expectation | Rating | Evidence |
|---|---|---|
| One-handed quick food | NOT MET | Ask "one hand snack": "does not have 'one','hand'", gives Peanut chaat (needs chopping onion/tomato), Khandvi (25 min), Sattu sharbat. "eat while feeding": Haak with rice, jowar roti + sabzi, thepla (all two-handed, 20-30 min). No handheld/no-prep tag. |
| Under-5-min no-cook | PARTLY | "under 5 minute no cook" ignores "under"; Peanut chaat (5 min, chopping), Sattu sharbat 3 min, "Dates and water, to open the fast" (a fast-breaking dish for a non-fasting mother). No "no-cook" filter. |
| Postpartum traditions in catalogue | NOT MET | Ask/Wishes for gond laddoo, methi laddoo, panjiri, ajwain water, jeera water, saunf: none exist (grep core: only dalia-khichdi, methi thepla, bajra khichdi, ragi malt, varan bhat). Ask falls back to the same iron trio; Wishes says "does not know this dish yet". |
| Honest claims (tradition, never milk supply) | MET (by absence) | "more milk" Ask matches word "milk" -> Ragi malt, Olan (coconut milk): no supply claim, but also no answer or gentle note. No galactagogue text anywhere. Nothing to judge for wording because the foods are missing. |
| Iron and protein | MET | "A good iron source" on top picks; anaemia +2, lactation +1. Protein target 68 g shown. No vitamin C pairing tip, no "tea/coffee with meals reduces iron" note. |
| Hydration | PARTLY | Today shows 0/2.5 L and "+250 ml water", water tasks every few hours. Target is not raised for breastfeeding; no "drink with every feed" hook; fluids not tied to feeds. |
| No weight-loss talk | MET | No such copy; "diet to lose baby weight" wish is treated as an unknown dish (see #6). Goals chips offered (More protein, Stay hydrated, Steady energy, ...) none about weight. |
| No sleep shaming | PARTLY | Today at 21:15 lists "Wind down, no caffeine P2" at 21:30; its reason (scheduler.ts:209) says "Only 3.5 h sleep last night, so an earlier wind down helps". Not blaming, but advice a newborn parent cannot act on. |
| Meal timing around night feeds | NOT MET | Fixed routine (breakfast 08:00, dinner 19:30, "ALL DONE FOR TODAY... Rest well" at 22:00). No night-feed snack, no flexible/anytime mode. Hero at 03:30 still says "Good morning" breakfast 08:00. |
| "I'm unwell" safe mode | MET | Profile toggle: gentle dinner (Varan bhat with ghee and lemon), fluids first. Reasonable for a mother with a cold; copy says "goals paused" (fine). No lactation-specific note (keep feeding/fluids). |
| Gas-forming-food folklore | NOT MET | Ask "gas": no handling, no "tradition says..." line. Dishes with rajma/cabbage etc. are not marked; neutral, but a postpartum mother's top question is unanswered. |
| Lactation condition effect (rules.ts healthFit) | PARTLY | Only +1 for tag iron/high-protein, +0.5 for waterMl>=250, and no `reasons` pushed, so UI never says why. No caffeine/alcohol/fish-mercury/spice checks; askDoctorFlags has nothing for lactation or anaemia (no "ask your doctor about iron supplements"). |
| Wishes kind and non-medical | MET / PARTLY | gond laddoo, tea, coffee, spicy chaat, fenugreek, ice cream, methi laddoo, panjiri, ajwain water: all "does not know this dish yet, so it cannot check it" + Save. Kind, honest, but not useful (see #5, #6). |

## Findings
| # | Sev | What I did | What I saw | Suggested fix |
|---|-----|-----------|-----------|---------------|
| 1 | CONTENT-GAP | Ask/Wish gond laddoo, methi laddoo, panjiri, ajwain/jeera water, saunf, dalia | None in catalogue; Ask returns generic Haak/jowar/thepla. "dalia" query does not surface Vegetable dalia khichdi (exists in india.ts) - top 3 are Haak, jowar, thepla. | Add ~10 postpartum dishes (gond ladoo, methi ladoo, panjiri, ajwain/jeera/saunf water, dalia porridge, ghee-rice, dink/dinkache ladoo) with `tradition` tag; fix dalia alias. |
| 2 | CONTENT-GAP | Ask "one hand snack", "eat while feeding" | Parser drops "one", "hand", "while", "feeding"; results need chopping/cooking. | Add `handheld`/`no-prep` tag + aliases (one hand, feeding, nursing, baby in lap): banana, dates and nuts, ladoo, roasted makhana, thepla roll, chikki, lassi in a bottle. |
| 3 | UX | Today at 21:15, sleep 3.5 h | Card "Wind down, no caffeine" P2 at 21:30, reason "Only 3.5 h sleep last night, so an earlier wind down helps". Tone-deaf for a newborn parent (and caffeine-flag is the only caffeine mention). | When lactation or "newborn" is set, suppress the sleep-reason line or reword ("Rest when the baby sleeps. A glass of water first?"); never schedule fixed bedtime for new parents. |
| 4 | UX | 03:30 Today | "Good morning, Pooja", next breakfast 08:00; no night-feed support. | Add "night feeds" routine option: small snack + water by the bed (milk-and-dates, ladoo, banana) at flexible time. |
| 5 | UX | Wishes: gond laddoo, tea, coffee, ice cream | Same "does not know this dish... cannot check it" box and a "list below" that is empty. For tea/coffee no caffeine moderation note (which she asked as a nursing mother), none for ice cream. | Known-wish short answers: tea/coffee "fine in small amounts; 1-2 cups, away from iron-rich meals" as common guidance; fix "pick from the list below" when no list. |
| 6 | UX | Wish "diet to lose baby weight" | Treated as dish name ("Diet to lose baby weight... does not know this dish"). Not harmful, not kind either. | Detect weight-loss intent: "EatOS does not plan weight loss. For now, enough food and water matters most. Ask your doctor when you are ready." |
| 7 | BUG | Ask "gas", "more milk" | "gas" gets the default trio; "more milk" matches the word "milk" in Ragi malt/Olan (coconut milk) as if it answered the question. | Recognise supply/gas queries; give tradition-framed note ("Many families serve methi and ajwain after delivery; no food is proven to raise supply") and do not rank on "milk". |
| 8 | UX | lactation condition | healthFit +1/+0.5 with no reason string shown; so Pooja cannot tell why she sees Haak/thepla. Profile health chip is "Breastfeeding" (good name). | Push reason "Extra iron and fluids while breastfeeding". Raise hydration target modestly when lactating. |
| 9 | CONTENT-GAP | Anaemia | No vitamin C pairing, no "keep tea/coffee away from iron meals", no "ask your doctor about supplements" in askDoctorFlags (lactation/anaemia absent). | Add flags and one-line iron tips; keep wording as questions. |
| 10 | UX | Ask "under 5 minute no cook" | Returned "Dates and water, to open the fast" for a non-fasting user. | Hide fast-specific dishes when no fast is active. |
| 11 | UX | Plan, 7 days | Medu vada with sambar as snack (30 min); Haak (collard greens) with rice, ragi mudde: 25-45 min cooking for a sleep-deprived mother; no batch-for-freezer or "family cooks for me" mode. | "Easy week" plan weighting no-cook/<10 min; allow helper to cook (cook-for-me list). |

## Delights
- Iron wording is plain and anaemia-aware: "A good iron source. A taste you grew up with."
- Safe mode: Varan bhat with ghee and lemon, fluids first, goals paused, easy toggle in Profile.
- Hide numbers option, Hindi UI, and no weight/scold copy; Gujarati/Maharashtrian taste respected (thepla, jowar, zunka bhakri).
- "Cook once, eat twice" batches help a tired mother. Taste cards and Wish saving work at 390 px.

## Missing
- Postpartum section ("Recovery foods") with tradition-framed notes (gond, ajwain, methi, panjiri, ghee, saunf) and a plain "no food is proven to raise supply" line.
- One-handed / no-prep / bottle-friendly tags; night-feed snack routine.
- Nursing-aware hydration (per-feed prompt), caffeine and alcohol notes, folklore "family says X" respectful handling.
- Vitamin C + iron pairing; ask-your-doctor flags for anaemia and lactation; wish intent detection (weight loss, caffeine).
- Household/helper mode so family can see "what to cook for Pooja".
