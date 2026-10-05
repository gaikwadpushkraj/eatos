# Accessibility

EatOS is meant for everyone who eats, so accessibility is checked on every
change, not once.

## What is checked automatically (`pnpm --filter @eatos/app a11y`)

Run against the built web app, on every screen (and the pantry quick-add preview state), in light and dark mode,
at phone (390 px) and desktop (1440 px) widths:

- **axe-core** with the WCAG 2.0, 2.1 and 2.2 level A and AA rules:
  colour contrast, names and roles, required ARIA attributes, labels,
  page language and title.
- **Target size**: every control is at least 44 x 44 px.
- **Keyboard**: Tab reaches a control and focus is visibly marked.

## Built in

- Every control is a real button, link or input with an accessible name;
  icon-only buttons carry labels.
- Switches and checkboxes announce their state; progress bars are named.
- Meaning never relies on colour alone: statuses always have words.
- Text keeps at least 4.5:1 contrast in both themes.
- Layouts reflow to phone width with no sideways scrolling.
- The app respects the system light or dark setting, with a manual override.

## Not covered by automation

Automated tools find roughly a third of issues. Before a release, also try:

- VoiceOver (iOS) and TalkBack (Android) through onboarding, Now, Ask and Cooking.
- A browser at 200% zoom and with large system text.
- Keyboard only, on the web build.
- Reduced motion (the app has no animations that need it).
