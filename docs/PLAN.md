# EatOS delivery plan

EatOS is a recommendation engine built like an operating system. The
"hardware" is a human body and the people and kitchen around it; food,
water and time are the resources it schedules. The OS is the backend
(the kernel); the apps (mobile and web) are thin shells that show its
behaviour in plain language.

This file is the source of truth for the GitHub issues. Each phase is an
epic issue, each task is a sub-issue labelled with its phase and sprint.

## Principles

1. **Policy vs mechanism.** The kernel decides *which need* to serve
   *when*. The recommender decides *which food* serves it.
2. **Event sourced.** Every fact (ate, drank, slept, trained, calendar
   changed) is an event. State is derived from the log, so sync, undo and
   tests are simple.
3. **One kernel, many shells.** `@eatos/core` is pure TypeScript with no
   I/O. The API server and the app both run the same code.
4. **Safety first.** P0 needs (allergies, medication with food) are hard
   constraints. A safety floor means EatOS never recommends eating below
   a healthy minimum. Pleasure (P3) is a real need, not waste.
5. **Private by default.** Data lives on the device; the server is
   optional.
6. **No paid services.** Everything runs locally. "Ask EatOS" uses a
   rule-based parser, with an LLM adapter left as a later option.

## Priority classes

| Class | Meaning | Examples | Deadline |
|---|---|---|---|
| P0 | Safety | allergies, medication with food, low blood sugar | hard |
| P1 | Physiological | hydration, energy, protein | firm |
| P2 | Goals | nutrition targets, training | soft |
| P3 | Experience | pleasure, culture, social meals | soft |

## OS concepts and their concrete rules

| Concept | Rule in code |
|---|---|
| Scheduled tasks | Daily routine builds meal, hydration and medication tasks with times and deadlines |
| Event tasks | `workout.completed`, `calendar.busy`, `illness.started` and similar events change the schedule |
| Re-prioritisation | Tasks are ordered by priority class, then earliest deadline (EDF) |
| Priority inversion | A low-priority snack within 2 h of a higher-priority meal uses appetite the meal needs. Resolution: priority inheritance; the snack is made light and serves the meal's need |
| Health checks | Hydration, protein and fibre progress against an expected curve for the time of day |
| Safe mode | Illness or crisis switches to gentle mode: no targets, simple foods, hydration first |
| Memory | Preference scores from feedback with exponential decay (60-day half-life); allergies never decay |
| Housekeeping | Expire pantry items, flag use-soon items, decay memory, compact old events |
| Household | Members with constraints; a dish must fit every eating member; conflicts are resolved with safe variants |

## Phases, sprints and tasks

### Phase 0: Foundation (Sprint 0)
- 0.1 Monorepo with pnpm workspaces, TypeScript, Vitest
- 0.2 Documentation: README, architecture, this plan
- 0.3 CI workflow: install, typecheck, test

### Phase 1: Kernel (Sprints 1 and 2)
Sprint 1
- 1.1 Domain types: priorities, tasks, events, profile, members, foods, pantry
- 1.2 Event log and state reducer (event sourcing)
- 1.3 Daily routine scheduler with scheduled tasks

Sprint 2
- 1.4 Interrupt handlers: calendar, workout, sleep, illness (safe mode)
- 1.5 Re-prioritisation (priority class + EDF) and priority inversion detection
- 1.6 Health checks and safety floor

### Phase 2: Intelligence (Sprint 3)
- 2.1 Seed food catalog with nutrients, tags, allergens and safe variants
- 2.2 Recommender: hard filters, soft scoring, reasons
- 2.3 Preference memory with decay and feedback
- 2.4 Housekeeping: pantry expiry, use-soon, compaction
- 2.5 Household fit matrix and conflict resolution
- 2.6 "Ask EatOS" rule-based query parser
- 2.7 Day simulator CLI for a synthetic human

### Phase 3: API (Sprint 4)
- 3.1 HTTP server exposing kernel syscalls (`/v1/events`, `/v1/next`, `/v1/schedule`, `/v1/health`, `/v1/recommend`, `/v1/ask`, `/v1/state`)
- 3.2 Per-user event log persistence (JSON files)
- 3.3 API tests

### Phase 4: App shell, mobile and web (Sprints 5 and 6)
Sprint 5
- 4.1 Expo app (iOS, Android, web) with the kernel on the device
- 4.2 Theme tokens (light and dark) from the design
- 4.3 Onboarding (who's eating, diet, allergies)
- 4.4 Now screen and Ask screen

Sprint 6
- 4.5 Plan, Grocery and Pantry screens
- 4.6 Cooking, Household and Profile screens
- 4.7 Responsive web layout (dashboard on wide screens)
- 4.8 Local persistence of the event log

### Phase 5: Sync and integrations (Sprints 7 and 8, done)
- 5.1 Device to server sync of event logs (done)
- 5.2 Calendar driver (done)
- 5.3 Health data and wearable drivers (done)
- 5.4 Grocery and delivery drivers (done)
- 5.5 Optional LLM adapter for Ask EatOS (done)

### Phase 6: Hardening and release (Sprint 9)
- 6.1 Encryption at rest and data export or delete
- 6.2 Accessibility audit (done)
- 6.3 End-to-end tests (done)
- 6.4 Release pipeline: app config, icons, EAS, Pages, Docker, release guide (done)
- 6.5 Publish to the app stores and turn on Pages (owner action: needs your accounts)

### Phase 7: Food intelligence for the Indian metro (Sprints 10 to 12, done)
- 7.1 Research: wants, needs and blocked wishes (docs/research)
- 7.2 Indian dish catalogue
- 7.3 Constraint engine and safety gates
- 7.4 Fasting days
- 7.5 Context: season, hour, kitchen, night routines
- 7.6 Taste profile and taste cards
- 7.7 Wishes and alternatives
- 7.8 App: Your food, fasting, wish list, taste cards, household rules
- 7.9 Persona agents and fixes (persona_reports)

### Phase 8: Experts and round 2 personas (Sprints 13 and 14, done)
- 8.1 More personas and experts
- 8.2 Security hardening
- 8.3 Safety: allergens from ingredients, hidden gluten, new conditions
- 8.4 Sunrise and sunset, time zones
- 8.5 Hindi UI and onboarding
- 8.6 Catalogue growth and chef steps

## Definition of done
- Code is typed, tested with Vitest and passes `pnpm -r typecheck` and `pnpm -r test`.
- Behaviour matches the rules in this file.
- The issue is closed with a link to the commit.
