# EatOS UX copy, Hindi and i18n review

Scope: all screens in apps/app (app, tabs, src) and kernel strings (rules, aspire, explain, health, scheduler, recommend). Target reader: a 72-year-old grandmother and a 30-year-old, Class 6 English.
Companion files: `hi.json` (569 English->Hindi pairs), `hi-dishes.json` (145 dish id->Hindi, covers all of india.ts + catalog.ts).

## 1. Overall findings
- Tone is mostly warm and never scolding. Good: "That is the rule doing its job, not a gap in you", "Rest well", RESTRICTIVE_NOTE.
- OS and engineering words leak into the UI: "Safe mode", "System steady", "Safety floor", "Queued", "Folded in", "P0..P3", "events stored", "event log", "integrations", "Model", "API key", "JSON", ".ics", "CSV", "passphrase", "sync server", "batch", "Core / Goal / Treat".
- Monospace ALL-CAPS labels ("NOW · CORE", "TONIGHT · SHARED DINNER", "SETUP · STEP 2 OF 5", "EATOS · LOCKED", "SERVER/CODE") are hard to read for older eyes and impossible in Devanagari (no case). Use sentence case.
- Currency bug: integrations.tsx formats delivery prices as pound sterling (`£` and `priceCents / 100`). Must be rupees (`₹`) and whole rupees, never paise cents.
- Placeholders are Western: "Sam", "chicken biryani" (fine), "Dairy and protein". Use Indian names (Sunita, Ravi).
- Time is built with `Breakfast 8:00 · Lunch 13:00` (mixed 12h/24h). Pick one style (see section 3).
- Medical-adjacent copy is correct (no diagnosing), but too long: health blurb, fasting refusals and RESTRICTIVE_NOTE run 30+ words. Keep one idea per sentence.
- Reasons built by `.toLowerCase()` ("Not Jain (onion)") break in other languages and read oddly: "yes" / "not vegetarian (chicken)". Return a code plus params and let t() build the sentence.
- Dish names are English only. Ingredients lists ("flattened rice", "greek yogurt") are shown in the cook screen; translate with a second dictionary keyed by ingredient.
- Pantry means a store room in English; in Hindi it is unnatural. Use "रसोई का सामान" or "राशन" (used in hi.json). Consider "Kitchen stock" or "Groceries at home" in English too.

## 2. The 25 worst strings and rewrites
| # | Where | Current | Problem | Rewrite |
|---|---|---|---|---|
| 1 | Today, banner | "Safe mode is on" | OS jargon, sounds like a fault | "Taking it easy today" |
| 2 | Profile, button hint | "Safe mode: gentle food, fluids first, goals paused" | jargon, "goals paused" is cold | "Light food and plenty of fluids. Targets are on hold." |
| 3 | Profile / Onboarding | "Safety floor is on" | engineer term, scary | "We will never plan too little food for you" |
| 4 | Profile | "EatOS never plans below {n} kcal a day and never suggests skipping meals..." | numeric, long | "EatOS always plans enough food for the day. For a medical diet, please follow your doctor's advice." |
| 5 | Today, header status | "System steady" / "Slightly behind" / "Needs attention" | "System", "Needs attention" sounds alarming | "All good" / "A little behind" / "Please eat something soon" |
| 6 | Today, task chip | "NOW · CORE / GOAL / TREAT" and "P0..P3" | priority classes leak, "Treat" judges food | Drop it. Show "Now" only. Never show P-numbers |
| 7 | Today, reasons | "Folded in", "Queued", "Missed" | scheduler states | "Added to dinner", "Coming up", "Not eaten" |
| 8 | Today, list heading | "Why the plan changed" with "14:30-CALENDAR" source in caps | log-like | "What changed today" and sentence case sources |
| 9 | Scheduler | "Wind down, no caffeine" | idiom, unclear | "Time to relax. No tea or coffee now." |
| 10 | Scheduler | "Drink 250 ml water" | fine but metric only | "Have a glass of water (250 ml)" |
| 11 | Scheduler reason | "Rolled into the next water check" | system voice | "Included in your next water reminder" |
| 12 | Scheduler reason | "Missed. The next meal makes up for it" | scolding feel ("Missed") | "No worries, your next meal covers it" |
| 13 | Health check | "Enough to eat" + "You have eaten very little today. A proper meal comes first." | "very little" is accusatory | "Time for a good meal. You have had little food today." |
| 14 | Recommend reason | "{n} g protein closes today's gap" | "gap", numbers | "Good protein for today" |
| 15 | Recommend reason | "Fits your {rule}" via toLowerCase -> "Fits your no onion or garlic" | broken grammar | "Follows your no-onion-garlic rule" |
| 16 | Ask | "Read on this device ({reason})" and "Claude was not used: {reason}" | raw technical reason text leaks | "Worked out on your phone" / "Smart help is off right now" |
| 17 | Ask | "What EatOS used" / "Biggest need right now: protein" | abstract | "How we chose these" and "You need more protein today" |
| 18 | Ask | "Nothing fits those limits. Try a longer time or fewer exclusions." | "exclusions", "limits" | "Nothing matched. Try giving more time, or remove one thing you do not want." |
| 19 | Ask / Wishes | "Not for me" / "Never for me" | fine tone, but three near-identical buttons | "Skip this" / "Never show again" |
| 20 | Wishes | "Blockers" labels "Health: ..." with "Nothing is in the way." | "blockers" model leak | "Why this is hard for you" and "Good news, this is fine for you." |
| 21 | Aspire | "Does the same job", "Same job", "ladder" titles | OS/product language | "Similar choice", "A close match" |
| 22 | Aspire | "It does not sit well with what you told EatOS about your health, so it ranks low rather than being ruled out." | 26 words, "ranks" | "Not the best fit for your health, so we show it lower." |
| 23 | Onboarding | "Medication taken with breakfast (optional)" and "SETUP · STEP 2 OF 5" | caps, formal | "Any medicine you take with breakfast? (optional)" and "Step 2 of 5" |
| 24 | Protection | "Encrypt your meal log, health data and saved keys with a passphrase." / "Encrypting…" | "encrypt", "keys", "passphrase" | "Lock your food and health information with a password. If you forget it, nobody can get it back, so keep a backup." |
| 25 | Integrations / Sync | "Paste a menu as JSON", "Import an .ics file", "{n} events stored on this device", "event log", "Connect your world" | file formats, "events", vague | "Paste the menu text", "Add from your calendar app", "{n} records saved on this phone", "Connect your apps" |

