/**
 * Bill-of-materials maths. Pure functions over plain objects; money is whatever unit the caller uses.
 *
 *   material : { id, name, unit, cost (per unit), stock, reorder, pack? }
 *   bom      : { id (the product id), lines: [{ materialId, qty, scrap? (% extra lost to waste) }], labourMin, notes? }
 *   order    : { id, status, consumed?, items: [{ id (product id), qty }] }
 */
const n = (v) => (Number.isFinite(+v) ? +v : 0)
const byId = (materials) => (materials instanceof Map ? materials : new Map(materials.map((m) => [m.id, m])))

/** Quantity of material to set aside for one unit of the product, including waste. */
export const needFor = (line) => n(line.qty) * (1 + n(line.scrap) / 100)

/** Cost one product from its recipe. labourRate is per hour. Unknown materials are listed in `missing` and cost nothing. */
export function costBom({ bom, materials, labourRate = 0, overheadPct = 0 }) {
  const m = byId(materials), missing = []
  const lines = (bom?.lines || []).map((l) => {
    const mat = m.get(l.materialId)
    if (!mat) missing.push(l.materialId)
    const need = needFor(l)
    return { materialId: l.materialId, name: mat?.name || 'Unknown material', unit: mat?.unit || '', qty: n(l.qty), scrap: n(l.scrap), need, unitCost: n(mat?.cost), cost: need * n(mat?.cost), missing: !mat }
  })
  const materialCost = lines.reduce((t, l) => t + l.cost, 0)
  const labour = (n(bom?.labourMin) / 60) * n(labourRate)
  const overhead = (materialCost + labour) * (n(overheadPct) / 100)
  return { lines, missing, materials: materialCost, labour, overhead, total: materialCost + labour + overhead }
}

/** Profit and margin percentage of a selling price over a cost. pct is null when there is no price. */
export const margin = (price, cost) => ({ amount: n(price) - n(cost), pct: n(price) > 0 ? ((n(price) - n(cost)) / n(price)) * 100 : null })

/** Selling price that earns targetPct margin on a cost, rounded up to a step (e.g. 50). */
export function suggestPrice(cost, targetPct, step = 1) {
  const t = Math.min(95, Math.max(0, n(targetPct))) / 100, raw = n(cost) / (1 - t)
  return step > 1 ? Math.ceil(raw / step) * step : Math.ceil(raw)
}

/** healthy | thin | loss | none, from a margin percentage and the target. */
export const marginState = (pct, target) => (pct == null ? 'none' : pct < 0 ? 'loss' : pct < target ? 'thin' : 'healthy')

/** Material state from stock and reorder level. */
export const materialState = (m) => (n(m.stock) <= 0 ? 'out' : n(m.stock) <= n(m.reorder) ? 'low' : 'ok')

/** Orders that still need making: not cancelled or finished, and whose materials have not been taken yet. */
export const isOpen = (o) => ['new', 'confirmed', 'preparing'].includes(o.status) && !o.consumed

/**
 * Explode orders into total material need (a Map materialId -> quantity) and report items that have no recipe.
 * Returns { needs, noRecipe: [{ productId, name, qty }], orders: number }.
 */
export function explode({ orders, boms }) {
  const recipes = new Map(boms.map((b) => [b.id, b])), needs = new Map(), none = new Map()
  let count = 0
  for (const o of orders) {
    count++
    for (const it of o.items) {
      const b = recipes.get(it.id)
      if (!b || !b.lines?.length) { const k = none.get(it.id) || { productId: it.id, name: it.name, qty: 0 }; k.qty += n(it.qty); none.set(it.id, k); continue }
      for (const l of b.lines) needs.set(l.materialId, (needs.get(l.materialId) || 0) + needFor(l) * n(it.qty))
    }
  }
  return { needs, noRecipe: [...none.values()], orders: count }
}

/** Compare needs with stock. pack rounds the purchase up to whole packs (e.g. 50 g balls). Sorted by shortage. */
export function shoppingPlan(needs, materials) {
  const m = byId(materials)
  return [...needs.entries()].map(([id, need]) => {
    const mat = m.get(id) || { name: 'Unknown material', unit: '', stock: 0, cost: 0 }
    const short = Math.max(0, need - n(mat.stock)), pack = n(mat.pack) > 0 ? n(mat.pack) : 1, buy = short ? Math.ceil(short / pack) * pack : 0
    return { materialId: id, name: mat.name, unit: mat.unit, kind: mat.kind, need, onHand: n(mat.stock), short, buy, cost: buy * n(mat.cost) }
  }).sort((a, b) => b.short - a.short || a.name.localeCompare(b.name))
}

/** Materials to take off stock for one order: [{ materialId, qty }]. Items without a recipe contribute nothing. */
export function consumption(order, boms) {
  const { needs, noRecipe } = explode({ orders: [order], boms })
  return { lines: [...needs.entries()].map(([materialId, qty]) => ({ materialId, qty })), noRecipe }
}
