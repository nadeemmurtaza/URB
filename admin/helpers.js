import { C, money, dates, settings } from './core.js'
import { esc } from './library/utils/html.js'
import { ORDER_STATUS } from './library/constants/statuses.js'

/** Product/item images live at storefront-relative paths; the admin sits one folder deeper. */
export const imgSrc = (p) => (!p ? '' : /^(data:|https?:|\/)/.test(p) ? p : `../${p}`)
export const isLow = (p) => (p.stock ?? 0) <= settings().lowStock
export const stockBadge = (n) => (n <= 0 ? '<span class="badge badge-error badge-soft">Out of stock</span>' : n <= settings().lowStock ? `<span class="badge badge-warning badge-soft">${n} left</span>` : `<span class="badge badge-success badge-soft">${n} in stock</span>`)
export const live = (o) => o.status !== 'cancelled'

/** Customers are derived from orders (grouped by phone) and merged with saved notes. */
export function customers() {
  const map = new Map()
  for (const o of C.orders.all()) {
    const k = String(o.customer?.phone || o.customer?.name).replace(/\s|-/g, '')
    const c = map.get(k) || { id: `cus_${k}`, key: k, name: o.customer.name, phone: o.customer.phone, email: o.customer.email || '', city: o.customer.city, orders: [], spent: 0, last: 0, first: Infinity }
    c.orders.push(o); if (live(o)) c.spent += o.total; c.last = Math.max(c.last, o.at); c.first = Math.min(c.first, o.at)
    if (o.at >= c.last) { c.name = o.customer.name; c.city = o.customer.city; c.email = o.customer.email || c.email }
    map.set(k, c)
  }
  const saved = new Map(C.customers.all().map((c) => [c.id, c]))
  return [...map.values()].map((c) => ({ ...c, notes: saved.get(c.id)?.notes || '', tags: saved.get(c.id)?.tags || '' })).sort((a, b) => b.last - a.last)
}
export const orderTotals = (orders) => { const l = orders.filter(live); return { revenue: l.reduce((t, o) => t + o.total, 0), count: l.length, aov: l.length ? l.reduce((t, o) => t + o.total, 0) / l.length : 0 } }
export const pct = (now, prev) => (prev ? ((now - prev) / prev) * 100 : now ? 100 : null)
export const statusLabel = (s) => ORDER_STATUS[s]?.label || s
export const payLabel = (p) => ({ cod: 'Cash on delivery', bank: 'Bank transfer', card: 'Card link' }[p] || p || '')
export const num = (v) => { const n = Number(String(v).replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : 0 }
export const firstName = (s) => String(s || '').split(' ')[0]
export const empty = (v) => (v == null || v === '' ? '<span class="text-base-content/40">—</span>' : esc(v))
export { esc, money, dates }
