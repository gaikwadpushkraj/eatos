// Accessibility audit: runs axe-core (WCAG 2.0/2.1/2.2 A and AA) on every
// screen of the web build, in light and dark mode, at phone and desktop
// sizes. Fails when any violation is found.
//
//   pnpm --filter @eatos/app build:web && pnpm --filter @eatos/app a11y
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const root = resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(root, path);
  if (!file.startsWith(root) || !existsSync(file) || path.endsWith('/')) file = join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const executablePath = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath });

const text = (page, t) => page.getByText(t, { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 15000 });
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function onboard(page) {
  await page.goto(base + '/');
  await text(page, 'Who is EatOS feeding?');
  await page.getByRole('checkbox', { name: 'My household' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Your name').fill('Asha');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Name').fill('Kian');
  await page.getByRole('button', { name: 'Nuts', exact: true }).click();
  await page.getByRole('button', { name: 'Add to household' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start EatOS' }).click();
  await text(page, 'NEXT UP');
}

const SCREENS = [
  ['now', '/', 'NEXT UP'],
  ['ask', '/ask', 'options'],
  ['cook', '/cook/lentil-spinach-bowl', 'STEP 1 OF'],
  ['plan', '/plan', 'This week'],
  ['grocery', '/grocery', 'Grocery list'],
  ['pantry', '/pantry', 'Pantry'],
  ['household', '/household', 'Household'],
  ['profile', '/profile', 'Safety floor is on'],
  ['integrations', '/integrations', 'Connect your world'],
];
const VIEWPORTS = [
  ['phone', { width: 390, height: 844 }],
  ['desktop', { width: 1440, height: 1000 }],
];

const seen = new Map();
let total = 0;
const onboardingChecks = [];

for (const scheme of ['light', 'dark']) {
  for (const [vp, viewport] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport, colorScheme: scheme });
    const page = await ctx.newPage();
    const scan = async (name, extra = (b) => b) => {
      const results = await extra(new AxeBuilder({ page }).withTags(TAGS)).analyze();
      for (const v of results.violations) {
        for (const n of v.nodes) {
          total += 1;
          const key = `${v.id}|${n.target.join(' ')}|${name}|${scheme}|${vp}`;
          if (!seen.has(key)) seen.set(key, { id: v.id, impact: v.impact, help: v.help, name, scheme, vp, target: n.target.join(' '), html: n.html.slice(0, 160), summary: (n.any[0]?.message ?? n.failureSummary ?? '').split('\n')[0] });
        }
      }
    };
    const targets = async (name) => {
      // Every visible control should be at least 44 x 44 CSS px (the design's rule; WCAG 2.2 asks for 24).
      const small = await page.evaluate(() => {
        const sel = 'button, a[href], input, textarea, [role=button], [role=checkbox], [role=switch], [role=link]';
        return [...document.querySelectorAll(sel)]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[aria-hidden=true]');
          })
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ el, r }) => (r.height < 44 || (r.width < 44 && el.tagName !== 'INPUT')) && !(el.tagName === 'INPUT' && r.height >= 44))
          .map(({ el, r }) => `${el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 30) || el.tagName} (${Math.round(r.width)}x${Math.round(r.height)})`);
      });
      for (const label of small) {
        const key = `target-size|${label}|${name}|${scheme}|${vp}`;
        total += 1;
        if (!seen.has(key)) seen.set(key, { id: 'target-size', impact: 'moderate', help: 'Controls should be at least 44 x 44 px', name, scheme, vp, target: label, html: '', summary: label });
      }
    };
    const focus = async (name) => {
      // Tabbing must reach a control and show where focus is.
      await page.mouse.click(1, 1).catch(() => {});
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return { ok: false, why: 'Tab did not move focus to any control' };
        const cs = getComputedStyle(el);
        const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
        const shadow = cs.boxShadow && cs.boxShadow !== 'none';
        return { ok: outline || shadow, why: `${el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 30) || el.tagName} has no visible focus indicator` };
      });
      if (!info.ok) {
        total += 1;
        seen.set(`focus|${name}|${scheme}|${vp}`, { id: 'focus-visible', impact: 'serious', help: 'Keyboard focus must be visible', name, scheme, vp, target: info.why, html: '', summary: info.why });
      }
    };
    // Onboarding screens before a profile exists.
    await page.goto(base + '/');
    await text(page, 'Who is EatOS feeding?');
    await scan('onboarding-who');
    await targets('onboarding-who');
    await focus('onboarding-who');
    await onboard(page);
    for (const [name, path, wait] of SCREENS) {
      // Client-side navigation keeps the kernel loaded.
      await page.evaluate((p) => {
        window.history.pushState({}, '', p);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, path);
      await text(page, wait);
      await page.waitForTimeout(250);
      await scan(`${name}`);
      await targets(name);
      await focus(name);
      if (name === 'pantry') {
        // The quick-add preview (chips, remove buttons, hints) is its own state worth checking.
        await page.getByLabel('Add items').fill('2 eggs, spinach till friday, rice 1 kg in the cupboard');
        await text(page, 'Add 3 items');
        await scan('pantry-quick-add-preview');
        await targets('pantry-quick-add-preview');
        await page.getByLabel('Add items').fill('');
      }
    }
    await ctx.close();
  }
}
await browser.close();
server.close();

const list = [...seen.values()];
if (!list.length) {
  console.log('A11Y OK: no WCAG A/AA violations found on 11 screens and states x light/dark x phone/desktop.');
  process.exit(0);
}
const byRule = new Map();
for (const v of list) byRule.set(v.id, [...(byRule.get(v.id) ?? []), v]);
for (const [id, items] of byRule) {
  console.log(`\n${id} (${items[0].impact}): ${items[0].help} - ${items.length} place${items.length === 1 ? '' : 's'}`);
  for (const i of items.slice(0, 6)) console.log(`  [${i.name} ${i.scheme}/${i.vp}] ${i.target}\n    ${i.summary}\n    ${i.html}`);
}
console.log(`\nA11Y FAILED: ${list.length} distinct violations (${total} nodes).`);
process.exit(1);
