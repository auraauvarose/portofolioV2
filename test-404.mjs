import { chromium } from '/home/auraauvarose/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
await page.addInitScript(() => localStorage.setItem('pf-loaded-v2', '1'));
await page.goto('http://localhost:3099/', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await browser.close();
