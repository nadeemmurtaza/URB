import { C, auth, money, toast, confirm, log } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { createTable } from '../library/hooks/use-table.js'
import { mountDataTable } from '../library/components/patterns/data-table.js'
import { pageHeader } from '../library/components/common/page-header.js'
import { openDrawer } from '../library/components/ui/drawer.js'
import { mountBomEditor } from '../library/components/patterns/bom-editor.js'
import { MARGIN_STATE } from '../library/constants/materials.js'
import { downloadCsv } from '../library/utils/csv.js'
import { icon } from '../library/components/ui/icons.js'
import { recipeRows, costing, subject, setSubjectPrice } from '../stockops.js'
import { imgSrc } from '../helpers.js'

const can = (p) => auth.can(p)

export function openRecipe(productId) {
  const p = subject(productId); if (!p) return toast.show('That product no longer exists.', 'error')
  const k = costing(), others = C.boms.all().filter((b) => b.id !== productId && b.lines?.length)
  let price = p.price, ed
  const cur = C.boms.get(productId), edit = can('bom:edit')
  const d = openDrawer({ title: `Recipe · ${p.name}`, size: 'lg', body: `<div class="admin-cell"><img class="admin-thumb" src="${esc(imgSrc(p.img))}" alt=""><div><b>${esc(p.name)}</b><small>${p.price ? `${esc(money.format(p.price))} selling price` : 'No selling price set. Add a typical price on the piece to see its margin.'}</small></div></div>
    ${edit && others.length ? `<div class="admin-field"><label class="admin-field__label" for="copy">Start from another recipe</label><select class="select select-bordered select-sm w-full" id="copy"><option value="">Choose a recipe to copy</option>${others.map((b) => `<option value="${esc(b.id)}">${esc(C.products.get(b.id)?.name || b.id)}</option>`).join('')}</select></div>` : ''}
    <div id="ed"></div>`,
  footer: `${cur && can('bom:delete') ? '<button class="btn btn-ghost text-error me-auto" data-del>Delete recipe</button>' : ''}<button class="btn btn-ghost" data-close>${edit ? 'Cancel' : 'Close'}</button>${edit ? '<button class="btn btn-primary" data-save>Save recipe</button>' : ''}` })
  const mount = (bom) => { ed = mountBomEditor(d.el.querySelector('#ed'), { bom, materials: C.materials.all(), money, labourRate: k.labourRate, overheadPct: k.overheadPct, price, targetMargin: k.target, onApplyPrice: edit && can('products:edit') ? (v) => { price = v; toast.show(`Price will change to ${money.format(v)} when you save`, 'info') } : undefined }); if (!edit) d.el.querySelectorAll('#ed input, #ed select, #ed textarea, #ed button').forEach((x) => (x.disabled = true)) }
  mount(cur || { lines: [], labourMin: 0 })
  d.el.querySelector('#copy')?.addEventListener('change', (e) => { const b = C.boms.get(e.target.value); if (b) { mount({ lines: b.lines.map((l) => ({ ...l })), labourMin: b.labourMin, notes: b.notes }); toast.show('Copied. Adjust the quantities for this one.', 'info') } })
  d.el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-save]')) {
      const r = ed.validate(); if (!r.valid) return
      const v = ed.value(); if (!v.lines.length) return toast.show('Add at least one material.', 'error')
      C.boms.upsert({ id: productId, ...v, demo: false })
      if (price !== p.price) { setSubjectPrice(productId, price); log('price changed from recipe', `${p.name} → ${price}`) }
      log('recipe saved', p.name); toast.show(`${p.name} recipe saved`); d.close()
    }
    if (e.target.closest('[data-del]') && (await confirm({ title: `Delete the recipe for ${p.name}?`, body: 'Orders for it will no longer reserve materials.', action: 'Delete', tone: 'error' }))) { C.boms.remove(productId); log('recipe deleted', p.name); toast.show('Recipe deleted'); d.close() }
  })
}

