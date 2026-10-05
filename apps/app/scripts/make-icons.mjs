// Renders the app icon, adaptive icon, splash and favicon from HTML, so the
// artwork stays in the repo as source: node scripts/make-icons.mjs
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';

// Embedded as a data URI so the page needs no file access.
const font = `data:font/ttf;base64,${readFileSync(resolve('../../node_modules/@expo-google-fonts/geist/700Bold/Geist_700Bold.ttf')).toString('base64')}`;
const executablePath = process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const out = resolve('assets');

const mark = (size, { bg, pad }) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:G;src:url(${font})}
html,body{margin:0;width:${size}px;height:${size}px;background:${bg}}
.w{width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center}
.m{font:700 ${Math.round((size - pad * 2) * 0.62)}px G;letter-spacing:-0.04em;color:#D9F26B;line-height:1;position:relative}
.m i{position:absolute;right:-${Math.round(size * 0.07)}px;top:${Math.round(size * 0.02)}px;width:${Math.round(size * 0.11)}px;height:${Math.round(size * 0.11)}px;border-radius:50%;background:#8C87F5}
</style><div class="w"><div class="m">OS<i></i></div></div>`;

const jobs = [
  ['icon.png', 1024, { bg: '#121614', pad: 140 }, false],
  ['adaptive-icon.png', 1024, { bg: 'transparent', pad: 300 }, true],
  ['splash-icon.png', 1024, { bg: 'transparent', pad: 300 }, true],
  ['favicon.png', 96, { bg: '#121614', pad: 12 }, false],
];
const browser = await chromium.launch({ executablePath });
for (const [name, size, opts, transparent] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(mark(size, opts));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, name), omitBackground: transparent });
  await page.close();
}
await browser.close();
console.log('Wrote', jobs.map((j) => j[0]).join(', '));
