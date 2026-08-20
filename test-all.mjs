import { chromium } from '/home/auraauvarose/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs';

const browser = await chromium.launch({
  executablePath: '/opt/google/chrome/chrome',
  headless: true,
  args: ['--no-sandbox'],
});

// --- TEST 1: Loading on first visit ---
console.log('########## TEST 1: LOADING FIRST VISIT ##########');
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const logs = [];
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto('http://localhost:3099/', { waitUntil: 'domcontentloaded' });

  // sample at several times
  await page.waitForTimeout(200);
  console.log('t=200ms url:', page.url(), '| loadingText:', await page.locator('text=Loading').count(), '| hello:', await page.locator('text=Hello').count(), '| FULLSTACK:', await page.locator('text=FULLSTACK').count());
  await page.waitForTimeout(500);
  console.log('t=700ms url:', page.url(), '| loadingText:', await page.locator('text=Loading').count(), '| welcomeVisible?:', await page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find(s => s.textContent.includes('Hello'));
    if (!el) return 'no span';
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return `rect={x:${r.x},y:${r.y},w:${r.width},h:${r.height}} opacity=${cs.opacity}`;
  }));
  await page.waitForTimeout(2500);
  console.log('t=3200ms url:', page.url(), '| pf-loaded:', await page.evaluate(() => localStorage.getItem('pf-loaded-v2')), '| FULLSTACK:', await page.locator('text=FULLSTACK').count());
  console.log('errors:', logs.join('\n') || 'none');
  await page.close();
}

// --- TEST 2: Reload / (now loaded) ---
console.log('\n########## TEST 2: RELOAD (already loaded) ##########');
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.addInitScript(() => localStorage.setItem('pf-loaded-v2', '1'));
  await page.goto('http://localhost:3099/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  console.log('url:', page.url(), '| loadingText:', await page.locator('text=Loading').count(), '| FULLSTACK:', await page.locator('text=FULLSTACK').count());
  await page.close();
}

// --- TEST 3: Mobile hero font size + sticky reveal on desktop ---
console.log('\n########## TEST 3: MOBILE HERO ##########');
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => localStorage.setItem('pf-loaded-v2', '1'));
  await page.goto('http://localhost:3099/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const h1 = await page.evaluate(() => {
    const el = document.querySelector('h1');
    if (!el) return 'no h1';
    const cs = getComputedStyle(el);
    return `font-size=${cs.fontSize} line-height=${cs.lineHeight} text=${el.textContent.trim().slice(0,20)}`;
  });
  console.log('mobile hero h1:', h1);
  await page.close();
}

// --- TEST 4: Sticky scroll reveal ---
console.log('\n########## TEST 4: STICKY REVEAL ##########');
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.addInitScript(() => localStorage.setItem('pf-loaded-v2', '1'));
  await page.goto('http://localhost:3099/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  // Check the sticky hero container and whether page behind covers it on scroll
  const info = await page.evaluate(() => {
    const sticky = document.querySelector('.sticky');
    const hero = document.querySelector('#top');
    // count .reveal elements that have is-visible
    const reveals = document.querySelectorAll('.reveal');
    let visibleAtStart = 0;
    reveals.forEach(r => { if (r.classList.contains('is-visible')) visibleAtStart++; });
    // simulate scroll to 1 viewport
    window.scrollTo(0, window.innerHeight);
    return new Promise((res) => setTimeout(() => {
      const afterReveals = [...document.querySelectorAll('.reveal')];
      let visibleAfter = 0;
      afterReveals.forEach(r => { if (r.classList.contains('is-visible')) visibleAfter++; });
      const stickyPos = sticky ? window.getComputedStyle(sticky).position : 'none';
      const heroPos = hero ? window.getComputedStyle(hero).position : 'none';
      res({ totalReveals: afterReveals.length, visibleAtStart, visibleAfter, stickyPos, heroPos });
    }, 600));
  });
  console.log('sticky container position:', info.stickyPos, 'hero position:', info.heroPos);
  console.log('reveal total:', info.totalReveals, 'visible at start:', info.visibleAtStart, 'visible after 1 viewport scroll:', info.visibleAfter);
  await page.close();
}

await browser.close();
console.log('\nDONE');
