import { chromium } from '/home/auraauvarose/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';

const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text(), m.location && m.location.url); });
page.on('requestfailed', (r) => console.log('[reqfailed]', r.url()));

await page.goto('http://localhost:3099/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

// ---- ABOUT: skill box removed? text bigger? gold name? ----
const about = await page.evaluate(() => {
  const sec = document.querySelector('#about');
  const hasSkillBars = !!sec.querySelector('div.mb-2') && !!sec.querySelector('.rounded-full.bg-accent');
  const bars = [...sec.querySelectorAll('.rounded-full')].filter(e => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)');
  const skillText = [...sec.querySelectorAll('.bg-white\\/10')].some(() => false);
  // any skill-like labels (Fullstack etc.)
  const skillLabels = [...sec.querySelectorAll('span')].map(s=>s.textContent.trim()).filter(t=>['Fullstack','Frontend','Mobile','Backend'].includes(t));
  // text size: read the first bio paragraph's computed font size (inherits from container)
  const bioWord = sec.querySelector('p .scroll-word-inner');
  const fontSize = bioWord ? parseFloat(getComputedStyle(bioWord.closest('p')).fontSize) : 0;
  // gold highlight words
  const goldWords = [...sec.querySelectorAll('p .scroll-word-inner.text-gold')].map(w => w.textContent);
  // readability: at current scroll, min opacity among first paragraph words
  const firstPWords = [...(sec.querySelector('p') ? sec.querySelector('p').querySelectorAll('.scroll-word-inner') : [])].map(w=>parseFloat(getComputedStyle(w).opacity));
  return { skillBarsPresent: bars.length>0, fontSizePx: fontSize, goldWords, minFirstPOpacity: Math.min(...firstPWords).toFixed(2), firstPWords: firstPWords.length };
});
console.log('ABOUT skill bars present:', about.skillBarsPresent, '(want false)');
console.log('ABOUT paragraph font-size px:', about.fontSizePx, '(want ~20-24)');
console.log('ABOUT gold words:', JSON.stringify(about.goldWords), '(want Aura,Auvarose)');
console.log('ABOUT first-paragraph min opacity:', about.minFirstPOpacity, '(want >=0.5)');

// scroll so paragraph centered, check it's fully readable
await page.evaluate(() => { const p = document.querySelector('#about p'); if (p) p.scrollIntoView({ block: 'center' }); });
await page.waitForTimeout(700);
const centered = await page.evaluate(() => {
  const p = document.querySelector('#about p');
  const words = [...p.querySelectorAll('.scroll-word-inner')].map(w=>parseFloat(getComputedStyle(w).opacity));
  return { min: Math.min(...words).toFixed(2), fullCount: words.filter(o=>o>=0.98).length, total: words.length };
});
console.log('ABOUT paragraph centered -> min opacity:', centered.min, ', full words:', centered.fullCount + '/' + centered.total);

// ---- WHAT I DO: white illuminated words, sequential ----
const wid = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll('section h2')].filter(h => h.textContent.trim().match(/UI\s*UX|WEBSITE|MOBILE|BACKEND/i));
  const first = h2s[0];
  const words = [...first.querySelectorAll('.scroll-word-inner')];
  const color = words[0] ? getComputedStyle(words[0]).color : null;
  const ops = words.map(w=>parseFloat(getComputedStyle(w).opacity).toFixed(2));
  return { color, ops, wordTexts: words.map(w=>w.textContent) };
});
console.log('\nWHAT I DO first-row word color:', wid.color, '(want white-ish rgb(255,255,255))');
console.log('WHAT I DO first-row opacities:', wid.ops.join(' '), '(sequential, want increasing or varied)');
console.log('WHAT I DO first-row texts:', wid.wordTexts.join('|'));

// sequential proof: scroll and watch first word light before second
async function widOps() {
  return page.evaluate(() => {
    const h2 = [...document.querySelectorAll('section h2')].filter(h=>h.textContent.trim().match(/UI\s*UX/i))[0];
    if (!h2) return [];
    return [...h2.querySelectorAll('.scroll-word-inner')].map(w=>parseFloat(getComputedStyle(w).opacity).toFixed(2));
  });
}
const startOps = await widOps();
// scroll a bit toward whatsido
await page.evaluate(() => { const h2 = [...document.querySelectorAll('section h2')].filter(h=>h.textContent.trim().match(/UI\s*UX/i))[0]; if (h2) h2.scrollIntoView({block:'start'}); });
await page.waitForTimeout(500);
const midOps = await widOps();
const endOps = await widOps();
console.log('WHAT I DO UI/UX opacity across scroll steps:', JSON.stringify({start:startOps, careful:midOps}));

await page.screenshot({ path: '/home/auraauvarose/portofolioV2/shots/about-v2.png' });
await page.evaluate(() => { const h2=[...document.querySelectorAll('section h2')].filter(h=>h.textContent.trim().match(/UI\s*UX/i))[0]; if(h2) h2.scrollIntoView({block:'center'}); });
await page.waitForTimeout(600);
await page.screenshot({ path: '/home/auraauvarose/portofolioV2/shots/whatido-v2.png' });

await page.close();
await browser.close();
console.log('DONE');
