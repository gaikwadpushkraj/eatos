// Smoke test for the web build: serves dist/, walks through onboarding and
// every main screen in Chromium, fails on page errors, and saves
// screenshots to dist-shots/.
//
//   pnpm --filter @eatos/app build:web && pnpm --filter @eatos/app smoke
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('dist');
const shots = resolve('dist-shots');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.ico': 'image/x-icon' };

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(root, path);
  if (!file.startsWith(root) || !existsSync(file) || path.endsWith('/')) file = join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
await mkdir(shots, { recursive: true });

// Use a preinstalled Chromium when present (CI images, sandboxes).
const executablePath = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath });
const errors = [];
let failed = false;

async function run(name, viewport, scheme, fn) {
  const ctx = await browser.newContext({ viewport, colorScheme: scheme });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name} console: ${m.text()}`));
  try {
    await fn(page);
  } catch (e) {
    failed = true;
    console.error(`✗ ${name}: ${e.message}`);
    await page.screenshot({ path: join(shots, `${name}-failure.png`), fullPage: true }).catch(() => {});
  }
  await ctx.close();
}

const shot = (page, name) => page.screenshot({ path: join(shots, `${name}.png`), fullPage: true });
const text = (page, t) => page.getByText(t, { exact: false }).first().waitFor({ timeout: 15000 });

async function onboard(page, household) {
  await page.goto(base + '/');
  await text(page, 'Who is EatOS feeding?');
  if (household) await page.getByRole('checkbox', { name: 'My household' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Your name').fill('Asha');
  await page.getByRole('button', { name: 'More protein' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  if (household) {
    await page.getByLabel('Name').fill('Kian');
    await page.getByRole('button', { name: 'Nuts', exact: true }).click();
    await page.getByRole('button', { name: 'Add to household' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
  }
  await page.getByRole('button', { name: 'Start EatOS' }).click();
  await text(page, 'Asha');
}

await run('mobile', { width: 390, height: 844 }, 'light', async (page) => {
  await onboard(page, true);
  await text(page, 'NEXT UP');
  await shot(page, '01-now-mobile');
  await page.getByRole('button', { name: 'Other options' }).click();
  await text(page, 'options that fit');
  await page.getByLabel('Message EatOS').fill('something warm, 15 minutes, no rice');
  await page.getByRole('button', { name: 'Send' }).click();
  await text(page, 'Ready in');
  await shot(page, '02-ask-mobile');
  await page.getByRole('button', { name: 'Cook this' }).first().click();
  await text(page, 'STEP 1 OF');
  await shot(page, '03-cook-mobile');
  await page.goto(base + '/plan');
  await text(page, 'This week');
  await shot(page, '04-plan-mobile');
  await page.goto(base + '/grocery');
  await text(page, 'Grocery list');
  await shot(page, '05-grocery-mobile');
  await page.goto(base + '/pantry');
  await text(page, 'Use soon');
  await shot(page, '06-pantry-mobile');
  await page.goto(base + '/household');
  await text(page, 'Who each dinner works for');
  await page.getByRole('button', { name: 'Pesto pasta', exact: true }).click();
  await text(page, 'nut-free');
  await shot(page, '07-household-mobile');
  await page.goto(base + '/profile');
  await text(page, 'Safety floor is on');
  await shot(page, '08-profile-mobile');
  // Persistence: reload keeps the profile.
  await page.goto(base + '/');
  await text(page, 'Asha');
});

await run('wide', { width: 1440, height: 1000 }, 'light', async (page) => {
  await onboard(page, false);
  await text(page, "Today's schedule");
  await shot(page, '09-dashboard-wide');
});

await run('dark', { width: 390, height: 844 }, 'dark', async (page) => {
  await onboard(page, false);
  await text(page, 'NEXT UP');
  await shot(page, '10-now-dark');
});

await run('wide-dark', { width: 1440, height: 1000 }, 'dark', async (page) => {
  await onboard(page, false);
  await text(page, "Today's schedule");
  await shot(page, '11-dashboard-dark');
});

await browser.close();
server.close();
const real = errors.filter((e) => !/favicon|DevTools/.test(e));
if (real.length) {
  console.error('Page errors:\n' + real.join('\n'));
  failed = true;
}
console.log(failed ? 'SMOKE FAILED' : `SMOKE OK, screenshots in ${shots}`);
process.exit(failed ? 1 : 0);
