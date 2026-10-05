// Helpers for driving the built web app (dist/) as a persona in Chromium.
//
//   import { start } from './persona-kit.mjs';
//   const s = await start({ member: { name: 'Priya', diet: 'vegetarian', rules: ['jain'] }, profile: { kitchen: 'basic' } });
//   await s.go('/wishes'); await s.page.getByLabel('What do you wish you could eat?').fill('pav bhaji'); ...
//   (pass time: '2026-10-14T13:00:00+05:30' to pin the clock)  await s.shot('wish'); await s.close();
//
// Run from apps/app after `pnpm build:web`. No network is needed (everything runs in the browser).
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.ico': 'image/x-icon' };

export async function start({ member = {}, profile = {}, events = [], viewport = { width: 390, height: 844 }, scheme = 'light', shots = resolve('persona-shots'), at, time } = {}) {
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
  const executablePath = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch({ executablePath });
  const ctx = await browser.newContext({ viewport, colorScheme: scheme, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));

  // Seed the person's profile straight into local storage, as onboarding would.
  // `time` pins the app's clock (a Date or ISO string), e.g. '2026-10-14T13:00:00+05:30' for a Wednesday lunch in IST.
  if (time) await page.clock.setFixedTime(new Date(time));
  const t = at ?? (time ? new Date(time).getTime() : Date.now()) - 86_400_000;
  const me = { id: 'me', name: 'You', diet: 'omnivore', allergens: [], dislikes: [], goals: [], ...member };
  const prof = {
    selfId: 'me',
    members: [me],
    routine: { wake: 420, sleep: 1380, meals: { breakfast: 480, lunch: 780, snack: 1020, dinner: 1170 }, medication: [] },
    floorKcal: 1200,
    tzOffsetMin: 330,
    ...profile,
  };
  const seed = [{ type: 'profile.set', at: t, id: 'ev_seed_profile', profile: prof }, ...events];
  await page.addInitScript((s) => {
    if (!localStorage.getItem('eatos.events.v1')) localStorage.setItem('eatos.events.v1', JSON.stringify(s));
  }, seed);
  await page.goto(base + '/');

  return {
    base,
    page,
    errors,
    go: (path) => page.goto(base + path),
    text: (s) => page.getByText(s, { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 15000 }),
    body: () => page.evaluate(() => document.body.innerText),
    shot: (name) => page.screenshot({ path: join(shots, `${name}.png`), fullPage: true }),
    log: () => page.evaluate(() => JSON.parse(localStorage.getItem('eatos.events.v1') || '[]')),
    close: async () => {
      await browser.close();
      server.close();
    },
  };
}
