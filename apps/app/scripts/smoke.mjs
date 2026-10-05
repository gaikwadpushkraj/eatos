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
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
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
  // SMOKE_ONLY=journey,security runs just those tests.
  if (process.env.SMOKE_ONLY && !process.env.SMOKE_ONLY.split(',').includes(name)) return;
  const ctx = await browser.newContext({ viewport, colorScheme: scheme });
  const page = await ctx.newPage();
  // SMOKE_CPU_THROTTLE=4 makes a fast machine behave like a slow CI runner, to catch timing races.
  if (process.env.SMOKE_CPU_THROTTLE) await (await ctx.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.SMOKE_CPU_THROTTLE) });
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

const stored = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);
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
  // The profile must be on disk before the next test navigates away and reloads the app.
  await page.waitForFunction(() => (localStorage.getItem('eatos.events.v1') || '').includes('profile.set'), null, { timeout: 5000 });
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

// Journey: set up, cook a suggested recipe step by step, mark it eaten, and see it recorded.
await run('journey', { width: 390, height: 844 }, 'light', async (page) => {
  await onboard(page, true);
  await text(page, 'NEXT UP');
  // An action must be on disk the moment it happens, so a quick reload or close never loses it.
  await page.getByRole('button', { name: '+ 250 ml water' }).click();
  if (!(await stored(page, 'eatos.events.v1')).includes('water.logged')) throw new Error('the logged water was not saved immediately');
  const nextUp = async () => (await page.getByText(/^(NEXT UP ·|ALL DONE FOR TODAY)/).filter({ visible: true }).first().textContent()) ?? '';
  const before = await nextUp();
  await page.getByRole('button', { name: 'Start cooking' }).click();
  await text(page, 'STEP 1 OF');
  const total = Number((await page.getByText(/STEP 1 OF \d+/).first().textContent()).match(/OF (\d+)/)[1]);
  for (let i = 1; i < total; i++) {
    await page.getByRole('button', { name: 'Next step' }).click();
    await text(page, `STEP ${i + 1} OF ${total}`);
  }
  await page.getByRole('button', { name: 'Previous' }).click();
  await text(page, `STEP ${total - 1} OF ${total}`);
  await page.getByRole('button', { name: 'Next step' }).click();
  await page.getByRole('button', { name: 'Done, I ate this' }).click();
  await page.getByText(/^(NEXT UP ·|ALL DONE FOR TODAY)/).filter({ visible: true }).first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  if (!(await stored(page, 'eatos.events.v1')).includes('intake.logged')) throw new Error('eating the recipe was not recorded');
  // The meal that was eaten is not suggested again as the next one.
  const after = await nextUp();
  if (after === before) throw new Error(`the eaten meal is still next: ${after}`);
  await shot(page, '18-journey-done');
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

// Privacy: device encryption, unlock, encrypted backup, restore on a fresh device.
const unlock = async (page, pass = 'correct horse battery') => {
  await text(page, 'Enter your passphrase');
  await page.getByLabel('Passphrase', { exact: true }).fill(pass);
  await page.getByRole('button', { name: 'Unlock' }).click();
};
const backupPath = join(mkdtempSync(join(tmpdir(), 'eatos-backup-')), 'backup.json');
await run('security', { width: 390, height: 844 }, 'light', async (page) => {
  await onboard(page, false);
  if (!(await stored(page, 'eatos.events.v1')).includes('Asha')) throw new Error('expected a plain log before protection');
  await page.goto(base + '/profile');
  await page.getByRole('button', { name: 'Turn on protection' }).click();
  await page.getByLabel(/Passphrase \(at least/).fill('short');
  await text(page, 'Use at least 8 characters');
  await page.getByLabel(/Passphrase \(at least/).fill('correct horse battery');
  await page.getByLabel('Repeat passphrase').fill('correct horse');
  await text(page, 'do not match');
  await page.getByLabel('Repeat passphrase').fill('correct horse battery');
  await page.getByRole('button', { name: 'Encrypt', exact: true }).click();
  await text(page, 'This device is now encrypted');
  await page.waitForTimeout(400);
  const blob = await stored(page, 'eatos.events.v1');
  if (blob.includes('Asha') || blob.includes('profile.set')) throw new Error('log is not encrypted at rest');
  if (!blob.includes('xchacha20poly1305')) throw new Error('expected an encrypted envelope');
  await shot(page, '16-protection-on');

  // New events are saved encrypted too. (A reload locks the app.)
  await page.goto(base + '/');
  await unlock(page);
  await page.getByRole('button', { name: '+ 250 ml water' }).click();
  await page.waitForTimeout(400);
  if ((await stored(page, 'eatos.events.v1')).includes('water.logged')) throw new Error('new events were saved in plain text');

  // Encrypted backup download.
  await page.goto(base + '/profile');
  await unlock(page);
  await page.getByLabel('Passphrase for an encrypted backup').fill('backup passphrase');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export encrypted backup' }).click()]);
  await download.saveAs(backupPath);
  const backup = readFileSync(backupPath, 'utf8');
  if (backup.includes('Asha') || !backup.includes('xchacha20poly1305')) throw new Error('backup is not encrypted');

  // Reload: locked. Wrong passphrase fails, right one opens.
  await page.goto(base + '/');
  await text(page, 'Enter your passphrase');
  await shot(page, '17-locked');
  await unlock(page, 'wrong passphrase');
  await text(page, 'not right');
  await unlock(page);
  await text(page, 'Good');
  await text(page, 'Asha');

  // Lock now returns to the lock screen; turning protection off checks the passphrase first.
  await page.goto(base + '/profile');
  await unlock(page);
  await page.getByRole('button', { name: 'Lock now' }).click();
  await unlock(page); // unlocking returns to the Now screen
  await text(page, 'Good');
  await page.getByRole('button', { name: 'Profile and settings' }).click();
  await page.getByRole('button', { name: 'Turn off protection' }).click();
  await page.getByLabel('Passphrase', { exact: true }).fill('wrong one');
  await page.getByRole('button', { name: 'Turn off', exact: true }).click();
  await text(page, 'not right');
  await page.getByLabel('Passphrase', { exact: true }).fill('correct horse battery');
  await page.getByRole('button', { name: 'Turn off', exact: true }).click();
  await text(page, 'Protection is off');
  await page.waitForTimeout(400);
  if (!(await stored(page, 'eatos.events.v1')).includes('Asha')) throw new Error('log should be plain again');
});

await run('restore', { width: 390, height: 844 }, 'light', async (page) => {
  await page.goto(base + '/');
  await text(page, 'Who is EatOS feeding?');
  await page.getByRole('button', { name: /Connect another device or restore a backup/ }).click();
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Choose backup file' }).click()]);
  await chooser.setFiles(backupPath);
  await text(page, 'This backup is encrypted');
  await page.getByLabel('Backup passphrase').fill('nope nope nope');
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await text(page, 'Wrong passphrase');
  await page.getByLabel('Backup passphrase').fill('backup passphrase');
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await text(page, 'Asha');
  await text(page, 'NEXT UP');
});

await run('bad-backup', { width: 390, height: 844 }, 'light', async (page) => {
  const junk = join(mkdtempSync(join(tmpdir(), 'eatos-junk-')), 'junk.json');
  writeFileSync(junk, '{"hello": "world"}');
  await page.goto(base + '/');
  await text(page, 'Who is EatOS feeding?');
  await page.getByRole('button', { name: /Connect another device or restore a backup/ }).click();
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Choose backup file' }).click()]);
  await chooser.setFiles(junk);
  await text(page, 'not an EatOS backup');
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
// Run node directly (not npx/tsx wrappers) so killing it really stops the server.
const api = spawn(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
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
  await page.getByRole('button', { name: /Connect another device or restore a backup/ }).click();
  await page.getByLabel('Server address').fill(apiUrl);
  await page.getByLabel('Sync code').fill(code);
  await page.getByRole('button', { name: 'Connect' }).click();
  await text(page, 'Good');
  await text(page, 'Asha');
  await shot(page, '13-sync-joined');
});
// Delete everything: device and server copy.
await run('wipe', { width: 390, height: 844 }, 'light', async (page) => {
  await page.goto(base + '/');
  await text(page, 'Who is EatOS feeding?');
  await page.getByRole('button', { name: /Connect another device or restore a backup/ }).click();
  await page.getByLabel('Server address').fill(apiUrl);
  await page.getByLabel('Sync code').fill(code);
  await page.getByRole('button', { name: 'Connect' }).click();
  await text(page, 'Asha');
  const before = await (await fetch(`${apiUrl}/v1/events`, { headers: { 'x-user-id': code } })).json();
  if (before.events.length < 5) throw new Error('server should hold the synced events');
  await page.goto(base + '/profile');
  await page.getByRole('button', { name: 'Delete all data' }).click();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  await text(page, 'Everything was deleted, on this device and on your sync server');
  const after = await (await fetch(`${apiUrl}/v1/events`, { headers: { 'x-user-id': code } })).json();
  if (after.events.length !== 0) throw new Error('server copy was not deleted');
  if ((await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('eatos.')).length)) > 1) throw new Error('device data was not wiped');
  await page.goto(base + '/');
  await text(page, 'Who is EatOS feeding?');
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