Also fix (next 10): "Batch" -> "Cook once"; "Cook with what's expiring" -> "Use these up first"; "Health data and wearables" -> "Health apps and watch"; "Hide numbers" -> "Show simple progress"; "Model" -> hide behind "Advanced"; "Delivery menus" -> "Food orders"; "Show me how" -> "How to make it"; "Choose for me" -> "You pick for me"; "Appearance / System" -> "Look / Same as phone"; "Added {n} busy times" -> "Added {n} busy slots".

## 3. India formatting
- Currency: always `₹` before the number, no decimals for food (`₹349`), paise only if non-zero. Replace the `£` in integrations.tsx. Use `Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', maximumFractionDigits:0})`.
- Digit grouping (lakh/crore): `en-IN` gives 1,00,000 and 12,34,567. In Hindi use `hi-IN` locale but keep Latin digits (0-9); do not switch to Devanagari digits by default. Say "1 लाख" only in text, never in tables.
- Date: DD/MM/YYYY (05/10/2026), long form "5 अक्टूबर 2026" / "5 Oct 2026". Never MM/DD. Week starts Monday for the plan view; Sunday is acceptable in calendar pickers.
- Time: show 12-hour with am/pm in the UI ("1:00 pm", "सुबह 8:00"); store and parse in 24h/UTC. Onboarding currently prints "Breakfast 8:00 · Lunch 13:00" which mixes both; use "8:00 am, 1:00 pm, 5:00 pm, 6:30 pm". Hindi day parts: सुबह, दोपहर, शाम, रात.
- Timezone: India is a single zone (UTC+5:30, no DST). `localOffset()` is fine; default tzOffsetMin to 330 when missing.
- Units: metric only. Weight kg, water ml or glass (1 glass = 250 ml, add "गिलास"), grocery grams/kg, litres. Avoid "oz", "cups". Rice and dal are bought in kg; spices in 50 g; milk in litres or "packets".
- Energy: show "kcal" (Hindi "कैलोरी" is what people say). Protein "g" -> "ग्राम".
- Decimal: use dot. Phone numbers (if added) +91 and 10 digits.
- Numerals in Hindi UI: use Western digits for quantities, prices and times (the common choice in Indian apps).