export function bom({ params = {} } = {}) {
  const k = costing()
  return {
    html: html`${raw(pageHeader({ title: 'Recipes (BOM)', subtitle: `What each product and made-to-order piece is made from, and what it costs. Labour ${money.format(k.labourRate)} an hour, overhead ${k.overheadPct}%, target margin ${k.target}%.`, actions: `<button class="btn btn-outline btn-sm" data-export>${icon('download', 'size-4')}Export CSV</button>${auth.can('settings:view') ? '<a class="btn btn-ghost btn-sm" href="#/settings">Change assumptions</a>' : ''}` }))}<div id="dt"></div>`,
    mount(el) {
      const table = createTable({ rows: recipeRows(), searchKeys: ['product.name', 'id'], pageSize: 10, defaultSort: { key: 'name', dir: 'asc' }, sorters: { name: (r) => r.product.name.toLowerCase(), price: (r) => r.product.price, cost: (r) => r.cost?.total ?? -1, margin: (r) => r.margin.pct ?? -999, lines: (r) => r.bom?.lines.length || 0 }, filters: { state: (r, v) => r.state === v } })
      const refresh = () => table.setRows(recipeRows()), subs = [C.boms.subscribe(refresh), C.materials.subscribe(refresh), C.products.subscribe(refresh)]
      mountDataTable(el.querySelector('#dt'), {
        table, initial: params, searchPlaceholder: 'Search products and pieces',
        filters: [{ key: 'state', label: 'Margin', options: [['', 'All margins'], ['none', 'No recipe'], ['loss', 'Loss-making'], ['thin', 'Thin'], ['healthy', 'Healthy']] }],
        columns: [
          { key: 'name', label: 'Product', sortable: true, render: (r) => `<div class="admin-cell"><img class="admin-thumb" src="${esc(imgSrc(r.product.img))}" alt="" loading="lazy"><div><b>${esc(r.product.name)}</b><small>${r.has ? `${r.bom.lines.length} materials · ${Math.round(r.bom.labourMin / 6) / 10} h` : 'no recipe yet'}${r.bom?.demo ? ' · estimate' : ''}</small></div></div>` },
          { key: 'cost', label: 'Cost to make', sortable: true, class: 'text-end', render: (r) => (r.cost ? `<span class="admin-num font-semibold">${esc(money.format(r.cost.total))}</span><br><small class="admin-num text-base-content/60">materials ${esc(money.format(r.cost.materials))}</small>` : '<span class="text-base-content/40">—</span>') },
          { key: 'price', label: 'Price', sortable: true, class: 'text-end', render: (r) => `<span class="admin-num">${esc(money.format(r.product.price))}</span>` },
          { key: 'margin', label: 'Margin', sortable: true, class: 'text-end', render: (r) => (r.margin.pct == null ? '<span class="text-base-content/40">—</span>' : `<span class="admin-num font-semibold ${r.margin.amount < 0 ? 'text-error' : ''}">${r.margin.pct.toFixed(0)}%</span><br><small class="admin-num text-base-content/60">${esc(money.format(r.margin.amount))}</small>`) },
          { key: 'state', label: 'Status', render: (r) => `<span class="badge badge-${MARGIN_STATE[r.state].tone} badge-soft">${MARGIN_STATE[r.state].label}</span>${r.missing ? '<br><small class="text-error">unknown material</small>' : ''}` },
        ],
        onRow: (r) => openRecipe(r.id),
        actions: (r) => [{ id: 'open', label: r.has ? (can('bom:edit') ? 'Edit recipe' : 'View recipe') : can('bom:create') ? 'Create recipe' : 'View' }, ...(r.has && can('bom:delete') ? [{ id: 'del', label: 'Delete recipe', tone: 'error' }] : [])],
        onAction: async (a, r) => { if (a === 'open') openRecipe(r.id); if (a === 'del' && (await confirm({ title: `Delete the recipe for ${r.product.name}?`, body: 'Orders for it will no longer reserve materials.', action: 'Delete', tone: 'error' }))) { C.boms.remove(r.id); log('recipe deleted', r.product.name); toast.show('Recipe deleted') } },
        empty: { title: 'Nothing to make yet', body: 'Add a product or a made-to-order piece first, then give it a recipe.' },
      })
      el.addEventListener('click', (e) => { if (e.target.closest('[data-export]')) downloadCsv('urb-recipes.csv', table.view().all.flatMap((r) => (r.has ? r.cost.lines.map((l) => ({ product: r.product.name, material: l.name, unit: l.unit, qty: l.qty, waste: l.scrap, need: +l.need.toFixed(2), unitCost: l.unitCost, cost: +l.cost.toFixed(2) })) : [{ bouquet: r.product.name, material: '(no recipe)' }])), [{ key: 'bouquet', label: 'Bouquet' }, { key: 'material', label: 'Material' }, { key: 'unit', label: 'Unit' }, { key: 'qty', label: 'Qty' }, { key: 'waste', label: 'Waste %' }, { key: 'need', label: 'Qty incl. waste' }, { key: 'unitCost', label: 'Cost per unit' }, { key: 'cost', label: 'Line cost' }]) })
      return () => subs.forEach((u) => u())
    },
  }
}
