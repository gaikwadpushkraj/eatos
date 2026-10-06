# Chef notes for india2.ts (60 dishes)

Steps are in chef-steps-2.json. Recipes use only listed ingredients plus water, oil, ghee and salt (ghee is dairy; flagged where it is not listed).

| Dish id | Problem | Fix |
|---|---|---|
| parotta-egg-roast, masala-omelette, anda-paratha | Diet "vegetarian" but contains eggs | Add an "eggetarian" diet value, or tag as omnivore; keep the egg allergen |
| parotta-egg-roast | Real parotta uses milk/ghee/egg in the dough; allergens list only egg and gluten | Add dairy to ingredients and allergens, or note the dough is vegan in this version |
| dal-palak-rice | Turmeric missing; dal without it is bland | Add turmeric to the ingredients |
| thalipeeth | Bhajani flour is a mix of wheat, chana, urad and jowar; allergens omit gluten | Add gluten to allergens |
| undhiyu, bisi-bele-bath, gutti-vankaya-rice, khandvi, cabbage-thoran-rice, neer-dosa, akki-roti, uttapam, puttu-kadala, meen-curry-kerala, goan-fish-curry-rice, dalma-rice | Coconut is a tree nut for some filters; only bisi-bele-bath lists nuts (cashew) | Decide on a rule (coconut flagged as nuts or not) and apply it consistently |
| gajar-halwa, rice-kheer, suji-halwa, rava-idli, bisi-bele-bath | Cashews/almonds/pistachios appear in "nuts"; nut-free users can skip them, but they are not marked optional | Mark nuts as optional garnish, or keep the allergen |
| masala-chai | Biscuits listed with "wheat flour" as a separate ingredient; biscuits also contain butter/milk | Merge to "biscuits", add dairy-free caveat |
| vada-pav | Pav is usually made with milk/butter; diet is vegan | Mark vegan only for bakery pav without milk |
| bombay-sandwich | Diet vegetarian: cheese may use animal rennet | Note vegetarian cheese |
| veg-momos | Soy sauce contains wheat; sesame oil; sesame/soy flagged but wheat is covered by maida | Fine; add a note |
| pani-puri | Black salt and tamarind fine; puri fried: oil use is high | Note deep-fry; no ingredient fix |
| puri-aloo, pani-puri, vada-pav, kachori-sabzi, dahi-vada | Deep-frying (2 cups oil) is a hazard for beginners | Add a safety note: dry the food, never leave hot oil unattended |
| kadhi-pakora-rice, dal-palak-rice, mixed-veg-roti | Missing red chilli/coriander powder for typical flavour | Optional; recipe works without |
| baingan-bharta-roti, aloo-gobi-roti, others | No oil listed; steps use oil/ghee (allowed) | Fine |
| litti-chokha, dal-baati-churma | Need an oven (200 C) or covered pan; induction method is slow | Steps give pan option; mark as oven dish |
| puran-poli | Real recipes often use maida; chana dal needs overnight soak optional | Fine; no change |
| masor-tenga-rice, goan-fish-curry-rice, meen-curry-kerala | Fish-only allergen; raw-fish hygiene | Steps include hygiene and doneness; add shellfish note if prawns used |
| pork-vindaloo-rice, rogan-josh-rice, chicken-chettinad-rice | Meat; pork flagged omnivore with no pork-free marker | Add "contains pork" tag for halal/religious filters |
| pakhala-bhata | Fermented rice overnight: bacterial risk; vegetarian but listed dairy via curd only | Steps cover storage; add a safety note |
| khandvi, handvo | Buttermilk/curd dairy flagged; sesame flagged | OK |
| gujarati-dal-bhat | Dish is Jain-unfriendly only by ginger; wheat/dairy/peanut flagged | Fine |
| litti-chokha, sattu-paratha, thalipeeth, gutti-vankaya-rice, aloo-gobi-roti etc. | Onion and garlic present: no Jain/no-onion-garlic variant | Add a diet tag or Jain flag for these |
| varan-bhat, tomato-soup | Ghee/butter fine; tomato-soup has no cream (fine) | None |
| rava-idli | Toor dal listed but real rava idli uses chana dal for tempering; sambar powder missing | Used toor dal for the sambar; add sambar powder |
| gatte-sabzi-roti | Gatte needs ajwain/red chilli; asafoetida present | OK |
| ragi-mudde-saaru | Ragi is gluten-free but is often milled with wheat | Add a gluten cross-contact note |
| sweet-lassi | Cardamom only; no sweet spice problem | None |
