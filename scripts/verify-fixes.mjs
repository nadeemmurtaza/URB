// Regression checks for review findings: highlights survive deleted products, stock is reserved even when the admin was never opened,
// cancelling only restores stock that was taken, and staff cannot create orders. Usage: node scripts/verify-fixes.mjs [baseUrl]
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const base = process.argv[2] || 'http://127.0.0.1:4173'
const fails = []
const ok = (c, m) => { if (c) console.log('  ok  ', m); else { fails.push(m); console.log('  FAIL', m) } }
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const fresh = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  await ctx.addInitScript(() => { try { sessionStorage.setItem('urb.intro', '1') } catch (e) {} })
  const page = await ctx.newPage(), errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  return { ctx, page, errs }
}
const day = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10)
const read = (page, k) => page.evaluate((x) => JSON.parse(localStorage.getItem(x)), k)
const signIn = async (page, who) => { await page.click(`[data-as="${who}@urb.example"]`); await page.waitForSelector('.admin-shell') }
const hash = async (page, h) => { await page.evaluate((x) => { location.hash = x }, h); await page.waitForTimeout(250) }

console.log('\nStock reserved for an order placed before the admin was ever opened')
{
  const { ctx, page, errs } = await fresh()
  await page.goto(`${base}/checkout.html`); await page.evaluate(() => localStorage.setItem('urb.cart', JSON.stringify([{ id: 'white-muse', qty: 2 }]))); await page.goto(`${base}/checkout.html`)
  await page.fill('#c-name', 'Early Buyer'); await page.fill('#c-phone', '0311 2223344'); await page.selectOption('#city', 'Lahore'); await page.fill('#c-addr', 'House 1, Street 2, Gulberg'); await page.fill('#c-date', day)
  await page.click('#co button[type=submit]'); await page.waitForURL(/order-confirmed/)
  const oid = new URL(page.url()).searchParams.get('o')
  const catalogue = await page.evaluate(() => window.URB_DATA.defaults.products.find((p) => p.id === 'white-muse').stock)
  await page.goto(`${base}/admin/index.html#/orders`); await signIn(page, 'owner'); await page.waitForSelector('.admin-table')
  const stock = () => read(page, 'urb.db.products').then((l) => l.find((p) => p.id === 'white-muse').stock)
  ok((await stock()) === catalogue - 2, `opening the admin takes the 2 early-ordered stems off stock (${catalogue} → ${await stock()})`)
  const early = (await read(page, 'urb.db.orders')).find((o) => o.id === oid)
  ok(early.reserved === true, 'the early order is marked as reserved once the admin has taken its stock')
  await page.evaluate(async (id) => { const m = await import('/admin/views/orders.js'); m.setStatus((await import('/admin/core.js')).C.orders.get(id), 'cancelled') }, oid)
  ok((await stock()) === catalogue, 'cancelling it puts those 2 back')
  const demo = (await read(page, 'urb.db.orders')).find((o) => o.demo !== false && o.id !== oid && ['new', 'confirmed'].includes(o.status))
  if (demo) {
    const pid = demo.items[0].id, before = (await read(page, 'urb.db.products')).find((p) => p.id === pid).stock
    await page.evaluate(async (id) => { const m = await import('/admin/views/orders.js'); m.setStatus((await import('/admin/core.js')).C.orders.get(id), 'cancelled') }, demo.id)
    const after = (await read(page, 'urb.db.products')).find((p) => p.id === pid).stock
    ok(after === before, `cancelling a demo order that never took stock leaves ${pid} at ${before}`)
  } else ok(false, 'found an open demo order to cancel')
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await ctx.close()
}

console.log('\nHome page survives hidden products')
{
  const { ctx, page, errs } = await fresh()
  await page.goto(`${base}/admin/index.html`); await signIn(page, 'owner')
  await page.evaluate(() => { const l = JSON.parse(localStorage.getItem('urb.db.products')).map((p) => (['the-love', 'white-muse', 'velvet-sun'].includes(p.id) ? { ...p, active: false } : p)); localStorage.setItem('urb.db.products', JSON.stringify(l)) })
  await page.goto(`${base}/index.html`); await page.waitForTimeout(500)
  ok((await page.$$('#idx .index__row')).length >= 4, 'index rows still render')
  ok((await page.$$('#feat .card')).length === 4, 'featured row is backfilled to four')
  await page.goto(`${base}/about.html`); await page.waitForTimeout(400)
  ok(errs.length === 0, 'no page errors on home or about' + (errs.length ? ': ' + errs[0] : ''))
  await ctx.close()
}

console.log('\nStaff cannot create orders')
{
  const { ctx, page } = await fresh()
  await page.goto(`${base}/admin/index.html`); await signIn(page, 'staff')
  await hash(page, '#/customers'); await page.waitForSelector('.admin-table')
  await page.evaluate(async () => { const m = await import('/admin/views/orders.js'); m.openNewOrder() }); await page.waitForTimeout(300)
  ok((await page.$$('.admin-drawer[open]')).length === 0, 'openNewOrder does nothing for staff')
  await page.click('.admin-table tbody tr [data-act], .admin-table tbody tr button[aria-haspopup], .admin-table tbody tr .admin-actions button', { timeout: 1500 }).catch(() => {})
  ok(!(await page.textContent('body')).includes('New order for them'), 'staff is not offered “New order for them”')
  await ctx.close()
  const o = await fresh()
  await o.page.goto(`${base}/admin/index.html`); await signIn(o.page, 'owner')
  await o.page.evaluate(async () => { const m = await import('/admin/views/orders.js'); m.openNewOrder() }); await o.page.waitForSelector('.admin-drawer[open]')
  ok(true, 'owner can still open the new order form')
  await o.ctx.close()
}

console.log('\nRecipes for any product, including made-to-order pieces')
{
  const { ctx, page, errs } = await fresh()
  await page.goto(`${base}/admin/index.html#/bom`); await signIn(page, 'owner'); await page.waitForSelector('.admin-table')
  await page.fill('[data-q]', 'cardigan'); await page.waitForTimeout(250)
  ok((await page.$$('.admin-table tbody tr')).length >= 1, 'a made-to-order piece (cardigan) is listed under Recipes')
  await page.click('.admin-table tbody tr'); await page.waitForSelector('.admin-drawer[open]')
  ok((await page.textContent('.admin-drawer')).includes('Recipe'), 'its recipe opens')
  await page.click('.admin-drawer [data-close]'); await page.waitForTimeout(300)
  await page.fill('[data-q]', 'dill'); await page.waitForTimeout(250)
  ok((await page.$$('.admin-table tbody tr')).length >= 1, 'a filler stem is listed under Recipes')
  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''))
  await ctx.close()
}

await browser.close()
console.log(fails.length ? `\n${fails.length} FAILURE(S)` : '\nALL FIX CHECKS PASSED')
process.exit(fails.length ? 1 : 0)
