// Material stock, recipes and costing for URB. Everything that moves materials goes through here so it is always logged.
import { C, auth, settings } from './core.js'
import { costBom, consumption, margin, marginState } from './library/utils/costing.js'

const who = () => auth.session()?.email || 'system'

export function adjustMaterial(id, delta, reason) {
  const m = C.materials.get(id); if (!m) return null
  const next = Math.max(0, +(m.stock + delta).toFixed(2)), real = +(next - m.stock).toFixed(2)
  C.materials.update(id, { stock: next })
  if (real) C.materialmoves.insert({ at: Date.now(), materialId: id, name: m.name, delta: real, reason, by: who() })
  return { stock: next, applied: real, wanted: delta }
}

/** Take an order's materials off stock when making starts. Idempotent: an order is only consumed once. */
export function consumeOrder(order) {
  if (order.consumed) return { taken: [], short: [], noRecipe: [] }
  const { lines, noRecipe } = consumption(order, C.boms.all()), taken = [], short = []
  for (const l of lines) {
    const r = adjustMaterial(l.materialId, -l.qty, `Order ${order.id} in production`)
    if (!r) continue
    taken.push({ materialId: l.materialId, qty: -r.applied })
    if (-r.applied < l.qty - 0.001) short.push({ materialId: l.materialId, missing: +(l.qty + r.applied).toFixed(2) })
  }
  C.orders.update(order.id, { consumed: true, consumedLines: taken })
  return { taken, short, noRecipe }
}

/** Put materials back when a started order is cancelled. */
export function restoreOrder(order) {
  if (!order.consumed) return 0
  for (const l of order.consumedLines || []) adjustMaterial(l.materialId, l.qty, `Order ${order.id} cancelled, materials returned`)
  C.orders.update(order.id, { consumed: false, consumedLines: [] })
  return (order.consumedLines || []).length
}

export const costing = () => { const s = settings(); return { labourRate: s.labourRate, overheadPct: s.overheadPct, target: s.targetMargin } }

/** Anything that can have a recipe: a catalogue product (bouquet, stem, filler) or a made-to-order piece (plushie, wear, little things). */
export function subject(id) {
  const p = C.products.get(id); if (p) return { id, name: p.name, img: p.img, price: p.price || 0, type: 'product' }
  const i = C.items.get(id); return i ? { id, name: i.name, img: i.img, price: i.price || 0, type: 'item' } : null
}
export function setSubjectPrice(id, price) { if (C.products.get(id)) C.products.update(id, { price }); else if (C.items.get(id)) C.items.update(id, { price }) }

/** One row per product and per made-to-order piece: its recipe, what it costs to make and what that does to the margin. */
export function recipeRows() {
  const k = costing(), mats = C.materials.all(), boms = new Map(C.boms.all().map((b) => [b.id, b]))
  const all = [...C.products.all().map((p) => ({ id: p.id, name: p.name, img: p.img, price: p.price || 0, type: 'product' })), ...C.items.all().map((i) => ({ id: i.id, name: i.name, img: i.img, price: i.price || 0, type: 'item' }))]
  return all.map((p) => {
    const bom = boms.get(p.id), has = !!(bom && bom.lines?.length)
    const c = has ? costBom({ bom, materials: mats, labourRate: k.labourRate, overheadPct: k.overheadPct }) : null
    const mg = c ? margin(p.price, c.total) : { amount: 0, pct: null }
    return { id: p.id, product: p, bom, has, cost: c, margin: mg, state: has ? marginState(mg.pct, k.target) : 'none', missing: c ? c.missing.length : 0 }
  })
}
