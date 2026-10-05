# Indian metro food needs: culture, region, taste

Scope note: about 12 web searches (search snippets only, little full-page fetching). Items marked "[background]" come from general domain knowledge, not from a fetched source, and need verification before being used as fact. Most gaps are in the Gaps subsections.

## 1. Regional/community food patterns and fasting rules a recommender must model (with concrete rules)

### Takeaway
Diet is not a single "veg/non-veg" flag. Self-identified vegetarianism, actual meat restriction (day-based or occasional), religious abstention (Jain root-vegetable rules, Navratri/Shravan rules) and region/community all interact. Non-veg is a majority behaviour in India overall, but with sharp state, religion and gender gradients. Fasting calendars need hard filters (ingredients allowed or not) layered on soft preferences.

### Cited Findings
- Prevalence, self-identification (Pew 2021, 29,999 face-to-face interviews, 26 states): 39% of Indian adults call themselves vegetarian. 44% of Hindus and 92% of Jains do. 81% follow some meat restriction (certain meats and/or certain days), including 97% of Jains and about two thirds of Muslims (67%) and Christians (66%). — [Pew Research, Religion and Food](https://www.pewresearch.org/religion/2021/06/29/religion-and-food/); [Pew short read](https://www.pewresearch.org/short-reads/2021/07/08/eight-in-ten-indians-limit-meat-in-their-diets-and-four-in-ten-consider-themselves-vegetarian/)
- Root vegetables (Pew): 67% of Jains abstain, as do about 21% of Hindus and 18% of Sikhs. Rationale: uprooting kills the whole plant. — [Pew](https://www.pewresearch.org/short-reads/2021/07/08/eight-in-ten-indians-limit-meat-in-their-diets-and-four-in-ten-consider-themselves-vegetarian/)
- Jain rules (secondary source): most Jains avoid meat, fish and eggs (dairy allowed). Many avoid all or some root vegetables (potato, carrot, onion; garlic), and some avoid figs and honey on the argument that they harbour nigod (microscopic life). Some avoid green vegetables on certain tithis and during Paryushan or Das Lakshan. — [Wikipedia, Jain vegetarianism (search result)](https://www.wikipedia.com/wiki/Jain_diet)
- NFHS-5 (2019-21) weekly-or-more consumption of fish/chicken/meat, by sex and state: Kerala 93% of women and 90% of men; Punjab 4% and 10%. Gujarat 39% of women and 51% of men; Madhya Pradesh 53.6% and 66%. Egg consumption (daily, weekly or occasionally): 84.7% of men, 72% of women. Note that this is an advocacy-site secondary summary of NFHS tables; NFHS "non-veg" counts occasional eaters. — [Sabrang summary of NFHS-5](https://sabrangindia.in/article/nfhs-5-data-busts-right-wing-myth-indian-vegetarianism/); [Wikipedia, Non-vegetarian food in India](https://en.wikipedia.org/wiki/Non-vegetarian_food_in_India)
- NFHS-5 by religion (any non-veg): Christian men 80% and women 78%; Muslim men 79.5% and women 70.2%; Hindu men 52.5% and women 40.7%. — [Sabrang](https://sabrangindia.in/article/nfhs-5-data-busts-right-wing-myth-indian-vegetarianism/)
- SRS Baseline Survey 2014 (older than the 2018 preference): about 71% of Indians aged 15+ are non-vegetarian (about 29% vegetarian). Vegetarian shares: Rajasthan 73.2% of men and 76.6% of women; Haryana 68.5% and 70%; Punjab 65.5% and 68%. SRS counts are self-report. — [YourStory on SRS 2014](https://yourstory.com/2016/07/india-non-vegetarian/)
- Navratri vrat rules (popular recipe/health sites; practice varies by family and region):
  - Allowed: sabudana, kuttu (buckwheat), rajgira (amaranth), samak/sama rice (barnyard millet), potato and other vegetables, fruit, dairy, nuts, sendha namak (rock salt), and chilli, jeera, coriander and tomato in many households.
  - Avoided: wheat, ordinary rice and flours, sooji, lentils and legumes, onion and garlic (tamasic), and table salt. Many lists also exclude turmeric, hing, mustard, methi seed and garam masala, but sources disagree on spices.
  — [Veg Recipes of India](https://www.vegrecipesofindia.com/navratri-fasting-rules-vrat-ka-khana/); [The Quint](https://www.thequint.com/fit/navratri-2022-foods-and-eat-and-avoid-during-navratri-fast); [Medanta](https://www.medanta.org/patient-education-blog/what-to-eat-and-avoid-for-healthy-fasting-during-navratri). Swiggy publishes Navratri/vrat thali content ([Swiggy blog](https://blog.swiggy.com/?p=21353)).
- Shravan (a month): parents and elders advise against meat, fish and eggs, and often onion and garlic. In some homes even potato, carrot, radish, colocasia and sweet potato are avoided. Goan Hindus drop fish curry-rice for the month, and Goan restaurants run daily-changing Shravan thalis popular with the young and with office-goers. — [Women's Web](https://womensweb.in/?p=136074); [Herald Goa](https://www.heraldgoa.in/cafe/the-veggie-month-has-begun/28183); [The Goan](https://www.thegoan.net/tg-life-sunday/shravan-goes-trendy-youth-embrace-vegetarian-meals/134200.html)
- Ramzan demand: Swiggy sold close to 6 million biryani plates during Ramzan 2024 (+15% vs regular months), with Hyderabad over 1 million. — [Outlook Business](https://www.outlookbusiness.com/companies/swiggy-sold-close-to-6-million-biriyani-during-ramzan)
- Delivery-partner religion can matter to some customers during Sawan (a customer refused an order for this reason). This is anecdotal and relevant to trust/sourcing signals. — [search snippet, Tribune/Women's Web](https://womensweb.in/?p=136074)

### Inferences
- Model at least these layers: (a) base diet type: Jain / strict veg / ovo-veg / non-veg with day-restrictions / non-veg. (b) Per-person restricted ingredient sets (Jain: no root vegetables, onion, garlic, often no honey; some avoid after sunset, [background]). (c) A temporary fasting-mode calendar with ingredient allow-lists (vrat) versus deny-lists (Shravan, Lent, Chaturmas). (d) Region/community cuisine affinity as soft priors.
- "Veg" in surveys is not the same as strict veg. Many "non-veg" users are occasional eaters (for example no meat on Tuesdays/Thursdays, during Shravan or Navratri, or at home but not outside), so a calendar-aware and context-aware flag (home vs outside) beats a static label.
- Vrat allow-lists differ by family, so let users edit rules (for example whether haldi, hing or tomato are allowed) instead of hard-coding them.
- Metro priors likely differ from national ones: Hyderabad, Kolkata and Chennai are likely non-veg heavy, Mumbai and Delhi mixed, Bengaluru mixed with a large veg order share (see section 6). [Not verified at city level.]

### Gaps
- City-level NFHS-5/SRS vegetarian prevalence for the 7 metros was not found. NFHS data are state or district level and the districts need pulling from the DHS data directly.
- Primary-source Jain rules (sunset eating/chauvihar, Paryushan fasting types, Ekadashi rules for Vaishnavas, Lent practice for Mumbai/Goan/Mangalorean/Kerala Christians, Ramzan roza timings of sehri/iftar, Bengali Hindu rules for Ekadashi or Durga Puja, Tamil and Kerala Hindu rules for Puratasi/Aadi/Karthigai/Sabarimala vratham) were not retrieved. Treat these as to-research. Common knowledge [background] only: roza from dawn to sunset with dates/fruit at iftar; Lent often means no meat on Fridays and for some the whole period; Ekadashi means no grains or beans for many Vaishnavas.
- Regional staple and cuisine details (rice-south/east, wheat-north/west, millet-Maharashtra/Karnataka/Rajasthan, fish-Bengal/Konkan/Kerala, etc.) were not sourced in this pass.
- Verification of the Navratri spice list (turmeric, hing) from a ritual authority was not done.

## 2. What drives craving and food choice (upbringing, memory, mood, stress, weather, social context)

### Takeaway
Direct, citable evidence for Indian metro residents on craving drivers was thin in this pass. Qualitative migrant studies show food as a belonging and memory carrier, and delivery-platform data show social, time-of-day, festival and weather-linked ordering patterns.

### Cited Findings
- A qualitative study of 30 in-depth interviews with Indian migrants in the Netherlands found food from home, cooking practices, food sharing and family relationships as central themes. Food and its memories anchor belonging, and commensality with co-ethnics builds community. — [The migrant suitcase: food, belonging and commensality among Indian migrants in the Netherlands (Appetite, per search listing)](https://search.fid-benelux.de/Record/base-27602616). This is an international sample and not metro-India internal migrants.
- Sensory and gustatory nostalgia can revive a "lost land" through repeated cooking practices. — [Migration and Food Culture, Uni Hildesheim](https://www.uni-hildesheim.de/migramedia/wp-content/uploads/2024/09/Migration-and-Food-Culture.pdf)
- Meal-timing/stress/social: Swiggy reports late-night orders (midnight to 2 am) growing about 3x faster than dinner orders, led by chicken burgers, biryani, pizza, cakes and soft drinks. Bengaluru leads late-night parties, followed by Mumbai, Delhi and Pune. — [Swiggy HowIndiaSwiggyd 2025](https://www.swiggy.com/corporate/press-release/how-india-swiggyd-2025-a-feast-for-the-fast-the-foodie-and-the-future/); [Storyboard18](https://www.storyboard18.com/trending/biryani-tops-indias-food-orders-again-as-swiggy-logs-93-million-plates-in-2025-86559.htm)
- Chai ordering: India ordered about 3x as much chai as other drinks (Swiggy report). — [Curly Tales](https://curlytales.com/india/food/india-ordered-chai-more-than-other-drinks-global-food-orders-see-rise-swiggy-report/amp/)
- Festival-linked demand: Ramzan biryani spike (+15%). — [Outlook Business](https://www.outlookbusiness.com/companies/swiggy-sold-close-to-6-million-biriyani-during-ramzan)

### Inferences
- Comfort food for a migrant is plausibly identity-specific (mother's dal-chawal, curd rice, fish curry-rice, rajma-chawal, khichdi), so a recommender should capture "home region plus the family's community" explicitly and not infer it from the city of residence.
- Late-night, party and stress-eating skews to fast-food categories, which matters for health-aware nudging. This is correlational platform data.
- Weather (monsoon pakoda/chai, summer chaas/lassi/mango, winter gajar halwa/sarson) and mood effects are widely believed [background] but I did not find Indian peer-reviewed support. Weather and festival context should be a feature, but its weights have to be learned from user behaviour.

### Gaps
- No peer-reviewed Indian studies on craving, stress-eating or emotional eating among metro adults were located (Appetite/Nutrients searches not run in depth). A targeted search ("emotional eating India Appetite", "comfort food India questionnaire", "monsoon food craving") is recommended.
- Upbringing/childhood food-preference formation (flavour imprinting, family meal rules) for India was not found.

## 3. What metro Indians wish to eat but can't, and what alternatives work

### Takeaway
Evidence found is mostly indirect: official guidance on what to cut (sugar, salt, ultra-processed foods), platform data showing growth of "healthy" orders, and rising late-night junk. Direct survey evidence on suppressed wants (family opposition, cook limits, ingredient access) was not found.

### Cited Findings
- ICMR-NIN 2024 (17 guidelines): estimates 56.4% of India's disease burden is attributable to unhealthy diets. Advises minimising high-fat, high-sugar and ultra-processed foods, added salt of at most 5 g/day, and avoiding protein supplements for muscle-building. A sugar intake of 20-25 g/day is cited by one outlet. — [The South First](https://thesouthfirst.com/news/icmr-releases-dietary-guidelines-for-indians-after-13-years-says-no-to-protein-supplements); [Daily Pioneer](https://www.dailypioneer.com/2024/columnists/key-takeaways-from-icmr---s-new-dietary-guidelines.html); [GKToday](https://www.gktoday.in/icmr-releases-new-dietary-guidelines/); official PDF: [NIN](https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI24thJune2024fin.pdf) (not read in full)
- Swiggy: health-focused orders (protein, low-calorie, less added sugar) grew 2.3x faster than overall orders in 2025. — [Swiggy press release](https://www.swiggy.com/corporate/press-release/how-india-swiggyd-2025-a-feast-for-the-fast-the-foodie-and-the-future/)
- A survey of urban millennials in Delhi, Mumbai, Bengaluru and Kolkata (Euromonitor/PepsiCo India, over 1,000 respondents aged 18-50, an industry-sponsored study) found 71% leaning toward fad diets (keto, intermittent fasting, detox), and 44% skipped breakfast or delayed meals during COVID. — [Business Today](https://www.businesstoday.in/amp/lifestyle/food/story/44-urban-millennials-skipped-breakfast-during-covid-19-pandemic-study-307568-2021-09-24)
- ICMR-NIN's guidance has itself been criticised for food bias (regional or cultural). — [The South First](https://thesouthfirst.com/south-shots/dietary-guidelines-of-icmr-nin-exhibit-food-bias/) (not read in detail)

### Inferences
- Likely constraint types for the engine to model: health (diabetes/BP/PCOS/cholesterol, which are very common among metro adults [background]), time, cook availability or skill, ingredient access (for example fresh fish in Delhi, or regional greens), family opposition (for example beef/pork/non-veg in the kitchen, onion-garlic in a Jain house, eggs in a veg house), and budget.
- Workable alternatives to propose (design suggestions, not evidence): lighter versions of cravings (tandoor/air-fry instead of fried; millet or brown-rice biryani; curd-based gravies), "outside only" non-veg for veg homes, vrat-compliant versions of comfort foods, protein from dal, paneer, soy, curd and eggs before supplements (consistent with the ICMR-NIN stance), quick-commerce for ingredient gaps.

### Gaps
- No primary survey on "want but can't eat" with reasons. Needs user research (the product's own onboarding questions) or a targeted review (for example Indian studies on household food conflict, tenant discrimination in non-veg food, housing-society veg-only rules).
- Budget elasticity by city was not retrieved.

## 4. Prevalence numbers (NFHS-5, NSSO/HCES, ICMR-NIN) for vegetarianism, meal skipping, outside eating

### Takeaway
Vegetarianism: about 29% (SRS 2014 self-report), 39% (Pew 2021 self-ID), with larger shares of men and women reporting at least occasional non-veg in NFHS-5. Urban food is about 39% of spending (HCES 2022-23), with processed food and beverages as the largest single food category. Breakfast skipping among urban adults is roughly 1 in 4 to 44% depending on study.

### Cited Findings
- HCES 2022-23 urban: food is about 39% of monthly per capita consumption expenditure (non-food 60.83%, up from 51.94% in 1999). "Beverages, refreshments and processed food" is the largest food category at 10.64%, then milk and milk products at 7.22%, with fruit and vegetables each around 3.8%. Conveyance is the top non-food item in urban areas. — [MoSPI press brief](https://mospi.gov.in/sites/default/files/press_release/Draft_Press_Brief19062024.pdf); [Drishti IAS summary](https://www.drishtiias.com/current-affairs-news-analysis-editorials/news-analysis/10-06-2024/print/manual); [Outlook Money](https://www.outlookmoney.com/spend/household-food-spending-rises-but-remains-below-50-per-cent). The same MoSPI series continued with HCES 2023-24 ([press note](https://www.mospi.gov.in/sites/default/files/press_release/HCES_Press_Note_2023-24_27122024_rev.pdf), not read).
- Breakfast skipping: about 1 in 4 urban Indians claim to skip breakfast, about 72% have a nutritionally inadequate breakfast, men skip more than women, and "no time" and "not hungry" are the most common reasons. — [Kellogg's India page, industry source](https://www.kelloggs.com/en-in/health-and-nutrition/breakfast-consumption-patterns-in-india.html); [FoodNavigator 2013 study, older](https://www.foodnavigator.com/Article/2013/08/27/Research-finds-urban-Indians-have-little-time-for-healthy-breakfasts/); 44% of urban millennials skipped breakfast during COVID (Euromonitor/PepsiCo) — [Business Today](https://www.businesstoday.in/amp/lifestyle/food/story/44-urban-millennials-skipped-breakfast-during-covid-19-pandemic-study-307568-2021-09-24)
- Market scale: India's online food delivery market is about USD 45.15B in 2024 (IMARC estimate, growing about 23% CAGR); Swiggy and Zomato control over 80% of platform-to-consumer deliveries. — [IMARC](https://www.imarcgroup.com/online-food-delivery-market-india); [Nexdigm](https://www.nexdigm.com/market-research/report-store/india-food-delivery-market-report/). Treat market-research-firm numbers as low-confidence.
- ICMR-NIN: unhealthy diets are linked to 56.4% of disease burden (see section 3).

### Inferences
- The 29% (2014) vs 39% (2021) vs NFHS "any non-veg weekly" figures are not contradictory: they measure different things (self-ID, any consumption, weekly consumption). The engine should use the behavioural definition, not self-ID.
- HCES shows the urban shift toward processed and out-of-home-adjacent food, which supports a recommender targeting convenience.

### Gaps
- Not retrieved: HCES out-of-home or restaurant-meal share by metro; NFHS-5 urban-only vegetarian figures; ICMR-NIN or NNMB data on meal-skipping prevalence; ICMR-INDIAB or NNMB meal patterns; direct eating-out frequency surveys. The MoSPI PDFs and the NIN PDF should be fetched for exact tables.
- All breakfast-skipping figures are from industry or college-level surveys. No nationally representative figure was found.

## 5. Meal structure, tiffin/dabba culture, home cooks, household dynamics, taste dimensions

### Takeaway
Only the dabbawala/tiffin facts were sourced in this pass. Thali structure, meal timing, the maid/cook relationship, joint vs nuclear conflicts and taste dimensions are mostly [background] and need research.

### Cited Findings
- Mumbai's roughly 5,000 dabbawalas carry about 200,000 tiffins daily from home kitchens, traditionally cooked by wives or mothers, to offices. The system dates from 1880, with a Harvard-cited error rate of about 3.4 in a million. — [Feedr](https://feedr.co/en-gb-blog/the-amazing-dabbawalas-of-mumbai); [Wikipedia, Dabbawala](https://wikipedia.com/wiki/Dabbawala). Figures are widely repeated and old; the current volume after COVID is uncertain.
- Swiggy "Late Night Eats" now operates across 4,000+ office locations, which shows that office food is a delivery segment. — [Restaurant India](https://www.restaurantindia.in/news/restaurant-india-news-swiggy-introduces-late-night-eats-across-4000-office-locations-in-india.n16635)

### Inferences
- [Background, unverified] Typical structure: tea and light breakfast (idli/dosa, poha/upma, paratha, bread-egg, luchi), a lunch with rice or roti plus dal, sabzi, curd and pickle, evening chai and snacks, then a dinner at 8-10 pm. Metros skew later than small towns.
- [Background] Cook/maid dynamics: many metro households employ part-time cooks, and the cook's repertoire, time slot and the household's rules (no onion-garlic, no beef, no egg) constrain what is made. A recommender should allow "cook-made" vs "self-cooked" vs "ordered" as meal sources and present recipes that a cook can follow (simple instructions, Hindi/regional-language support).
- [Background] In joint households and mixed-preference families, a base meal with per-person variants (veg base plus a non-veg add-on cooked separately, Jain-safe portion set aside before onion/garlic) works better than separate meals.
- [Background] Taste dimensions to encode: spice heat (high in Andhra/Telangana/Kolhapur, mild in Gujarat/Bengali mustard-heat), sweet (Gujarati dal, Bengali), sour/tang (tamarind, kokum, amchur, curd in the south and west), pungency (mustard oil), texture (crisp, soft, gravy-rich), and fermentation. None of this was sourced here.

### Gaps
- No sourced numbers on cook employment in metro households, thali composition norms, meal timing (NNMB/ICMR time-use), joint/nuclear share by metro (Census/NFHS household data could provide), or spice-tolerance studies.
- Dabba culture beyond Mumbai (Bengaluru, Delhi tiffin services, home-chef platforms) was not researched.

## 6. Delivery-app behaviour, eating-out and foodie culture

### Takeaway
Swiggy's annual reports are the most concrete behavioural source: biryani leads for ten years, a large vegetarian segment exists, quick commerce is growing quickly, and metro-specific differences are visible.

### Cited Findings
- Swiggy 2025 (HowIndiaSwiggyd): biryani is the top dish for the tenth year with 93M orders (57.7M chicken biryani); burgers 44.2M; pizza 40.1M; veg dosa 26.2M. Health-focused orders growing 2.3x faster than overall; late-night orders growing about 3x faster than dinner. Mumbai had the top individual customer (3,196 orders). — [Swiggy](https://www.swiggy.com/corporate/press-release/how-india-swiggyd-2025-a-feast-for-the-fast-the-foodie-and-the-future/); [Storyboard18](https://www.storyboard18.com/trending/biryani-tops-indias-food-orders-again-as-swiggy-logs-93-million-plates-in-2025-86559.htm). These are platform self-published numbers.
- Swiggy 2024: 83M biryani orders (Jan 1 to Nov 22); Hyderabad leads with 1.57 crore (15.7M) biryani orders. Hyderabad places third in vegetarian orders (Bengaluru first, Mumbai second) in a Swiggy "Green Dot" ranking; Hyderabad tops dosa orders in the morning (17.54 lakh a year). In 2023 Indians ordered about 2.5 biryanis per second, and about every sixth biryani order was from Hyderabad. — [ETV Bharat, Dec 2024](https://etvbharat.com/en/!bharat/biryani-tops-swiggy-2024-food-charts-with-83-million-orders-hyderabad-leads-enn24122501729); [ETV Bharat, Green Dot](https://etvbharat.com/en/!offbeat/swiggy-green-dot-award-hyderabad-3rd-position-most-vegetarian-orders-enn24080103513); [The South First](https://thesouthfirst.com/news/swiggy-india-report-2-5-biryanis-ordered-per-second-in-2023-every-6th-order-from-hyderabad)
- Quick commerce: Blinkit processed 424M orders in FY2025 vs Instamart 286M. Analyst forecasts put Blinkit's quick-commerce sales at about INR 268B in 2026 (from 52B in 2025) (forecast, uncertain). — [S&P Global](https://www.spglobal.com/market-intelligence/en/news-insights/research/2025/08/eternal-s-blinkit-outpaces-swiggy-s-instamart-in-quick-commerce-)
- Eating-out spend: a Pune diner spent INR 1.19 lakh on a Valentine's Day outing and Bengaluru and Mumbai diners had INR 3 lakh bills, showing high-end dining via the platform (outliers). — [Free Press Journal](https://www.freepressjournal.in/amp/pune/swiggys-2025-report-pune-diner-spends-119-lakh-on-a-single-outing)

### Inferences
- Platform data skews to online-active, higher-income users and to weekend/late-night orders; home-cooked and cook-made meals are invisible in it. Do not equate delivery rankings with what people actually eat.
- Likely segments: "daily-lunch-from-office-area vendors", "weekend foodie", "late-night snacker", "health-bowl/protein buyer", and "grocery-top-up via quick commerce". Quick commerce is likely to be used for ingredients and fruit as well as ready-to-eat items. [Not verified.]
- Foodie culture (reviews, Instagram, new cafes, regional-restaurant tourism) was not sourced here.

### Gaps
- No Zomato, Blinkit or Zepto behaviour reports were found, only Swiggy. Search for "Zomato Year in Review 2024/2025", "Blinkit/Zepto Instamart order basket report", "Zomato pure veg fleet" (Zomato's 2024 pure-veg fleet and its backlash is known as [background] but unsourced here), and "Redseer/BCG food delivery".
- City-by-city dish rankings across Delhi, Chennai, Kolkata and Pune were not retrieved. Eating-out frequency and average ticket size by metro were not found.
- Out-of-home eating frequency by metro (for example from HCES unit-level data or NFHS) not found.
