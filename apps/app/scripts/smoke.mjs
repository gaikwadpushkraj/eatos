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
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

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
const text = (page, t) => page.getByText(t, { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 15000 });

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

// Integrations: calendar, health, receipt and delivery imports.
await run('integrations', { width: 390, height: 844 }, 'light', async (page) => {
  await onboard(page, true);
  await page.goto(base + '/integrations');
  await text(page, 'Connect your world');
  const day = new Date();
  const d = (h, m) => `${day.getUTCFullYear()}${String(day.getUTCMonth() + 1).padStart(2, '0')}${String(day.getUTCDate()).padStart(2, '0')}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00Z`;
  const ics = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:smoke1\nDTSTART:${d(18, 0)}\nDTEND:${d(19, 0)}\nSUMMARY:Review\nEND:VEVENT\nEND:VCALENDAR`;
  await page.getByLabel('Or paste calendar text').fill(ics);
  await page.getByRole('button', { name: 'Import pasted calendar' }).click();
  await text(page, 'busy time');
  await page.getByRole('button', { name: 'Import pasted calendar' }).click();
  await text(page, 'Already up to date');
  await page.getByLabel('Or paste CSV').fill('type,start,end,value\nwater,' + new Date().toISOString() + ',,500');
  await page.getByRole('button', { name: 'Import pasted data' }).click();
  await text(page, 'Added 1 new records');
  await page.getByLabel('Receipt text').fill('2 x Bananas 1.20\nSpinach 200g 1.50\nMystery Gadget 9.99\nTOTAL 12.69');
  await page.getByRole('button', { name: 'Add to pantry' }).click();
  await text(page, 'Added 2 items to your pantry');
  await text(page, 'Skipped 1 line');
  await page.getByRole('button', { name: 'Try a sample' }).click();
  await text(page, 'Paneer tikka bowl');
  await text(page, 'hidden for safety');
  await shot(page, '14-integrations');
  await page.goto(base + '/pantry');
  await text(page, 'Banana');
});

// Optional Claude-powered Ask, with the Anthropic endpoint stubbed (no real calls, no credits).
await run('llm', { width: 390, height: 844 }, 'light', async (page) => {
  const requests = [];
  let mode = 'ok';
  await page.route('https://api.anthropic.com/**', async (route) => {
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    requests.push({ headers: req.headers(), body: req.postDataJSON() });
    if (mode === 'error') return route.fulfill({ status: 500, headers: cors, contentType: 'application/json', body: JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'boom' } }) });
    const answer = { maxPrepMin: 10, tags: ['comfort'], slot: 'dinner', need: null, light: false, exclude: ['rice'], justMe: false };
    return route.fulfill({
      status: 200,
      headers: cors,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-sonnet-5-5', content: [{ type: 'text', text: JSON.stringify(answer) }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } }),
    });
  });
  await onboard(page, true); // household with a nut allergy
  await page.goto(base + '/profile');
  await page.getByRole('switch', { name: 'Use Claude for Ask' }).click();
  await page.getByLabel('Your Anthropic API key').fill('sk-ant-test-key-0000');
  await page.getByRole('button', { name: 'Save' }).click();
  await text(page, 'Claude will be used for Ask');

  await page.goto(base + '/ask');
  await page.getByLabel('Message EatOS').fill('something cosy and quick tonight');
  await page.getByRole('button', { name: 'Send' }).click();
  await text(page, 'Read with Claude');
  if (requests.length !== 1) throw new Error(`expected 1 model call, saw ${requests.length}`);
  const { headers, body } = requests[0];
  if (headers['x-api-key'] !== 'sk-ant-test-key-0000') throw new Error('API key header missing');
  if (body.model !== 'claude-sonnet-5-5') throw new Error(`unexpected model ${body.model}`);
  if (body.output_config?.effort !== 'low') throw new Error('expected low effort');
  const sent = JSON.stringify(body);
  for (const secret of ['Asha', 'Kian', 'nuts', 'spinach']) if (sent.includes(secret)) throw new Error(`profile data leaked to the model: ${secret}`);
  if (!sent.includes('something cosy and quick tonight')) throw new Error('question not sent');
  // The answer excluded rice and the household is nut-free.
  await page.getByRole('button', { name: 'Why these?' }).click();
  await text(page, 'Without rice');
  await shot(page, '15-ask-llm');

  mode = 'error';
  await page.getByLabel('Message EatOS').fill('something warm for lunch');
  await page.getByRole('button', { name: 'Send' }).click();
  await text(page, 'Read on this device');
  await text(page, 'Ready in');
});

// Sync: device A turns sync on, device B joins with the same code.
const apiPort = 8790 + Math.floor(Math.random() * 100);
const api = spawn('npx', ['tsx', 'src/main.ts'], {
  cwd: resolve('../api'),
  env: { ...process.env, PORT: String(apiPort), EATOS_DATA: mkdtempSync(join(tmpdir(), 'eatos-smoke-')) },
  stdio: 'ignore',
});
const apiUrl = `http://127.0.0.1:${apiPort}`;
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(apiUrl)).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 200));
}
const code = `smoke${Date.now().toString(36)}`;
await run('sync-a', { width: 390, height: 844 }, 'light', async (page) => {
  await onboard(page, false);
  await page.goto(base + '/profile');
  await page.getByLabel('Server address').fill(apiUrl);
  await page.getByLabel('Sync code').fill(code);
  await page.getByRole('button', { name: 'Turn on sync' }).click();
  await text(page, 'Last synced');
  await shot(page, '12-sync-on');
});
await run('sync-b', { width: 390, height: 844 }, 'light', async (page) => {
  await page.goto(base + '/');
  await text(page, 'Who is EatOS feeding?');
  await page.getByRole('button', { name: 'Already use EatOS on another device? Connect' }).click();
  await page.getByLabel('Server address').fill(apiUrl);
  await page.getByLabel('Sync code').fill(code);
  await page.getByRole('button', { name: 'Connect' }).click();
  await text(page, 'Good');
  await text(page, 'Asha');
  await shot(page, '13-sync-joined');
});
api.kill();

await browser.close();
server.close();
// The llm test returns a deliberate 500 to exercise the fallback; the browser logs it.
const real = errors.filter((e) => !/favicon|DevTools|llm console: Failed to load resource.*500/.test(e));
if (real.length) {
  console.error('Page errors:\n' + real.join('\n'));
  failed = true;
}
console.log(failed ? 'SMOKE FAILED' : `SMOKE OK, screenshots in ${shots}`);
process.exit(failed ? 1 : 0);
