import { chromium } from '/home/auraauvarose/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';

const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('response', (r) => { if (r.status() >= 400) console.log('[http', r.status() + ']', r.url()); });

await page.goto('http://localhost:3099/', { waitUntil: 'domcontentloaded' });

// Poll the URL and state every 500ms for 12 seconds
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => ({
    url: location.pathname,
    loaded: localStorage.getItem('pf-loaded-v2'),
    loadingText: [...document.querySelectorAll('span')].some(s => s.textContent.trim() === 'Loading'),
    greeting: (document.querySelector('.text-display') || {}).textContent || null,
    fullstack: [...document.querySelectorAll('h1')].some(h => h.textContent.includes('FULLSTACK')),
  }));
  const t = Math.round((i + 1) * 500);
  console.log(`t=${t}ms url=${st.url} loaded=${st.loaded} loading=${st.loadingText} greeting="${st.greeting}" fullstack=${st.fullstack}`);
}
await browser.close();
