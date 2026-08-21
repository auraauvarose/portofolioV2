import { chromium } from '/home/auraauvarose/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';

const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const errors = [];
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('[console.error] ' + m.text()); });

await page.goto('http://localhost:3099/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

// Find the language toggler. Look for the lang toggle in Nav/Sidebars.
async function clickLang() {
  const clicked = await page.evaluate(() => {
    // Try common patterns: a button/tab containing EN/ID
    const els = [...document.querySelectorAll('button, a, [role="button"], div')];
    for (const el of els) {
      const txt = (el.textContent || '').trim();
      if (/^(en|id)$/i.test(txt) && txt.length <= 3) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) { el.click(); return txt; }
      }
    }
    return null;
  });
  return clicked;
}

// Toggle language a few times and watch for hook errors
for (let k = 0; k < 4; k++) {
  await clickLang();
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 1250));
  await page.waitForTimeout(300);
}

const hookErrors = errors.filter(e => /hook/i.test(e) || /fever|more hooks|fewer hooks/i.test(e));
console.log('LANGUAGE TOGGLE hook-related errors:', hookErrors.length ? JSON.stringify(hookErrors) : 'NONE ✅');
console.log('ALL console/page errors:', errors.length ? JSON.stringify(errors) : 'NONE ✅');

// Verify orange highlights in English
await page.evaluate(() => localStorage.setItem('lang', 'en'));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1400);
const orangeEn = await page.evaluate(() => {
  return [...document.querySelectorAll('#about p .scroll-word-inner.text-accent')].map(w => w.textContent).join('|');
});
console.log('EN orange highlighted words:', JSON.stringify(orangeEn));

// Switch to ID and check which are orange
const toggled = await clickLang();
await page.waitForTimeout(900);
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(400);
const orangeId = await page.evaluate(() => {
  return {
    words: [...document.querySelectorAll('#about p .scroll-word-inner.text-accent')].map(w => w.textContent).join('|'),
    firstP: (document.querySelectorAll('#about p')[0] || {}).textContent,
  };
});
console.log('After toggle (lang now)', toggled, 'orange words:', JSON.stringify(orangeId.words));

await page.screenshot({ path: '/home/auraauvarose/portofolioV2/shots/lang-switch.png' });
await page.close();
await browser.close();
console.log('DONE');
