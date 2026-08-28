import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://127.0.0.1:3114';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
async function shoot(name, path, opts) {
  const ctx = await browser.newContext({
    viewport: opts.viewport,
    colorScheme: opts.dark ? 'dark' : 'light',
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `shots/${name}.png`, fullPage: opts.full ?? false });
  if (errors.length) console.log(`  console errors on ${path}:`, errors.slice(0, 3));
  await ctx.close();
}
import { mkdirSync } from 'fs';
mkdirSync('shots', { recursive: true });
const desktop = { width: 1440, height: 950 };
const tablet = { width: 900, height: 1000 };
const mobile = { width: 390, height: 844 };
await shoot('01-dashboard-light', '/dashboard', { viewport: desktop });
await shoot('02-dashboard-dark', '/dashboard', { viewport: desktop, dark: true });
await shoot('03-events', '/events', { viewport: desktop });
await shoot('04-event-detail', '/events/201', { viewport: desktop });
await shoot('05-tenders', '/tenders', { viewport: desktop });
await shoot('06-competitors', '/competitors', { viewport: desktop });
await shoot('07-brands', '/brands', { viewport: desktop });
await shoot('08-sources', '/sources', { viewport: desktop });
await shoot('09-admin-dark', '/admin', { viewport: desktop, dark: true, full: true });
await shoot('10-settings', '/settings', { viewport: desktop });
await shoot('11-mobile-dashboard', '/dashboard', { viewport: mobile });
await shoot('12-tablet-tenders', '/tenders', { viewport: tablet });
await shoot('13-login', '/login', { viewport: desktop });
await browser.close();
console.log('shots done');
