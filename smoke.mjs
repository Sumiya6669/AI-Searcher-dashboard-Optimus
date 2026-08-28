/**
 * Дымовая проверка маршрутов. Запускается против собранного приложения
 * в демонстрационном режиме: сеть до Supabase из этого окружения закрыта,
 * поэтому слой данных проверен отдельно запросами к базе, а здесь
 * проверяется отрисовка, фильтры, состояния и коды ответа.
 */
const BASE = process.env.BASE ?? 'http://127.0.0.1:3112';

const routes = [
  ['/dashboard', 200],
  ['/dashboard?period=7', 200],
  ['/events', 200],
  ['/events?severity=4&period=7', 200],
  ['/events?q=mapei', 200],
  ['/events?category=%D0%B4%D0%B5%D0%B9%D1%81%D1%82%D0%B2%D0%B8%D0%B5%20%D0%BA%D0%BE%D0%BD%D0%BA%D1%83%D1%80%D0%B5%D0%BD%D1%82%D0%B0', 200],
  ['/events/201', 200],
  ['/events/999999', 200, 'Запись не найдена'],
  ['/competitors', 200],
  ['/competitors?health=critical', 200],
  ['/competitors/1', 200],
  ['/competitors/4', 200],
  ['/brands', 200],
  ['/brands?gap=1', 200],
  ['/brands?zero=none', 200],
  ['/brands/22', 200],
  ['/brands/27', 200],
  ['/tenders', 200],
  ['/tenders?urgency=critical', 200],
  ['/tenders?sort=-amount', 200],
  ['/tenders/9001', 200],
  ['/sources', 200],
  ['/sources?state=not_connected', 200],
  ['/sources/telegram_channels', 200],
  ['/sources/google_cse', 200],
  ['/sources/goszakup', 200],
  ['/admin', 200],
  ['/settings', 200],
  ['/login', 200],
];

let bad = 0;
let warn = 0;

for (const [route, expect, mustContain] of routes) {
  const started = Date.now();
  let resp;
  let body = '';
  try {
    resp = await fetch(`${BASE}${route}`, { redirect: 'manual' });
    if (resp.status === 200) body = await resp.text();
  } catch (error) {
    console.log(`ERR      ${route}: ${error.message}`);
    bad += 1;
    continue;
  }
  const ms = Date.now() - started;
  const errorBlock = /Не удалось загрузить/.test(body);
  // Страница «не найдено» отдаётся с кодом 200: оболочка раздела уже
  // отправлена браузеру к моменту вызова notFound(). Содержимое при этом
  // правильное, поэтому проверяется оно, а не код ответа.
  const contentOk = mustContain ? body.includes(mustContain) : true;
  const statusOk = resp.status === expect && contentOk;
  if (!statusOk) bad += 1;
  else if (errorBlock) warn += 1;
  const flag = !statusOk ? 'BAD' : errorBlock ? 'WRN' : 'OK ';
  console.log(`${flag} ${resp.status} ${String(ms).padStart(5)}ms  ${route}`);
}

const search = await fetch(`${BASE}/api/search?q=mapei`);
const searchBody = await search.json();
console.log(`search: ${search.status}, найдено ${(searchBody.hits ?? []).length}`);

console.log(bad === 0 && warn === 0 ? 'SMOKE PASS' : `SMOKE: ошибок ${bad}, блоков с ошибкой ${warn}`);
process.exit(bad === 0 ? 0 : 1);
