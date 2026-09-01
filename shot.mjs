import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://127.0.0.1:3114';
const OUT = process.env.OUT ?? 'shots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

async function shoot(name, path, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport ?? { width: 1440, height: 950 },
    colorScheme: opts.dark ? 'dark' : 'light',
    deviceScaleFactor: 1,
  });
  // Тема хранится в cookie и применяется на сервере, поэтому системная
  // настройка браузера сама по себе светлую тему не включит.
  await ctx.addCookies([
    { name: 'theme', value: opts.dark ? 'dark' : 'light', url: BASE },
  ]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.full ?? false });
  if (errors.length) console.log(`  ошибки консоли на ${path}: ${errors.slice(0, 3).join(' | ')}`);
  await ctx.close();
}

const mobile = { width: 390, height: 844 };

const ROUTES = [
  ['dashboard', '/dashboard'],
  ['projects', '/projects'],
  ['project-detail', '/projects/1'],
  ['catalog', '/catalog'],
  ['scoring', '/admin/scoring'],
  ['events', '/events'],
  ['event-detail', '/events/201'],
  ['tenders', '/tenders'],
  ['competitors', '/competitors'],
  ['brands', '/brands'],
  ['sources', '/admin/sources'],
  ['admin', '/admin'],
  ['people', '/admin/people'],
  ['settings', '/settings'],
];

for (const [name, path] of ROUTES) {
  await shoot(`${name}-dark`, path, { dark: true, full: true });
}
await shoot('dashboard-light', '/dashboard', { full: true });
await shoot('events-light', '/events', { full: true });
await shoot('admin-light', '/admin', { full: true });
await shoot('mobile-dashboard', '/dashboard', { viewport: mobile, dark: true, full: true });
await shoot('mobile-events', '/events', { viewport: mobile, dark: true, full: true });
await shoot('login', '/login', { dark: true });

await browser.close();
console.log('снимки готовы');
