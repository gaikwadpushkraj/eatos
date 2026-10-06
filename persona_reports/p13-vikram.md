# Persona report: Vikram, 41, Gurugram executive who travels

Setup: omnivore, spice 2, kitchen 'none', 390x844, clock pinned 06:00 / 11:00 / 12:30 / 14:30 / 23:30 on 14 Oct;
calendar.busy "Flight" and a 3.5 h sleep.logged seeded. Shots: apps/app/persona-shots/p13_*.png. No page errors,
no tap targets under 44 px, no horizontal scroll.

## Verdict
1. Today is genuinely fast: the decision is on screen with 0 taps, and a flight over lunch moves lunch to landing time with a plain reason. That is the app's best moment for Vikram.
2. Everything else about travel is missing: no airport, hotel, buffet or "what to order" knowledge, free text mostly falls through to the same 3 no-cook cards, the time zone is fixed with no control, and a 3.5 h jet-lag sleep changes nothing visible.
3. Cold-opening offline fails (no service worker), so a flight-mode user cannot launch the app; once loaded it keeps working.

## Expectations scorecard
Expectation | Result | Evidence
--- | --- | ---
Decision in under 10 s | MET | Today shows "Next up" dish at open (0 taps); Ask chip is 2 taps (Ask, chip). Shows 3 "fit right now" cards.
Flight blocks lunch | MET | 11:00 and 12:30 with flight 11:30-15:00: "Lunch moved to 15:30. Moved from 13:00: Flight until 15:00", Dahi chivda 4 min, coming-up list reflowed.
14:30, lunch missed | PARTLY | No flight: card still says "NEXT UP . LUNCH . 13:00" (a time 90 min in the past) with Dahi chivda. No "you missed lunch, have something now" nudge. With a flight ending 14:00 it correctly shifts to 14:30.
Hydration in flight window | PARTLY | 12:30 inflight shows a NOW card "Drink 500 ml water" and next one at 14:00, so reminders do not know about the flight and no "sip every hour on a flight, plane air is dry" text. Hydration tasks are only the routine ones (08:00, 11:00, 14:00, 17:00).
Late hotel suggestions, kitchen none | PARTLY | 23:30 "light dinner after landing" gives Kachumber with curd + papad, sprouts salad, chana chaat (all "Light for this hour", good) but each lists 5-6 missing ingredients with a "Cook this" button, which is useless in a hotel room. "hotel room service" returns coconut water, banana, roasted chana (the generic late list), nothing like dal-chawal/khichdi/grilled chicken to order. Kitchen 'none' does not turn suggestions into "order/buy" items.
Buffet-friendly guidance | NOT MET | Searched "buffet", "what to order": identical generic cards, no plate-building tips, no menu help. Nothing in the app mentions buffet, menu, restaurant, airport, lounge, room service.
Ask phrasings | PARTLY | "airport food", "hotel room service", "what to order", "buffet", "I am jet lagged" all return the same 3 cards (coconut water, banana, roasted chana) with no "I did not understand". Only "light dinner after landing" ("light", "dinner") and "water..." matched keywords.
Time zone handling | NOT MET | Profile has fixed tzOffsetMin 330 and no control in Profile (only wake/sleep presets Regular / Early riser / Night shift). Device clock in London (BST) showed the app on IST: at 13:00 BST, Today said "Next up Snack 17:00". Travel abroad means all meal times and hydration are wrong with no way to fix. (format.ts uses profile tz; FastingCard uses 0 if unset.)
Jet lag | NOT MET | 3.5 h sleep logged 06:00, viewed 07:40, 11:00 and 23:30: no note on Today or in routine changes (only the wind-down task gets "P2" and only when it is still upcoming). Nothing about caffeine, light meals, meal timing in new zone.
One-handed use | MET | Bottom nav, primary buttons in lower 2/3, no target under 44 px, no horizontal scroll. "I already ate this" is a small text link far from the thumb.
Offline | PARTLY | Once loaded, going offline keeps SPA navigation and Ask working (verified). A fresh page load offline fails (net::ERR_INTERNET_DISCONNECTED): no service worker in dist, no manifest registration, so an airplane-mode cold start fails.

## Findings
Severity | What I did | What I saw | Suggested fix
--- | --- | --- | ---
BUG | Device in London, profile tzOffsetMin 330 | App silently stays on IST, no setting, no prompt "your phone is in a new time zone, update?" | Add "Time zone: follow my phone / fixed" in Profile; detect device offset change and ask once.
CONTENT-GAP | Asked buffet, what to order, airport food, hotel room service | Same 3 generic no-cook cards each time, no guidance | Add a short "Eating out / travelling" card set: buffet plate rule (half veg, one protein, one carb, skip fried starters), airport picks (dal-rice bowl, idli, fruit, nuts), room service picks (khichdi, grilled chicken, dal, curd rice, soup).
UX | Kitchen none, 23:30 "light dinner after landing" | Cards say "Cook this", "Missing: cucumber, tomatoes, onion, curd..." | With kitchen none, change CTA to "Order or buy" and prefer items that exist at room service or a corner shop (curd, fruit, boiled egg, soup).
UX | Free text not understood | No message that the phrase was not matched; defaults appear to be an answer | Say "I do not know airport/buffet yet; here are light picks" and offer the right chips.
UX | 14:30, no flight, nothing eaten | "Next up Lunch 13:00" still shown | Say "Lunch is late. Have something now" and re-time to now; avoid showing past times.
UX | Flight 11:30-15:00 at 12:30 | Hydration cards ignore flight; no flight-specific note | When busy title matches flight, add water reminder every ~1 h of flight and a "water in flight" line; keep dahi chivda carry-on friendly note.
UX | 3.5 h sleep logged | No visible effect on Today at any hour | Show a "short sleep" note: lighter meal, water, no heavy late dinner, avoid late caffeine.
UX | Cold open offline | Fails to load | Register a service worker to cache dist for offline start (PWA).
UX | Jargon | Today still shows "P1", "Core" labels in Coming up and chips | Plain words (as Rohit report).
UX | Today layout | "Fasting today? Navratri / Ekadashi / Shravan / Ramzan" always shown to an omnivore executive | Hide until chosen.
CONTENT-GAP | Dahi chivda as lunch after landing at 15:30 | Fine but sole option; no carry-on or eat-at-gate friendly framing | Tag portable foods (poha, chivda, nuts, fruit, sandwich) for travel mode.

## Delights
- Flight on the calendar shifts lunch with a clear "Moved from 13:00: Flight until 15:00" and a "Plan adjusted" banner.
- 23:30 landing: "Light for this hour" and light picks (kachumber, sprouts, chana chaat) on "light dinner after landing".
- Quick one-tap "+ 250 ml water", clean 390 px layout, big buttons, works after loading offline.
- Plan and Grocery work with kitchen none (many 0-3 min no-prep meals).

## Missing
- A travel mode or "I am travelling" toggle; time zone control; jet lag guidance (meal anchoring, light, caffeine).
- Airport, hotel, room service, buffet and menu guidance; "order this, skip that" lists.
- Hydration tied to flights; offline-first start.
