# EatOS

An operating system that helps you decide what to eat.

EatOS treats a person, and the household and kitchen around them, the way
an operating system treats hardware. Food, water and time are the
resources it schedules. It runs scheduled tasks (meals, water,
medication), reacts to events (a meeting, a workout, a bad night's sleep,
illness), re-prioritises when the day changes, resolves priority
inversions, runs health checks, keeps memory of what you like, and does
housekeeping on your pantry. The apps show this as calm, plain-language
recommendations.

## What's in the repo

| Path | What it is |
|---|---|
| `packages/core` | `@eatos/core`, the kernel: pure TypeScript, no I/O, fully tested |
| `apps/api` | HTTP server exposing the kernel's syscalls |
| `apps/app` | Expo app for iOS, Android and web, with the kernel on the device |
| `docs/PLAN.md` | Phases, sprints and tasks |
| `docs/ARCHITECTURE.md` | How the pieces fit and the rules behind each OS concept |
| `docs/tickets/` | The plan as GitHub-issue-ready tickets |

## Quick start

```bash
pnpm install
pnpm test          # all unit tests
pnpm typecheck
pnpm simulate      # run a synthetic household through a day
pnpm api           # start the API on http://localhost:8787
pnpm --filter @eatos/app web   # run the app in a browser
```

Requires Node 22 and pnpm 10.

## Principles

- **Policy vs mechanism.** The kernel decides which need to serve and
  when. The recommender decides which food serves it.
- **Event sourced.** Everything is an event; state is rebuilt from the log.
- **One kernel, many shells.** Web, mobile and the API run the same code.
- **Safety first.** Allergies and medication are hard rules, and EatOS
  never plans below a healthy minimum.
- **Private by default.** Data stays on the device unless you sync it.
- **No paid services.** Ask EatOS uses a local rule-based parser.

EatOS gives general wellness suggestions. It is not medical advice.
