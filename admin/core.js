// Wires the library kit for URB: one storage namespace, one db, one set of providers.
import { brand, USERS } from './brand.js'
import { createStorage } from './library/utils/storage.js'
import { createDb } from './library/lib/collection-store.js'
import { createActivityLog } from './library/lib/activity-log.js'
import { createMoney } from './library/utils/money.js'
import { createDates } from './library/utils/dates.js'
import { createAuth } from './library/providers/auth-provider.js'
import { createTheme } from './library/providers/theme-provider.js'
import { createToaster } from './library/providers/toast-provider.js'
import { createConfirm } from './library/providers/confirm-provider.js'
import { schemas } from './library/schemas/index.js'

export { brand }
export const storage = createStorage('urb')           // keys: urb.db.orders, urb.db.products ... (shared with the storefront)
export const db = createDb({ storage })
export const C = Object.fromEntries(['orders', 'products', 'items', 'customers', 'enquiries', 'promos', 'stockmoves', 'materials', 'boms', 'materialmoves', 'activity', 'settings'].map((n) => [n, db.collection(n, { idPrefix: n.slice(0, 3) })]))
export const COLLECTIONS = Object.keys(C)
export const money = createMoney({ ...brand.locale, display: 'symbol' })
export const dates = createDates(brand.locale)
export const auth = createAuth({ storage: createStorage('urb.admin'), users: USERS })
export const theme = createTheme({ storage: createStorage('urb.admin'), light: brand.theme.light, dark: brand.theme.dark })
export const toast = createToaster()
export const confirm = createConfirm()
export const activity = createActivityLog(C.activity)
export const log = (action, target = '') => activity.log(auth.session()?.email || 'system', action, target)
export { schemas }

export const DEFAULT_SETTINGS = { id: 'main', lowStock: 2, cities: ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Faisalabad', 'Multan', 'Another city'], email: '', phone: '', whatsapp: '', labourRate: 350, overheadPct: 10, targetMargin: 50 }
export const settings = () => ({ ...DEFAULT_SETTINGS, ...(C.settings.get('main') || {}) })
export const saveSettings = (patch) => C.settings.upsert({ ...settings(), ...patch, id: 'main' })
export const product = (id) => C.products.get(id)
export const waLink = (phone, text = '') => { const d = String(phone || '').replace(/\D/g, '').replace(/^0/, brand.locale.dialCode.replace('+', '')); return d ? `https://wa.me/${d}${text ? '?text=' + encodeURIComponent(text) : ''}` : '' }

/** Move stock and record why. delta may be negative. Never goes below zero. */
export function adjustStock(productId, delta, reason) {
  const p = C.products.get(productId); if (!p) return null
  const next = Math.max(0, (p.stock || 0) + delta)
  C.products.update(productId, { stock: next })
  C.stockmoves.insert({ at: Date.now(), productId, name: p.name, delta: next - (p.stock || 0), reason, by: auth.session()?.email || 'system' })
  return next
}
