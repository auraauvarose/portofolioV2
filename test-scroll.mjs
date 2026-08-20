import { chromium } from '/home/auraauvarose/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';

const browser = await chromium.launch({
  executablePath: '/opt/google/chrome/chrome',
  headless: true,
  args: ['--no-sandbox'],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.addInitScript(() => localStorage.setItem('pf-loaded-v2', '1'));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${m.type()}] ${m.text()}`); });
page.on('requestfailed', (r) => console.log('[reqfailed]', r.url()));
page.on('response', (r) => { if (r.status() >= 400) console.log('[http', r.status() + ']', r.url()); });
await page.goto('http://localhost:3099/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1300);

// Check sticky hero cover: is the hero still at top when scrolled, or did the page cover it?
console.log('scrollY 0, hero rect:', await page.evaluate(() => {
  const h = document.querySelector('#top').getBoundingClientRect();
  return `top=${h.top} h=${h.height}`;
}));

for (const y of [800, 1200, 1600]) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => {
    const h = document.querySelector('#top').getBoundingClientRect();
    const heroVisibleTop = h.top; // if page covers hero, top should be negative and hero gone from view
    const reveals = [...document.querySelectorAll('.reveal')];
    const visibleCount = reveals.filter(r => r.classList.contains('is-visible')).length;
    return { heroTop: heroVisibleTop, visibleReveals: visibleCount, totalReveals: reveals.length };
  });
  console.log(`scrolled to ${y}: hero top=${info.heroTop}, reveals visible ${info.visibleReveals}/${info.totalReveals}`);
}

await page.screenshot({ path: '/home/auraauvarose/portofolioV2/shots/scroll.png', fullPage: false });
await page.close();
await browser.close();
console.log('DONE');
