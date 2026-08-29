import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://127.0.0.1:3116';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
const viewports = [
  ['mobile', 390, 844],
  ['tablet', 900, 1000],
  ['desktop', 1440, 950],
];
const routes = ['/dashboard', '/events', '/events/201', '/competitors', '/competitors/4', '/brands', '/tenders', '/tenders/9001', '/admin/sources', '/admin/sources/telegram_channels', '/admin', '/admin/people', '/settings'];
let issues = 0;
for (const [label, w, h] of viewports) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  for (const r of routes) {
    await page.goto(`${BASE}${r}`, { waitUntil: 'networkidle' });
    const res = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    const over = res.scroll - res.client;
    if (over > 2) { console.log(`OVERFLOW ${label} ${r}: +${over}px`); issues++; }
  }
  await ctx.close();
}
// проверка доступности с клавиатуры: первый Tab должен попадать в интерфейс
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
const chain = [];
for (let i = 0; i < 6; i++) {
  await page.keyboard.press('Tab');
  chain.push(await page.evaluate(() => {
    const el = document.activeElement;
    return el ? `${el.tagName.toLowerCase()}${el.getAttribute('aria-label') ? '[' + el.getAttribute('aria-label') + ']' : ''}` : 'none';
  }));
}
console.log('порядок обхода Tab:', chain.join(' → '));
const landmarks = await page.evaluate(() => ({
  nav: document.querySelectorAll('nav[aria-label]').length,
  main: document.querySelectorAll('main').length,
  h1: document.querySelectorAll('h1').length,
  imgNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.alt).length,
  btnNoName: [...document.querySelectorAll('button')].filter((b) => !b.textContent.trim() && !b.getAttribute('aria-label')).length,
}));
console.log('разметка:', JSON.stringify(landmarks));
await browser.close();
console.log(issues === 0 ? 'RESPONSIVE PASS' : `переполнений: ${issues}`);
