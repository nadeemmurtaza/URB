// Walks every page: console errors, dead internal links, horizontal overflow at 7 widths, and the buy flow end to end.
// Usage: node scripts/verify.mjs [baseUrl]   (serve the repo root first, e.g. npx http-server -p 4173)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.argv[2] || 'http://127.0.0.1:4173';
const pages = ['index', 'shop', 'collection?c=stems', 'collection?c=plushies', 'collection?c=wear', 'collection?c=little', 'product?id=white-muse', 'cart', 'checkout', 'order-confirmed', 'track', 'wishlist', 'about', 'delivery', 'contact', '404'];
const widths = [280, 380, 640, 768, 1024, 1280, 1536];
const fails = [];
const ok = (c, m) => { if (!c) { fails.push(m); console.log('FAIL', m); } };
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const REDUCED = process.env.REDUCED === '1';
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: REDUCED ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const _click = page.click.bind(page); page.click = async (s, o = {}) => { try { return await _click(s, { timeout: 1500, ...o }); } catch (e) { return _click(s, { force: true, ...o }); } };
await page.addInitScript(() => { try { sessionStorage.setItem('urb.intro', '1'); } catch (e) {} document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{scroll-behavior:auto!important}'; document.head.appendChild(s); }); });
page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) ok(false, 'console: ' + m.text()); });
page.on('pageerror', e => ok(false, 'pageerror: ' + e.message));
page.on('requestfailed', r => { if (!/fonts\.g/.test(r.url()) && !/ABORTED/.test(r.failure()?.errorText || '')) ok(false, 'request failed ' + r.url()); });

// 1. Links
const seen = new Set();
for (const p of pages) {
  await page.goto(`${base}/${p.includes('?') ? p.replace('?', '.html?') : p + '.html'}`);
  const hrefs = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
  for (const h of hrefs) {
    if (/^(https?:|mailto:|tel:)/.test(h) || h === '#' || seen.has(h)) { ok(h !== '#', `bare # on ${p}`); continue; }
    seen.add(h);
    if (h.startsWith('#')) { ok(await page.$(h) !== null, `anchor ${h} missing on ${p}`); continue; }
    const r = await page.request.get(`${base}/${h}`); ok(r.status() === 200, `dead link ${h} (${r.status()}) on ${p}`);
  }
}
console.log('links checked:', seen.size);

// 2. Buy flow
await page.goto(base + '/index.html');
await page.click('.hero__flower'); await page.waitForURL(/collection\.html\?c=stems/);
await page.goto(base + '/shop.html'); await page.click('#grid .card:nth-child(1) .card__name a');
await page.waitForURL(/product\.html\?id=/); await page.goto(base + '/product.html?id=rose-amour');
await page.click('[data-intent="add"]');
ok(await page.isVisible('#pdp #date[aria-invalid="true"]'), 'date validation shows');
const d = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
await page.fill('#date', d); await page.fill('#msg', 'For you');
await page.click('[data-intent="add"]');
await page.waitForSelector('#dlg-cart[open] .line');
await page.click('#dlg-cart [data-action="inc"]');
ok((await page.textContent('#dlg-cart .qty__n')) === '2', 'qty increments to 2');
await page.click('#dlg-cart a[href="cart.html"]');
await page.waitForURL(/cart\.html/);
await page.fill('#promo-in', 'NOPE'); await page.click('.promo button');
ok(await page.isVisible('.promo .field__error'), 'bad promo rejected');
await page.fill('#promo-in', 'welcome5'); await page.click('.promo button');
ok((await page.textContent('.sum')).includes('Promo'), 'promo applied');
await page.click('.panel a[href="checkout.html"]');
await page.waitForURL(/checkout\.html/);
await page.click('#co button[type="submit"]');
ok((await page.$$('#co [aria-invalid="true"]')).length >= 4, 'checkout shows validation errors');
await page.fill('#c-name', 'Ayesha Khan'); await page.fill('#c-phone', '0300 1234567'); await page.selectOption('#city', 'Lahore'); await page.fill('#c-addr', 'House 4, Street 9, Gulberg');
await page.click('#co button[type="submit"]');
await page.waitForURL(/order-confirmed\.html\?o=URB-\d{6}/);
ok((await page.textContent('#done')).includes('Thank you, Ayesha'), 'confirmation shows name');
const oid = new URL(page.url()).searchParams.get('o');
await page.click('#done a[href^="track.html"]'); await page.waitForSelector('.steps');
ok(await page.isVisible('.steps li[data-state="done"]'), 'tracking shows progress');
await page.goto(base + '/track.html'); await page.fill('#t-id', 'junk'); await page.click('#track button'); ok((await page.textContent('#track-out')).includes('No order'), 'unknown order has a way forward');
// crafts: peek sheet and enquiry prefill
await page.goto(base + '/collection.html?c=plushies'); await page.click('[data-action="peek"]');
ok(await page.isVisible('#dlg-peek[open] .peek__body'), 'peek sheet opens');
await page.click('#dlg-peek a[href^="contact.html"]'); await page.waitForURL(/contact\.html\?c=plushies/);
ok((await page.inputValue('#x-brief')).includes('Chonky cat'), 'enquiry is prefilled');
await page.goto(base + '/collection.html?c=nope'); ok((await page.textContent('#coll')).includes('could not find'), 'unknown collection has a way forward');
// shop filters, wishlist, search
await page.goto(base + '/shop.html?cat=roses'); const nRoses = (await page.$$('#grid .card')).length; ok(nRoses > 0 && nRoses < 20, 'rose filter narrows');
await page.fill('#shop-q', 'zzzz'); ok(await page.isVisible('#grid .empty'), 'empty shop state');
await page.click('#grid .empty a'); await page.waitForURL(/shop\.html$/);
await page.click('#grid .card__save'); await page.goto(base + '/wishlist.html'); ok((await page.$$('#wish-grid .card')).length === 1, 'wishlist holds saved item');
await page.click('[data-action="open-search"]'); await page.fill('#q', 'peony'); ok((await page.$$('#search-out .result')).length >= 2, 'search finds peony');
await page.keyboard.press('Escape');
await page.goto(base + '/contact.html'); await page.click('[data-form="contact"] button'); ok(await page.isVisible('[data-form="contact"] [aria-invalid="true"]') , 'contact validates');
await page.fill('#m-name', 'A'); await page.fill('#m-mail', 'a@b.co'); await page.fill('#m-msg', 'Hi'); await page.click('[data-form="contact"] button'); ok(await page.isVisible('[data-done="contact"]'), 'contact success state');
await page.goto(base + '/product.html?id=nope'); ok((await page.textContent('#pdp')).includes('could not find'), 'unknown product has a way forward');

