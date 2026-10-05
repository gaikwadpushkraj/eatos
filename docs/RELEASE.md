# Releasing EatOS

EatOS ships in three parts. Each can be released on its own.

| Part | Where it runs | How it ships |
|---|---|---|
| Web app | Any static host | `pnpm --filter @eatos/app build:web`, or the **Deploy web app** workflow (GitHub Pages) |
| Mobile apps | iOS and Android | EAS Build (Expo's cloud) |
| API (optional, for sync) | Your own server | Docker image, see below |

## Before every release

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test          # kernel and API unit tests
pnpm e2e           # builds the web app, drives it in Chromium, audits accessibility
```

CI runs the same on every push. Also try the manual checks in
[ACCESSIBILITY.md](ACCESSIBILITY.md) with a screen reader.

Bump the version in `apps/app/app.json` (`version`, `ios.buildNumber`,
`android.versionCode`) and tag it: `git tag v0.1.0 && git push --tags`.
The **Release** workflow then re-runs every check, builds the web app and
publishes a GitHub release with the web build attached.

## Web app

**GitHub Pages (automatic).** In the repository go to Settings > Pages and
set the source to *GitHub Actions*. Every push to `main` then builds with
`EXPO_BASE_URL=/<repo>` and publishes. The build copies `index.html` to
`404.html` so deep links such as `/plan` open the app.

**Any other host.** Build with `pnpm --filter @eatos/app build:web` and
upload `apps/app/dist`. If the site is not at the domain root, set
`EXPO_BASE_URL=/subpath` first. Serve `index.html` for unknown paths.

The web app stores data in the browser. It works without any server.

## Mobile apps (iOS and Android)

One-time setup, as the account owner:

1. Create an [Expo](https://expo.dev) account and run `npx eas-cli login`.
2. In `apps/app`, run `eas init` to link the project (this adds the project id to the config).
3. Choose your own bundle identifier if you do not control the
   `io.github.gaikwadpushkraj` namespace: edit `ios.bundleIdentifier` and
   `android.package` in `apps/app/app.json`.
4. Apple: an Apple Developer account. Google: a Play Console account.
   `eas credentials` creates and stores signing keys.
5. Store listing material is yours to provide: screenshots (the Playwright
   run saves phone and desktop ones in `apps/app/dist-shots`), description,
   privacy policy and age rating. See [SECURITY.md](SECURITY.md) for a
   plain statement of what data is stored and where.
6. **Export compliance (Apple) and data safety (Google).** The app encrypts
   data on the device with standard algorithms. Answer the stores'
   questionnaires yourself; they decide whether it needs a declaration.

Build and submit:

```bash
cd apps/app
eas build --profile preview --platform all      # test builds (Android APK, iOS internal)
eas build --profile production --platform all   # store builds, build numbers auto-increment
eas submit --platform ios
eas submit --platform android
```

The **Mobile build (EAS)** workflow does the build step from GitHub; add an
`EXPO_TOKEN` repository secret first.

Icons and the splash come from `apps/app/assets`. They are generated from
HTML so the artwork stays in the repo: `node apps/app/scripts/make-icons.mjs`.

## API (optional sync server)

The apps work fully offline and on one device. Run the API only if you
want your devices to stay in sync.

```bash
EATOS_DATA_KEY='a long random secret' docker compose up -d
```

- `EATOS_DATA_KEY` encrypts every user's file at rest. Keep it safe: without it the data cannot be read.
- `EATOS_CORS_ORIGIN` limits which web origin may call the API (default: any).
- Data lives in the `eatos-data` volume (`/data` in the container).
- The container listens on port 8787 over plain HTTP. **Put it behind HTTPS** (a reverse proxy such as Caddy or nginx) before using it outside your home network, and read the known limits in [SECURITY.md](SECURITY.md): the sync code identifies a user, it is not a login.

Without Docker: `EATOS_DATA_KEY=... HOST=0.0.0.0 pnpm api`.

Back up the volume, or ask each device for a backup (Profile > Back up).
