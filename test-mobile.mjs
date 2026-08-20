import { chromium } from '/home/auraauvarose/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox'] });
for (const w of [320, 360, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 700 } });
  await page.addInitScript(() => localStorage.setItem('pf-loaded-v2', '1'));
  await page.goto('http://localhost:3099/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4300); // wait out curtain
  const m = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const r = h1.getBoundingClientRect();
    const el = document.querySelector('.group.flex');
    const pill = el ? el.getBoundingClientRect() : null;
    return {
      h1font: getComputedStyle(h1).fontSize,
      h1left: r.left, h1right: r.right, h1w: r.width,
      docScrollW: document.documentElement.scrollWidth,
      vw: window.innerWidth,
      pill: pill ? { left: pill.left, right: pill.right } : null,
    };
  });
  console.log(`vw=${w}: h1font=${m.h1font} h1[${Math.round(m.h1left)}..${Math.round(m.h1right)}] docScrollW=${m.docScrollW} pill=${m.pill ? JSON.stringify(m.pill) : 'none'}`);
  await page.close();
}
await browser.close();
