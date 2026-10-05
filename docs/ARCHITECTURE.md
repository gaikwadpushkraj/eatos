# EatOS architecture

```
              ┌────────────────────── shells ──────────────────────┐
              │  apps/app (Expo: iOS, Android, web)   apps/api (HTTP) │
              └───────────────┬───────────────────────────┬────────┘
                              │   syscalls (Kernel class) │
┌─────────────────────────────▼───────────────────────────▼──────────┐
│ @eatos/core                                                         │
│                                                                     │
│  event log ──► state (reduce/replay)                                │
│                  │                                                  │
│   policy         ▼                         mechanism                │
│  ┌───────────────────────────┐            ┌──────────────────────┐  │
│  │ scheduler                 │  need ───► │ recommender          │  │
│  │  routine tasks            │            │  hard filters        │  │
│  │  interrupts               │            │  soft scoring        │  │
│  │  inversion resolution     │            │  reasons             │  │
│  │  progress / EDF ordering  │            └──────────────────────┘  │
│  └───────────────────────────┘                    ▲                 │
│  health checks · memory · housekeeping · household · ask · plan     │
└─────────────────────────────────────────────────────────────────────┘
```

## Modules (`packages/core/src`)

| Module | Responsibility |
|---|---|
| `types.ts` | Priorities P0–P3, tasks, events, members, foods, pantry |
| `state.ts` | Event-sourced state: `reduce`, `replay`, day filters |
| `scheduler.ts` | Builds the day: routine → interrupts → inversions → progress |
| `health.ts` | Targets, intake, watchdog checks, safety floor, safe mode |
| `recommend.ts` | Food choice for a need with reasons; "Choose for me" |
| `memory.ts` | Preference scores with 60-day half-life; "never" for a year |
| `housekeeping.ts` | Pantry expiry, use-soon, garbage collection, log compaction |
| `household.ts` | Fit matrix, hard vs soft constraints, conflict resolution |
| `ask.ts` | Rule-based natural language → query |
| `plan.ts` | Weekly plan with batch cooking, grocery list |
| `explain.ts` | "Why the plan changed" log |
| `kernel.ts` | The `Kernel` facade: the only API shells use |

## Scheduler pipeline

1. **Routine tasks.** Meals at routine times (breakfast, lunch, dinner P1;
   snack P3), medication P0 with a 30-minute deadline, hydration
   checkpoints every 3 hours, wind down at bedtime minus 90 minutes.
2. **Interrupts.**
   - `calendar.busy` overlapping a meal or medication moves it to 30
     minutes after the end, with a reason.
   - `workout.completed` (45+ min or high intensity) adds a P2 recovery
     snack unless a main meal is within 90 minutes; it also raises
     protein (+20 g) and water (+500 ml per hour) targets.
   - `sleep.logged` under 7 hours raises the wind down to P2.
   - `illness.started` turns on safe mode: no snack, gentle meals,
     hydration becomes P0, goals pause.
3. **Priority inversion.** A P3 snack up to 2 hours before a
   higher-priority meal would use the appetite that meal needs. The snack
   inherits the meal's priority, is marked light and serves the current
   biggest nutrient gap. Within 45 minutes it is folded into the meal.
4. **Progress.** Tasks become done from `task.done`, slot intake,
   `medication.taken` or water totals. Missed water checkpoints roll into
   the latest one. Among due tasks, the first by priority class then
   earliest deadline (EDF) is active.

## Safety rules

- Allergens and diet are hard filters for every member who is eating.
- The energy floor check goes critical if, late in the day, intake is
  far below a healthy minimum; the UI then puts a proper meal first.
- EatOS never suggests skipping a meal or eating less as a goal.
- In safe mode goals are paused.

## Shells

- **API** (`apps/api`): `node:http`, one JSON event log per user on disk.
- **App** (`apps/app`): Expo Router, kernel runs on the device, event log
  in local storage, responsive layout (dashboard on wide screens).

## Sync (`packages/core/src/sync.ts`)

Sync is off by default. When a device turns it on with a server address
and a sync code, it runs one round shortly after every change and once a
minute:

1. The device sends the events the server does not have yet (tracked as
   a set of known ids) together with its `cursor` and `epoch`.
2. The server appends new events in arrival order, skipping ids it
   already has. An event's position in that order is its sequence number.
3. The server returns every event after the device's cursor, except the
   ones the device just sent, plus the new cursor.
4. The device merges them with `Kernel.merge`: a union by id, replayed in
   time order. Both devices end with the same log, so the same schedule.

When the server compacts a log it starts a new `epoch`; a device on an
old epoch gets the full log back. Events loaded without an id get a
stable id hashed from their content, so every device names them the
same way. A second device can join from onboarding with the same code.

## Drivers (`packages/core/src/drivers`)

Drivers turn outside data into ordinary events, so the kernel never
needs to know where something came from. Each driver gives its events
stable ids derived from the source record, which makes every import
idempotent and lets it sync across devices like any other event.

| Driver | Input | Events |
|---|---|---|
| `ics.ts` | iCalendar text | `calendar.busy` (free/busy only; titles are opt-in) |
| `health-import.ts` | Apple Health `export.xml` or CSV | `workout.completed`, `sleep.logged`, `water.logged` |
| `receipt.ts` | Receipt text | `pantry.added` with place and use-by date |
| `delivery.ts` | Menu JSON | ranked options; `intake.logged` for an order |

Safety rule for delivery: a dish with no allergen information is
treated as unsafe for anyone with an allergy, and a dish with no diet
stated is unsafe for anyone on a restricted diet.
