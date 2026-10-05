# Food preference modelling, health-aware recommenders and responsible data collection (on-device, privacy-first, urban India)

Research note: about 14 tool calls, mostly search snippets plus two fetches. Two attempted fetches failed or were only partly readable (Yum-me PDF unreadable). Items from my background knowledge are never put in Cited Findings. They appear only in Inferences or Gaps, marked "(background, unverified)".

## Q1. Which preference-elicitation methods work best with few questions, and how to combine stated preference, behaviour and context into a score?

### Takeaway
Visual and pairwise or item-wise comparison quizzes (PlateClick, Yum-me) are the best-evidenced way to bootstrap food taste in about 15 interactions or fewer. Active learning picks the next question. No source found gives a validated formula for fusing stated, revealed and contextual signals, so the fusion in Inferences is a design proposal to A/B test, not literature.

### Cited Findings
- PlateClick bootstraps food preference with a visual quiz using pairwise image comparison. It uses a CNN-learned similarity metric between food images. It learns from a small number of interactions (15 or fewer) and is described as suitable for large item sets. — [PlateClick summary via search (KU research profile)](https://researchprofiles.ku.dk/da/publications/plateclick-bootstrapping-food-preferences-through-an-adaptive-vis/)
- Yum-me is a nutrient-based meal recommender. It elicits preference from visual food comparisons, learns online from item-wise and pairwise image comparisons, and combines this with the user's nutrition goals. — [Yum-me, arXiv 1605.07722](https://arxiv.org/pdf/1605.07722) (quantitative results not extracted; PDF unreadable via fetch)
- An explainable active-learning preference elicitation method for food selects which items to show in order to maximise information gain with minimal user effort. — [Explainable Active Learning for Preference Elicitation, arXiv 2309.00356](https://ar5iv.labs.arxiv.org/html/2309.00356)
- A food recommendation survey frames the pipeline as framework, existing solutions and challenges, and covers cold start, health and context. — [Food Recommendation: Framework, Existing Solutions and Challenges, arXiv 1905.06269](https://arxiv.org/pdf/1905.06269)
- Popularity bias in recommenders can increase cultural overrepresentation, so a naive popularity prior is risky for Indian regional cuisines. — [search summary of arXiv 2406.09496 and related work](https://arxiv.org/abs/2406.09496v4)

### Inferences
- Suggested onboarding elicitation, which fits offline TypeScript:
  - Run about 10 to 15 adaptive pairwise or swipe cards on dish photos, drawn from a curated Indian-dish catalogue with precomputed feature vectors (cuisine, main ingredient, spice level, texture, cooking method, veg/non-veg).
  - No CNN is needed on device. Use hand-built or precomputed embeddings plus a Bayesian logistic or Bradley-Terry update over about 20 to 40 features.
  - Pick the next pair by maximum expected information gain or uncertainty, with a diversity term.
  - Treat "never" as a separate hard-constraint tap, not as a very low score.
- Proposed score, to be A/B tested: `score(dish, context) = hardFilter × [ w_taste·P(like) + w_hab·habit(dish, slot) + w_ctx·fit(time, effort, budget, weather, day-type) + w_health·gapFill(dish) + w_novel·explore ] − penalty(recent repeat)`.
  - Weights shift from stated taste at day 0 toward revealed behaviour (choices, "ate this", skips) after about 2 to 3 weeks.
  - Use Thompson sampling or a decaying prior for exploration.
  - Stated "would eat" and revealed "did eat" are kept as separate parameters per dish. Their gap is the "wish but can't" signal (Q2).
- A single scalar per dish hides the reason for a reject. Store a reason code (taste, effort, time, cost, ingredient missing, health, family) with each rejection, and update the matching sub-model.

### Gaps
- No quantitative accuracy or question-count results extracted for Yum-me or PlateClick. Fetch of the Yum-me PDF failed, so check the papers directly.
- No source found on how well Western food-image similarity transfers to Indian dishes. This is a likely failure mode, because Indian dishes of different textures and gravies look alike.
- No literature found on fusing stated, revealed and contextual preference into one score. Swipe versus rating comparisons for food were not located in this pass.

## Q2. How should a recommender represent hard constraints, soft preferences and blocked aspirations, and what alternatives should be shown?

### Takeaway
Use three explicit layers: hard constraints (filter), soft preferences (score), and a "blocked aspiration" record (a wanted item plus the blocking reason). Alternatives come from substitution within the blocked reason, using sensory and nutrient similarity. The literature in this pass confirms that most health recommenders are accuracy-evaluated and diabetes-centred. It gave no direct evidence on blocked-aspiration modelling, so that part is design inference.

### Cited Findings
- Systematic review of diet-related health recommender systems for chronic conditions: 15 studies from 2010 to 2024, mainly targeting diabetes (60%) and hypertension (40%). 80% were evaluated online or offline, with accuracy the most common criterion, and no study examined effects on dietary behaviour over time. — [Scoping review summary (nutrition-evidence.com)](https://nutrition-evidence.com/article/544703/diet-related-health-recommender-systems-for-patients-with-chronic-health-conditions-scoping-review)
- Systematic review of food recommenders for diabetic patients. — [PMC10001611](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10001611/)
- Food recommendation work covers preference, health and context together, and includes tracking and persuasion functions. — [Food Recommendation: Framework, Existing Solutions and Challenges](https://arxiv.org/pdf/1905.06269)
- The DPDP Act 2023 requires consent to be free, specific, informed, unconditional and unambiguous, and as easy to withdraw as to give. This applies to storing any constraint, especially health or religious ones. — [KPMG decoding DPDP Act](https://assets.kpmg.com/content/dam/kpmg/in/pdf/2023/08/decoding-the-digital-personal-data-protection-act-2023.pdf)

### Inferences
- Constraint taxonomy for the data model. All are on-device, versioned and user-editable.
  - Hard, absolute: allergy, medical exclusion, religious or ethical rule (jain, no beef, no pork, satvik, fasting days such as Ekadashi or Navratri), veg or egg-ok. Stored as a rule that filters candidates before scoring. A violation should be impossible to recommend.
  - Hard, situational: no kitchen (hostel, PG), no refrigerator, hours free, budget cap, delivery-only, office canteen only, cooking skill. These are context-switched and expire or re-ask.
  - Soft preferences: taste and cuisine affinity, spice, texture. Scored with a weight.
  - Soft health goals: protein gap, fibre, sodium, sugar, a nudge toward the goal, never a gate. A health rule that is clinical (for example diabetes) needs a clear "confirm with clinician" label, and the system should not claim treatment.
  - Aspiration: "I wish I could eat X" where X is blocked. Store `{item, blocker_type, blocker_detail, last_seen, attempts}`.
- Blocker types for the gap model: cost, time, skill, equipment, availability, family or household veto, health advice, social or work setting, willpower or habit, taste mismatch with the healthier swap.
- Alternatives to show, ordered by how well they preserve what the person wanted:
  1. Same dish with a modified recipe that removes the blocker (for example less oil, air-fry, smaller portion).
  2. Near-neighbour dish with similar sensory profile (spice, texture, umami, crunch, gravy) and a better nutrient fit.
  3. Same nutritional job via a different food (for example a paneer, sprouts or curd route to protein).
  4. A "when" alternative: keep X but schedule it (weekend, post-workout).
  Show at most 3, with a one-line reason.
- Explainability: show the matched constraint or goal as the reason ("no onion-garlic, 10 min, protein 18 g"). This is cheap offline because the scorer is a transparent linear model.

### Gaps
- No source found in this pass on constraint-based or knowledge-based food recommenders at paper level (for example ontology-based or CSP approaches). Multi-objective Pareto approaches were not retrieved. Search again for RecSys, UMAP and Frontiers material if the report needs them.
- No evidence found on how "blocked aspiration" or "wish but can't" is modelled in published recommenders. It may be a novel feature.
- The diabetic and chronic-disease reviews are about patient populations. They do not show how a healthy-adult urban India user is served.

## Q3. Which validated short questionnaires could be adapted, and what is the minimal onboarding data set?

### Takeaway
Do not ship long clinical scales in onboarding. Use a handful of item-level questions inspired by validated tools: a food-group yes/no recall in the style of DQQ (29 items, 5 minutes, validated across more than 85 countries), a 2 to 4 item neophobia probe, and constraints. Licensing and validity of shortened or adapted items must be checked, and scale scores should not be presented as clinical results.

### Cited Findings
- The Diet Quality Questionnaire (DQQ) has 29 yes/no items on foods eaten the previous day or night. It gives indicators of nutrient adequacy and NCD risk, collects no portion data, takes about 5 minutes with country-adapted modules, and has been used in more than 85 countries in the Gallup World Poll. — [DQQ development, PMC11331720](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11331720/); [Nutrition Connect DQQ](https://nutritionconnect.org/resource-center/diet-quality-questionnaire)
- The Food Neophobia Scale (Pliner and Hobden, 1992, Appetite 19:105-120) is widely translated, but its factor structure is reported to be unstable across cultures. Short child versions exist (for example 8 items). — [UWindsor record](https://scholar.uwindsor.ca/psychologypub/39); [Frontiers in Nutrition 2024](https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2024.1356210/full)
- Validated Indian FFQs exist:
  - Trivandrum, South Kerala: 360-item FFQ validated in 460 participants against 7-day food records, with Spearman correlations of 0.72 for protein and 0.61 for carbohydrate. — [PMC7071154](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7071154/)
  - Semi-quantitative FFQ for urban and rural India: 530 factory workers and rural dwellers, validated against three 24-hour recalls, acceptable for group-level intake only. — [PubMed 22705424](https://pubmed.ncbi.nlm.nih.gov/22705424/)
  - A 92-item northern India FFQ, plus nutrient-specific FFQs for vitamin D and B12 (COIN-FFQ). — [search results](https://doaj.org/article/337445689d6e4769a737ee7a258cf7f5)
- PDQS validation found was in Ireland and the UK. A Global Diet Quality Score (GDQS) was validated in an Indian setting for the double burden of malnutrition. — [PDQS Ireland, PMC11704934](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11704934/); [PMC9460768](https://pmc.ncbi.nlm.nih.gov/articles/PMC9460768)
- The Indian Food Composition Tables 2017 (NIN) cover 528 key foods and 151 components from regional composite samples across six regions. They use a key-foods approach (foods contributing up to 75% of nutrient intake) and include vitamin D2, polyphenols, amino acid and fatty acid profiles. — [IFCT 2017 (India Environment Portal)](https://indiaenvironmentportal.org.in/reports-and-documents/indian-food-composition-tables-2017); [NIN PDF](https://nin.res.in/ebooks/IFCT2017.pdf)

### Inferences
- Minimal onboarding data set (target under 2 minutes, all skippable, all stored on device only):
  1. Diet identity and hard exclusions: veg, egg-ok, non-veg, jain; allergens; religious fasting days; medical exclusions (a free "something else" box).
  2. Household and setting: who cooks (self, cook, family, mostly outside), kitchen access, typical meals per day, approximate city.
  3. Time and effort cap per meal slot, and a rough budget band.
  4. 10 to 15 visual pairwise or swipe cards for taste (Q1), including spice tolerance.
  5. Optional: 2 to 3 neophobia-flavoured items ("I like trying new dishes", "I avoid foods I haven't had before") and a goal choice (more energy, protein, fewer cravings, "just ease of choosing"). Avoid weight-loss as a default goal (Q4).
  6. Optional 8 to 10 food-group yes/no recall in DQQ style, adapted to Indian foods, to seed a diet-gap profile. Do not ask for weight, height or BMI at onboarding.
- Defer and make optional: full FFQ (hundreds of items, burdensome, only group-level validity), 24-hour recall, TFEQ, Intuitive Eating Scale and AEBQ. If used at all, ask later and only for explicit self-insight. Never display a "disordered eating" score without a safety pathway.
- Because India-validated FFQ items are long, the practical route is to borrow food list structure and portion units (katori, roti count) from them rather than the instruments themselves. Check licence and permission for any adaptation.
- Nutrient lookups on device should use IFCT 2017 as the primary table, with recipe-level composition computed from ingredients. A bundled JSON of 528 foods with key nutrients is small enough for offline use.

### Gaps
- Not retrieved: Three-Factor Eating Questionnaire (including the 18-item revised version), Intuitive Eating Scale-2, Adult Eating Behaviour Questionnaire, HEI, Mediterranean-style scores and their short forms. Their item counts, licensing and Indian validity are unverified. (background, unverified: TFEQ-R18, IES-2 and AEBQ have shorter published forms, and AEBQ is free to use for research.)
- No source found for a PDQS validation specifically in India. The search suggests a gap, but absence of evidence is not proof.
- No validated Indian short-form (under 30 items) FFQ was found. The Indian FFQs found were 92 to 360 items.
- Whether Hindi, Tamil and other-language versions of FNS and the other scales exist or are valid was not verified.

## Q4. What behaviour-change and safety principles should govern the UX, avoiding harm?

### Takeaway
App-based dietary interventions produce small average effects with high dropout, and the techniques that appear most effective are goals and planning, feedback and monitoring, personalisation and natural consequences. Calorie-tracking apps are repeatedly associated with eating-disorder symptoms in correlational studies. So the design should favour planning, ease and food-first framing, and avoid calorie and weight counting by default.

### Cited Findings
- 2025 meta-analysis of app-based interventions toward healthier and more sustainable diets (21 studies, 15 RCTs): fruit and vegetables +0.48 portions/day (11,389 participants); meat -0.10 portions/day; legumes +0.02 (n.s.); dairy -0.15 (n.s.). Techniques with effectiveness ratios above 50% included goals and planning, natural consequences, feedback and monitoring, and personalisation. Messaging added a 0.24 portion meat reduction. There was significant heterogeneity, self-reported outcomes, high dropout, and poor socioeconomic reporting; the setting was high-income countries. — [PMC12487266](https://pmc.ncbi.nlm.nih.gov/articles/PMC12487266)
- A broader meta-analysis (41 studies, 6,348 participants) found positive effects on fruit and vegetable intake and small-to-moderate effects on obesity indices and clinical parameters. — [search summary, PMC12487266 listing](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12487266/)
- A web-based implementation-intention condition reduced self-reported saturated fat intake in one trial. — [JMIR 2011;13(4):e118](https://jmir.org/2011/4/e118/PDF)
- In 105 people with a diagnosed eating disorder, about 75% used MyFitnessPal and 73% of those said it contributed to their disorder, correlated with symptom severity. Another study in men found nearly 40% perceived it as contributing. These studies are retrospective, self-reported and cannot show causation. — [Levinson et al. 2017, PMC5700836](https://pmc.ncbi.nlm.nih.gov/articles/PMC5700836/); [National Elf Service summary](https://www.nationalelfservice.net/mental-health/eating-disorders/myfitnesspal-eating-disorders/)
- Among undergraduates, calorie tracking is associated with eating-disorder pathology. — [Center for Research summary](https://www.center4research.org/fitness-tracking-apps-eating-disorders/)
- No study in the diet-related health recommender review examined effects on behaviour over time. — [scoping review summary](https://nutrition-evidence.com/article/544703/diet-related-health-recommender-systems-for-patients-with-chronic-health-conditions-scoping-review)

### Inferences
- Principles, as design rules:
  - Default to food-first, not number-first. Do not show calories or macros by default. Offer them behind an opt-in with a plain-language warning, and never as red or green judgement.
  - No streak-shaming, weight targets, "cheat day" or "good and bad food" language, and no minimum-calorie or deficit suggestions. Do not use body-weight goals as a default setup.
  - Offer a quiet safety path: if a user enters restrictive patterns (very low intake, many excluded foods, repeated fasting, or tapping "I feel guilty"), switch to supportive wording and show helpline or clinician information. Detection must run on device. Do not diagnose.
  - Reduce decision load. Offer 3 options, not 30, as a default, plus a "surprise me" and a one-tap "same as yesterday". Choice overload and decision fatigue are well-known (background, unverified here), and small sets plus defaults are the usual design response.
  - Make-it-tiny habit design: a Fogg-style small action tied to an existing anchor ("after you put the kettle on, pick tomorrow's tiffin"). Combine with implementation-intention prompts ("If it's 7 pm and I'm tired, then I'll order X from my saved list"). The cited evidence for implementation intentions here is a single JMIR trial. Treat Fogg's model as unevidenced in this pass.
  - Prefer nudges that do not restrict choice: ordering, defaults, ease and visibility of the better option. Keep the user's override frictionless.
  - Honour "why people fail": when a user ignores a suggestion, ask a one-tap reason (Q2) rather than repeat it. Failing to follow advice is usually due to constraints (time, cost, family), not lack of knowledge.
  - Evaluate success by whether the user ate and felt OK, not by how many numbers hit target. Use ecological momentary assessment lightly (one question, at a chosen time, max once a day) and allow pausing. EMA cadence and burden evidence not retrieved.
- Passive signals (photos, receipts, wearables, SMS or UPI parsing): high privacy risk and high surveillance feel. On-device only, opt-in per source, and off by default. Photo logging is easier than text, but food-photo recognition models are Western-biased (Q5).

### Gaps
- No sources retrieved on orthorexia prevalence or screening (for example ORTO-15), TFEQ restraint-linked harms, or intuitive eating outcomes. Treat the orthorexia concern as a design caution only.
- No evidence retrieved on Fogg's model, nudging effect sizes, choice overload (Scheibehenne meta-analysis found a mean effect near zero in background knowledge, unverified), or decision fatigue. Cite carefully or fetch before publishing.
- Behaviour-change evidence is from high-income countries, mostly self-reported, with high heterogeneity. Transfer to urban India is untested.
- The MyFitnessPal findings are correlational and from clinical or student samples. They do not give a prevalence in the general public.
- No Indian-specific data was found on calorie-app harms.

## Q5. What do the best published health-aware food recommenders report for effectiveness, and what ethics, privacy and fairness constraints apply (DPDP, IFCT, cuisine bias)?

### Takeaway
Published health-aware recommenders are mostly validated by offline accuracy or short studies. The reviews found no long-term behavioural outcome evidence, so claims of effectiveness should be modest. DPDP obligations in India are being phased in through 2027, and food databases and models are Western-biased, which makes IFCT 2017 plus a community-built Indian catalogue a necessary base.

### Cited Findings
- Health recommender review: accuracy is the dominant evaluation criterion and no studies assessed dietary behaviour over time. — [scoping review summary](https://nutrition-evidence.com/article/544703/diet-related-health-recommender-systems-for-patients-with-chronic-health-conditions-scoping-review)
- Effectiveness of the closest general category (apps) is small: +0.48 fruit and vegetable portions per day. — [PMC12487266](https://pmc.ncbi.nlm.nih.gov/articles/PMC12487266)
- DPDP Rules 2025 were notified with a three-phase rollout. Rules 1, 2 and 17-21 are immediate. Consent Manager registration (Rule 4) applies from 13 November 2026. The remaining core obligations (notice, consent standards, security safeguards, breach intimation, data principal rights, retention and erasure, Significant Data Fiduciaries, children's data) apply from 13 May 2027. — [Storyboard18](https://www.storyboard18.com/amp/digital/breaking-govt-notifies-final-dpdp-rules-sets-staggered-rollout-with-key-obligations-for-data-fiduciaries-84201.htm); [compliancehub.wiki](https://compliancehub.wiki/india-dpdp-consent-manager-november-2026-phase-two-deadline-compliance/) (secondary sources, check the gazette text)
- DPDP consent must be free, specific, informed, unconditional and unambiguous, and withdrawable as easily as given. A child is a person under 18. Processing children's data needs verifiable parental consent, and tracking, behavioural monitoring and targeted advertising directed at children are prohibited. Exemptions exist for health professionals. — [KPMG](https://assets.kpmg.com/content/dam/kpmg/in/pdf/2023/08/decoding-the-digital-personal-data-protection-act-2023.pdf); [law.asia](https://law.asia/childrens-data-protection-dpdp-act/)
- Western and American cuisines dominate recipe datasets, and AI systems underperform on accuracy, representation and cultural sensitivity for non-Western cuisines. "The World Wide Recipe" proposes community-centred data collection (FAccT 2025 honourable mention). — [arXiv 2406.09496](https://arxiv.org/abs/2406.09496v4); [CISPA](https://cispa.de/en/research/publications/84822-the-world-wide-recipe-a-community-centred-framework-for-fine-grained-data-collection-and-regional-bias-operationalisation)
- IFCT 2017: 528 key foods, 151 components, data analysed rather than borrowed from other tables, regional composites. — [NIN IFCT 2017](https://nin.res.in/ebooks/IFCT2017.pdf); [India Environment Portal](https://indiaenvironmentportal.org.in/reports-and-documents/indian-food-composition-tables-2017)

### Inferences
- On-device, no-account architecture is the strongest data-minimisation story. If no personal data leaves the phone, the app may sit largely outside the fiduciary duties, but still apply the principles voluntarily (notice in plain language, per-purpose consent, easy delete and export). Legal review is needed because the status of purely local processing is not confirmed from the sources found.
- Treat dietary data revealing religion (jain, fasting), health (diabetes, allergies) and body measures as sensitive by design, even though the DPDP Act (as summarised) has no separate sensitive category. HIPAA-style sensitivity is a design choice, not a legal requirement in India (background, unverified).
- If cloud features are added later (sync, LLM calls, aggregate learning), use explicit opt-in, strip identifiers, and consider on-device federated or differentially-private aggregates. Under-18 users need an age gate, with no behavioural tracking.
- Fairness checks for the catalogue: audit coverage by region (north, south, east, west, north-east), community, and home-cooked versus restaurant dishes. IFCT's six-region composites help for raw foods, but mixed dishes and street food often need recipe-level estimates, so flag uncertain nutrient values and show ranges rather than false precision. Avoid popularity priors that bury regional food.
- Realistic effectiveness claim for the product: reduced decision effort and better dietary variety are plausible outcomes to measure. Do not claim disease management or weight outcomes.

### Gaps
- No primary-source text of the DPDP Act or Rules was fetched. The dates above are from secondary summaries. Check the official gazette for exact sections, especially on consent for health data, retention, and any exemption for purely local processing.
- WHO digital health ethics guidance was not retrieved.
- No published health-aware recommender with a randomised behavioural result was found in this pass. Specific systems such as Yum-me, and others from RecSys and UMAP, were not matched to effect sizes.
- Whether IFCT 2017 is available in a licensed machine-readable form was not checked. Usage terms for bundling it in an app are unknown.
- No source found on substitution science (nutrient-equivalent swaps, sensory similarity metrics) in this pass. Flavour-network and ingredient-substitution papers (for example food-pairing or substitute-prediction work) need a dedicated search.
