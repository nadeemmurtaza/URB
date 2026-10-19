import { C, auth, theme, brand, money, dates, settings } from './core.js'
import { seedAll } from './seed.js'
import { mountShell } from './library/components/layout/admin-shell.js'
import { ADMIN_ROUTES, ADMIN_SECTIONS } from './library/constants/admin-routes.js'
import { mountLogin } from './views/login.js'
import { dashboard } from './views/dashboard.js'
import { orders } from './views/orders.js'
import { products } from './views/products.js'
import { items } from './views/items.js'
import { inventory } from './views/inventory.js'
import { customers } from './views/customers.js'
import { enquiries } from './views/enquiries.js'
import { promos } from './views/promos.js'
import { activity } from './views/activity.js'
import { settingsView } from './views/settings.js'
import { materials } from './views/materials.js'
import { bom } from './views/bom.js'
import { production } from './views/production.js'
import { materialState } from './library/utils/costing.js'
import { recipeRows } from './stockops.js'
import { isLow, customers as derive } from './helpers.js'

seedAll()
const root = document.getElementById('app')
const views = { dashboard, orders, products, items, inventory, materials, bom, production, customers, enquiries, promos, activity, settings: settingsView }
let subs = []

function search(q) {
  const t = q.toLowerCase(), out = []
  C.orders.all().filter((o) => `${o.id} ${o.customer.name} ${o.customer.phone}`.toLowerCase().includes(t)).slice(0, 4).forEach((o) => out.push({ title: o.id, kind: 'Order', sub: `${o.customer.name} · ${money.format(o.total)}`, href: `#/orders?open=${o.id}` }))
  C.products.all().filter((p) => p.name.toLowerCase().includes(t)).slice(0, 3).forEach((p) => out.push({ title: p.name, kind: 'Bouquet', sub: money.format(p.price), href: `#/products?edit=${p.id}` }))
  derive().filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(t)).slice(0, 3).forEach((c) => out.push({ title: c.name, kind: 'Customer', sub: c.phone, href: '#/customers' }))
  C.materials.all().filter((m) => m.name.toLowerCase().includes(t)).slice(0, 3).forEach((m) => out.push({ title: m.name, kind: 'Material', sub: `${m.stock} ${m.unit} in stock`, href: '#/materials' }))
  C.enquiries.all().filter((e) => `${e.name} ${e.brief}`.toLowerCase().includes(t)).slice(0, 2).forEach((e) => out.push({ title: e.name, kind: 'Enquiry', sub: e.brief.slice(0, 40), href: `#/enquiries?open=${e.id}` }))
  return out
}

/** Live numbers on the level-3 tabs. */
function counts(route, q) {
  const [k, v] = q ? q.split('=') : ['', '']
  if (route === 'orders') return v ? C.orders.all().filter((o) => o.status === v).length : C.orders.count()
  if (route === 'enquiries') return v ? C.enquiries.all().filter((e) => e.status === v).length : C.enquiries.count()
  if (route === 'customers') { const all = derive(); return k === 'repeat' ? all.filter((c) => (v === 'repeat' ? c.orders.length > 1 : c.orders.length === 1)).length : all.length }
  if (route === 'products') { const all = C.products.all(); return k === 'vis' ? all.filter((p) => (v === 'on' ? p.active !== false : p.active === false)).length : k === 'stockf' ? all.filter((p) => (v === 'low' ? isLow(p) && p.stock > 0 : p.stock <= 0)).length : all.length }
  if (route === 'materials') { const all = C.materials.all(); return k === 'state' ? all.filter((m) => materialState(m) === v).length : k === 'kind' ? all.filter((m) => m.kind === v).length : all.length }
  if (route === 'bom') { const all = recipeRows(); return k === 'state' ? all.filter((r) => r.state === v).length : all.length }
  if (route === 'production') return null
  if (route === 'items') { const all = C.items.all(); return v ? all.filter((i) => i.collection === v).length : all.length }
  if (route === 'inventory') { const all = C.products.all(); return k === 'st' ? all.filter((p) => (v === 'low' ? isLow(p) && p.stock > 0 : v === 'out' ? p.stock <= 0 : p.stock > settings().lowStock)).length : all.length }
  return null
}

function boot() {
  subs.forEach((u) => u()); subs = []
  if (!auth.session()) { mountLogin(root, boot); return }
  const shell = mountShell(root, { brand, routes: ADMIN_ROUTES, sections: ADMIN_SECTIONS, auth, theme, views, search, onLogout: boot, logoSrc: brand.artwork.logo, counts })
  const badges = () => { shell.setBadge('orders', C.orders.all().filter((o) => o.status === 'new').length); shell.setBadge('enquiries', C.enquiries.all().filter((e) => e.status === 'new').length); shell.setBadge('inventory', C.products.all().filter((p) => p.active !== false && isLow(p)).length); shell.setBadge('materials', C.materials.all().filter((m) => materialState(m) !== 'ok').length); shell.refreshNav() }
  subs = [C.orders.subscribe(badges), C.enquiries.subscribe(badges), C.products.subscribe(badges), C.items.subscribe(badges), C.materials.subscribe(badges)]; badges()
}
boot()
