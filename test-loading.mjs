import { chromium } from '/home/auraauvarose/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';

const ws = [];

const browser = await chromium.launch({
  executablePath: '/opt/google/chrome/chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// First visit — no localStorage
page.on('console', (m) => ws.push(`[console] ${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => ws.push(`[pageerror] ${e.message}`));

console.log('== FIRST VISIT ==');
await page.goto('http://localhost:3099/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
console.log('URL now:', page.url());
console.log('body text (first 200):', JSON.stringify((await page.textContent('body')).slice(0, 200)));
console.log('has Loading text:', await page.locator('text=Loading').count());
console.log('has FULLSTACK:', await page.locator('text=FULLSTACK').count());
const loadedVal = await page.evaluate(() => localStorage.getItem('pf-loaded-v2'));
console.log('pf-loaded-v2:', loadedVal);
await page.screenshot({ path: '/home/auraauvarose/portofolioV2/shots/first.png', fullPage: true });

console.log('\n== SECOND VISIT ==');
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
console.log('URL now:', page.url());
console.log('has Loading text:', await page.locator('text=Loading').count());

console.log('\n== first-visit full URL history ==');
console.log(ws.join('\n'));

await browser.close();
