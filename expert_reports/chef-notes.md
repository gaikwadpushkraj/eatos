# Chef notes: india.ts ingredient and metadata problems

Steps for all 112 dishes are in chef-steps.json. Steps use only listed ingredients plus water, oil, ghee and salt. Exceptions are marked "(needs)" below, where the real recipe cannot work without an unlisted item.

## A. Cross-cutting problems (affect many dishes)
1. Core spices are missing almost everywhere: turmeric, red chilli powder, coriander powder, garam masala. Dal, rajma, chole, curries and sabzis are bland without them. Add them as ingredients (none are allergens).
2. Hing (asafoetida) is usually compounded with wheat flour. It appears in dishes with no gluten allergen: idli-chutney-jain, poha-jain, moong-chilla-jain, dhokla, dal-rice-jain, paneer-bhurji-jain, lauki-roti, khichdi-kadhi, rasam-rice-satvik, sambar-rice-satvik, pav-bhaji-jain. Either add a note or gluten-free hing guidance, or tag gluten for strict celiac filters.
3. Egg dishes carry diet "vegetarian": egg-bhurji, egg-curry-rice, boiled-eggs, maggi-veg. They are eggetarian. Check that the vegetarian filter and the egg allergen filter agree on this.
4. Ginger and garlic are called "paste" in the real recipes but are listed only in some dishes. Dishes whose real recipe uses ginger-garlic and lists neither: tandoori-chicken-salad (marinade needs ginger, garlic), paneer-tikka-salad (ginger, garlic), soya-chaap-roll, kathi-roll-paneer, dal-tadka-rice (ginger), sambar-rice (none, fine), chole-roti ok, paneer-bhurji-roti (ginger).
5. Dairy hidden in oil/fat: jalebi lists ghee but allergens is only gluten. Add dairy.

## B. Per-dish ingredient corrections (dish id, missing, why)
| id | missing | why |
|---|---|---|
| thepla | allergen sesame | lists sesame seeds but allergens only gluten, dairy |
| aloo-posto | allergen should be poppy not sesame | poppy seeds listed; sesame is not an ingredient. Add a poppy/seed allergen or drop sesame |
| thukpa | allergen soy | soy sauce listed; also soy sauce contains wheat (gluten ok) |
| maggi-veg | allergen soy possible | instant noodle tastemaker often has soy; check |
| jalebi | allergen dairy | ghee listed |
| dhokla | baking soda or fruit salt (needs) | batter will not rise without it. Also curd or sugar commonly used |
| gulab-jamun | baking soda (needs) | needed to soften; step uses a pinch |
| mishti-doi | none | but no-cook tag is wrong, see section C |
| rosogolla | milk | real rosogolla is made from curdled milk (chenna), not shop paneer |
| veg-biryani, chicken-biryani, mutton-biryani | saffron, mint, whole spices, lemon | defining flavours; also green chilli |
| nihari-roti | nihari masala, wheat/atta thickener | atta is listed as a roti ingredient; mention both |
| haleem | barley, chana dal, lentils, garam masala, lemon | haleem is a multi-grain dish; only wheat and toor dal listed |
| chole-roti, chole-kulcha | tea leaves (chole-roti), tomato paste ok | chole-kulcha lists tea; chole-roti does not, so colour will differ |
| dal-makhani-roti | none, ok | cream and butter listed |
| palak-paneer-roti | cream/ginger | ginger and cream are customary |
| butter-chicken-naan | kasuri methi, cashew paste | customary; cashew would add a nuts allergen |
| misal-pav | farsan contains besan (fine), goda masala, tamarind | tamarind absent |
| pongal | toor dal, tomato, tamarind, drumstick | name says "with sambar" but no sambar ingredients are listed |
| medu-vada | none for vada; sambar needs tamarind, sambar powder | sambar spice missing |
| puliyodarai | urad dal, chana dal, sesame oil | typical tempering dals missing |
| curd-rice | pickle | name says "with pickle" but no pickle listed |
| veg-biryani / millet-pulao | variantOf | millet-pulao has variantOf veg-biryani; veg-pulao is the correct parent |
| kosha-mangsho-luchi | curd, mustard | real recipe uses curd and sugar |
| mirchi-salan-rice | coconut, curd, cumin | customary; coconut is a high-allergen item for some |
| sarson-saag-makki | green chilli | customary |
| chingri-malai-curry | no turmeric/chilli | add turmeric; shellfish allergen present, good |
| samosa | cumin, coriander seeds, chaat masala | flavour; 5 min prep is wrong, see below |
| kuttu-roti-aloo, samak-pulao, sabudana-* | green chilli | commonly used in fasting but optional |
| rajma-chawal, chole-roti, bhindi-roti, soya-chunk-curry | turmeric, chilli powder | for colour and heat |

