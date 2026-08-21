import { chromium } from '/home/auraauvarose/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('[console.error] ' + m.text()); });
await page.goto('http://localhost:3099/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

// click EN/ID in Sidebars right rail (has its own EN/ID buttons)
async function setLang(lang) {
  await page.evaluate((l) => {
    const els = [...document.querySelectorAll('button, [role="button"], span, div')];
    const t = els.find(e => e.textContent && e.textContent.trim().toUpperCase() === l && e.getBoundingClientRect().width > 0);
    if (t) t.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, lang);
  await page.waitForTimeout(400);
}

function extractOrange() {
  return page.evaluate(() => [...document.querySelectorAll('#about p .scroll-word-inner.text-highlight')].map(w => w.textContent.replace(/\u00A0/g, ' ')).join('|'));
}
function spacesOk() {
  return page.evaluate(() => {
    const p = document.querySelector('#about p');
    return p ? /[^\s]\s[^\s]/.test(p.textContent) : false;
  });
}
async function scrollAbout() { await page.evaluate(() => { const p = document.querySelector('#about p'); if (p) p.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(500); }

// ENGLISH
await setLang('EN');
await scrollAbout();
console.log('[EN] has spaces:', await spacesOk());
console.log('[EN] orange words:', JSON.stringify(await extractOrange()));

// toggle between languages several times, catching hook errors
for (let k = 0; k < 3; k++) { await setLang('ID'); await scrollAbout(); await setLang('EN'); await scrollAbout(); }
const hookErrs = errors.filter(e => /hook/i.test(e));

// INDONESIAN
await setLang('ID');
await scrollAbout();
console.log('[ID] has spaces:', await spacesOk());
console.log('[ID] orange words:', JSON.stringify(await extractOrange()));
console.log('[ID] first paragraph:', JSON.stringify(await page.evaluate(() => (document.querySelectorAll('#about p')[0]||{}).textContent)));

await page.screenshot({ path: '/home/auraauvarose/portofolioV2/shots/about-final-id.png' });
await setLang('EN'); await scrollAbout();
await page.screenshot({ path: '/home/auraauvarose/portofolioV2/shots/about-final-en.png' });

// WHAT I DO hover check
await page.evaluate(() => { const h2 = [...document.querySelectorAll('section h2')].filter(h=>/UI/i.test(h.textContent))[0]; if(h2) h2.scrollIntoView({block:'center'}); });
await page.waitForTimeout(500);
const widHover = await page.evaluate(() => {
  const h2 = [...document.querySelectorAll('section h2')].filter(h=>/UI/i.test(h.textContent))[0];
  if(!h2) return null;
  const inner = h2.querySelector('.scroll-word-inner');
  const before = inner ? parseFloat(getComputedStyle(inner).opacity) : null;
  const row = h2.closest('.group');
  if (row) row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  const after = inner ? parseFloat(getComputedStyle(inner).opacity) : null;
  return { before, after };
});
console.log('WHAT I DO hover opacity:', JSON.stringify(widHover), '(after should be 1)');

console.log('hook-related errors:', hookErrs.length ? JSON.stringify(hookErrs) : 'NONE ✅');
console.log('all errors:', errors.length ? JSON.stringify(errors) : 'NONE ✅');
await page.close(); await browser.close();
console.log('DONE');
