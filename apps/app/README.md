# @eatos/app

One Expo app for iOS, Android and web. The EatOS kernel (`@eatos/core`)
runs on the device; only the event log is stored (AsyncStorage).

```bash
pnpm --filter @eatos/app web        # browser
pnpm --filter @eatos/app ios        # simulator (macOS)
pnpm --filter @eatos/app android
pnpm --filter @eatos/app build:web  # static export to dist/
pnpm --filter @eatos/app smoke      # Playwright walk-through of dist/, screenshots in dist-shots/
```

Screens follow the EatOS design canvas: onboarding, Now (dashboard on
wide screens), Ask, Cooking, Plan, Grocery, Pantry, Household, Profile,
with light and dark themes.