## C. Name, cuisine, slot and tag problems
- curd-rice: tagged no-cook but classic version needs cooked rice and a heated tempering. I wrote heat-free steps from leftover cooked rice; the tag is arguably still fine only for leftover rice.
- makhana-roasted: tagged no-cook but the name says roasted and prepMin is 8. I wrote steps using ready-roasted makhana. If you want a real roast, remove the no-cook tag.
- mishti-doi: tagged no-cook with prepMin 2, but real mishti doi needs boiled milk, caramelised jaggery and 6-8 hours setting. I wrote a quick no-heat version; consider removing the no-cook tag or renaming to "quick mishti doi".
- rosogolla: tagged no-cook with prepMin 1; the real dish is boiled in syrup for 15-20 minutes and takes about 45 minutes. I wrote a no-heat paneer ball version; recommend removing no-cook and setting prepMin to 45, or renaming.
- Unrealistic prepMin: samosa (5, real 45), gulab-jamun (5, real 35), jalebi (5, real 30 plus resting), chikki (1, real 15), phirni (30 but sets 2 hours), khichuri-begun ok.
- millet-pulao: variantOf points at veg-biryani; should be veg-pulao.
- nihari-roti: cuisine hyderabadi; nihari is Delhi/Lucknow (north-indian/mughlai).
- phirni, sheer-khurma, seviyan: cuisine hyderabadi; these are north-indian/mughlai. Seekh kebab is also mughlai/north-indian rather than hyderabadi.
- tandoori-chicken-salad: name says "Grilled chicken tikka"; id says tandoori. Pick one.
- thukpa: cuisine northeast; Himalayan/Tibetan origin, acceptable.
- sabudana-vada, kuttu-roti-aloo, samak-pulao, makhana-kheer, fruit-chaat, sweet-potato-chaat: no "fasting"/"vrat" tag exists. Add one so the fasting filter does not rely only on ingredient names.
- ragi-malt, sattu-drink, curd-poha: slot B/S/D labels fine.
- veg-pulao: vegan filter fine; has curd raita listed in name, curd listed.

## D. Jain/satvik/no-onion-garlic audit
- Jain-named dishes (idli-chutney-jain, poha-jain, moong-chilla-jain, dal-rice-jain, paneer-bhurji-jain, pav-bhaji-jain, rasam-rice-satvik, sambar-rice-satvik): no onion, garlic or root vegetables in the ingredient lists and none in my steps. pav-bhaji-jain lists cauliflower (some Jains avoid) and the potato is replaced with raw banana; ok.
- khichdi-kadhi lists ginger (a root); khichuri-begun lists ginger and potatoes. Neither is named Jain, so fine, but they will be excluded by a strict Jain filter, correctly.
- Dishes named "no onion" in spirit but with onion listed: none found.

## E. Method limits
- Dishes with unlisted ingredients in steps: dhokla and gulab-jamun (baking soda), dal-makhani-roti (none), misal-pav (none). All other steps stay within the listed ingredients plus water, oil, ghee, salt.
