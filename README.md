# EatOS

An operating system that helps you decide what to eat.

EatOS treats a person, and the household and kitchen around them, the way
an operating system treats hardware. Food, water and time are the
resources it schedules. It runs scheduled tasks (meals, water,
medication), reacts to events (a meeting, a workout, a bad night's sleep,
illness), re-prioritises when the day changes, resolves priority
inversions, runs health checks, remembers what you like, and does
housekeeping on your pantry. The apps show this as calm, plain-language
recommendations.

## What it does

- **Plans your day** from your routine and adapts it when things change: a meeting moves dinner, a long workout adds a recovery snack, short sleep brings the wind-down forward, illness switches on a gentle safe mode.
- **Recommends food with reasons**, never breaking an allergy or diet for anyone eating, using what is in your pantry and what is about to expire.
- **Looks after a household**: each person's needs, a table of who each dinner works for, and "two wishes, one meal" swaps such as a nut-free pesto.
- **Plans the week**, with batch cooking, and builds the grocery list.
- **Ask EatOS** in plain words ("something warm, 15 minutes, no rice"). It works on the device with no network; you can optionally let Claude read it with your own key.
- **Connects to your day**: calendar (.ics), Apple Health export or CSV, grocery receipts, delivery menus.
- **Stays private**: data lives on your device, optionally encrypted with a passphrase; sync to your own server is off by default. Export, encrypted backups, restore and full delete are built in.
- **Works for everyone**: WCAG AA checked on every screen, light and dark, 44 px targets, keyboard focus.

EatOS gives general wellness suggestions. It is not medical advice.

## What's in the repo

| Path | What it is |
|---|---|
| `packages/core` | `@eatos/core`, the kernel: pure TypeScript, no I/O, heavily tested |
| `apps/api` | Optional HTTP server for syncing devices, with encrypted storage |
| `apps/app` | Expo app for iOS, Android and web, with the kernel on the device |
| `docs/PLAN.md` | Phases, sprints and tasks |
| `docs/ARCHITECTURE.md` | How the pieces fit and the rules behind each OS concept |
| `docs/SECURITY.md` | What is protected, how, and the known limits |
| `docs/ACCESSIBILITY.md` | What is checked automatically and what to try by hand |
| `docs/RELEASE.md` | Shipping the web app, the mobile apps and the API |
| `docs/tickets/` | The plan as tickets, kept in step with the GitHub issues by `scripts/sync-issues.mjs` |

## Quick start

```bash
pnpm install
pnpm test          # kernel and API unit tests
pnpm typecheck
pnpm simulate      # run a synthetic household through a day
pnpm --filter @eatos/app web   # run the app in a browser
pnpm api           # start the sync server on http://localhost:8787
pnpm e2e           # build the web app, drive it in Chromium, audit accessibility
```

Requires Node 22 and pnpm 10. For mobile, run `pnpm --filter @eatos/app ios` or `android`.

## Principles

- **Policy vs mechanism.** The kernel decides which need to serve and
  when. The recommender decides which food serves it.
- **Event sourced.** Everything is an event; state is rebuilt from the log.
- **One kernel, many shells.** Web, mobile and the API run the same code.
- **Safety first.** Allergies and medication are hard rules, EatOS never
  plans below a healthy minimum, and unknown allergen information counts
  as unsafe.
- **Private by default.** Data stays on the device unless you sync it.
- **Nothing outside the kernel is trusted.** Every event from sync,
  backups, imports or storage is validated before it can run.
- **No paid services needed.** Everything works locally; Claude for Ask is
  an optional extra with your own key.