## 4. Hindi translation notes
- Register: spoken Hindi, short sentences, respectful "आप". Avoid शुद्ध forms: "उपलब्ध", "प्राप्त", "आवश्यक", "अनुशंसित". Prefer "ज़रूरी", "मिला", "सुझाव".
- Kept as common English in Devanagari or Roman: EatOS, Claude, JSON, CSV, API, Apple Health, kcal. Food words are Hindi: राशन, दाल, पनीर, पोहा. Technical words use everyday ones: "पासवर्ड", "बैकअप", "सिंक", "फ़ोन" (all common).
- Gender: first-person verbs with unknown gender use "खा चुका/चुकी हूँ" in hi.json. Better is a gender-neutral rewrite ("यह खाना हो गया") before shipping.
- "Pantry" -> "रसोई का सामान"; "Household" -> "परिवार"; "Safe mode" -> "हल्का खाना मोड" (rewrite per section 2 first, then retranslate).
- Fasting words: व्रत for Navratri, Ekadashi, Shravan; रोज़ा for Ramzan. Do not use one word for both.
- Weekday short forms in hi.json: रवि सोम मंगल बुध गुरु शुक्र शनि.
- Have a native 60+ reader review the rewrites in section 2 (not just the literal ones), especially health and safety messages.
- hi.json keys use named placeholders ({n}, {name}, {items}) in place of the template-literal expressions in source, e.g. "Added {n} new records..." Plural pairs are separate keys ("{n} dish skipped..." / "{n} dishes skipped...") because Hindi plural rules differ (0 and 1 are both singular). Keys that depend on `.toLowerCase()` are dynamic and need refactoring to codes.
- Not yet covered: ~40 strings whose source lines were long and truncated in extraction (health blurb, QuickAdd extras, a few aria labels) and cook-step text inside recipe data. Re-run extraction after the t() migration; unknown keys fall back to English, so nothing breaks.

## 5. Minimum viable i18n (Expo / React Native web)
Goals: tiny, no library, English fallback, language in settings.
1. `apps/app/src/i18n.ts` (about 30 lines):
```ts
import hi from '../i18n/hi.json';
const dicts: Record<string, Record<string,string>> = { en: {}, hi };
let lang = 'en';
export const setLang = (l: string) => { lang = l; };
export function t(en: string, vars?: Record<string, string|number>): string {
  const s = (dicts[lang]?.[en]) ?? en;
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s;
}
```
2. Language lives in profile settings (`settings.lang`, default from `navigator.language` if starts with `hi`, else `en`). Put it in the existing React context in kernel.tsx so a change re-renders. Add a "Language / भाषा" row at the top of Profile and on the first onboarding screen (bilingual label, because the user may not read English).
3. Wrap every literal: `<Txt>{t('Ask EatOS')}</Txt>`; templates become `t('{n} items', {n})`. A codemod or a lint rule that flags raw JSX text prevents drift.
4. Kernel stays English-free long term: have core return `{code, params}` for reasons (e.g. `{code:'protein_gap', g:24}`) and let the app map to t() keys. Short term, translate the produced English string verbatim through t(); it works for fixed strings and fails only for composed ones (section 4).
5. Dish names: `tDish(id, fallbackName)` reads `hi-dishes.json`; ingredients through the same pattern. Search should match both scripts.
6. Fonts: Geist has no Devanagari. Load Noto Sans Devanagari (Google Fonts, weights 400/500/700) and set it as fallback in theme.tsx; raise line-height about 1.5 and base size 16-17 px. Remove uppercase/letter-spacing for Indic scripts. Allow about 30% longer strings; test buttons at 360 px width.
7. Dates and numbers via `Intl` with `en-IN` / `hi-IN`; set `<html lang>`.
8. CI check: a script that fails if a key in hi.json is not found in source, and reports source strings without Hindi (coverage %).

## 6. Plan for Tamil, Bengali, Marathi, Telugu, Kannada
| Order | Language | Why | Notes |
|---|---|---|---|
| 1 | Marathi | Mumbai/Pune metro users; close to Hindi, same script (Devanagari) so no font work | Fasting words (उपवास), Maharashtrian dish names already in data |
| 2 | Bengali | Kolkata; large Bengali dish set already in india.ts | Own script, Noto Sans Bengali; fish rule vs "no meat" wording needs care |
| 3 | Tamil | Chennai, Bengaluru | Noto Sans Tamil; agglutinative, long strings; use "அரிசி/சாம்பார்" for food words |
| 4 | Telugu | Hyderabad | Noto Sans Telugu; Hyderabadi/Andhra dishes exist |
| 5 | Kannada | Bengaluru | Noto Sans Kannada; Karnataka cuisine already tagged |
Steps per language: (a) freeze English keys after the Hindi migration; (b) machine-draft from hi.json plus English with an LLM, then (c) two native reviewers (one under 35, one over 60) check health and safety strings first; (d) translate dish and ingredient dictionaries; (e) add font subset; (f) ship behind the language picker with English fallback so partial coverage is safe; (g) launch when coverage of top 150 UI strings is over 95%.
Extra checks per language: plural forms, honorific "you", gender-neutral verbs, fasting vocabulary (Navratri/Ekadashi/Ramzan equivalents), and region-specific units for grocery ("sher", "padi" are not used; stay metric).
Also add Gujarati and Punjabi later: the Jain/Gujarati and Punjabi food sets are already large.