// 2a. Motion is really running
await page.goto(base + '/index.html'); await page.waitForTimeout(1500);
const m = await page.evaluate(() => ({ anims: document.getAnimations().length, letters: document.querySelectorAll('.sp .ch').length, drawn: document.querySelectorAll('.doodle[data-in]').length, hearts: document.querySelectorAll('.bg__floats .doodle').length, marquee: !!document.querySelector('.marquee__track') && document.querySelector('.marquee__track').getAnimations().length }));
console.log('motion:', JSON.stringify(m));
if (REDUCED) ok(m.letters === 0 && m.hearts === 0 && !(await page.evaluate(() => document.documentElement.classList.contains('m'))), 'reduced motion: no motion engine ' + JSON.stringify(m));
else ok(m.anims > 80 && m.letters > 40 && m.hearts === 9 && m.marquee > 0, 'motion engine is running ' + JSON.stringify(m));
await page.goto(base + '/about.html'); await page.waitForTimeout(800);
ok((await page.$$('.tl')).length === 10, 'story timeline has 10 entries');
ok((await page.textContent('h1')).includes('everywhere'), 'story headline');
// 2b. Every image on every page loads
for (const p of pages) {
  await page.goto(`${base}/${p.includes('?') ? p.replace('?', '.html?') : p + '.html'}`);
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
  await page.evaluate(async () => { const is = [...document.images]; is.forEach(i => { i.loading = 'eager'; }); await Promise.all(is.map(i => i.decode().catch(() => {}))); });
  const broken = await page.$$eval('img', is => is.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')));
  ok(broken.length === 0, `broken images on ${p}: ${broken.join(', ')}`);
}
// 3. Overflow and screenshots
for (const w of widths) {
  await page.setViewportSize({ width: w, height: 900 });
  for (const p of pages) {
    await page.goto(`${base}/${p.includes('?') ? p.replace('?', '.html?') : p + '.html'}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(over <= 0, `overflow ${over}px at ${w} on ${p}`);
  }
}
if (process.env.SHOTS) {
  for (const w of [280, 390, 1280]) for (const p of ['index', 'shop', 'product?id=pink-whimsy', 'checkout']) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`${base}/${p.includes('?') ? p.replace('?', '.html?') : p + '.html'}`); await page.waitForTimeout(400);
    await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(e => e.setAttribute('data-in', '')));
    await page.screenshot({ path: `${process.env.SHOTS}/${p.split('?')[0]}-${w}.png`, fullPage: true });
  }
}
await browser.close();
console.log(fails.length ? `${fails.length} failure(s)` : 'ALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
