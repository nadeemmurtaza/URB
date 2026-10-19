import { C, auth, money, dates, toast, confirm, log, schemas } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { createTable } from '../library/hooks/use-table.js'
import { mountDataTable } from '../library/components/patterns/data-table.js'
import { pageHeader } from '../library/components/common/page-header.js'
import { openDrawer } from '../library/components/ui/drawer.js'
import { textField, textArea, selectField, readForm, showErrors } from '../library/components/ui/field.js'
import { validate } from '../library/utils/validate.js'
import { slugify } from '../library/utils/slug.js'
import { downloadCsv } from '../library/utils/csv.js'
import { icon } from '../library/components/ui/icons.js'
import { UNITS, MATERIAL_KINDS, MATERIAL_STATE } from '../library/constants/materials.js'
import { materialState } from '../library/utils/costing.js'
import { adjustMaterial } from '../stockops.js'
import { num } from '../helpers.js'

const can = (p) => auth.can(p)
const REASONS = ['Purchased', 'Used in making', 'Wasted or damaged', 'Stock count correction', 'Returned']
const kindLabel = (k) => MATERIAL_KINDS.find((x) => x[0] === k)?.[1] || k
const fmtQty = (n, u) => `${(+n).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${u}`
const usedIn = (id) => C.boms.all().filter((b) => b.lines.some((l) => l.materialId === id)).length

export function openMaterial(id) {
  const cur = id ? C.materials.get(id) : null, m = cur || { name: '', kind: 'yarn', unit: 'g', cost: '', stock: 0, reorder: 0, pack: '', supplier: '', notes: '' }
  const d = openDrawer({ title: cur ? `Edit ${cur.name}` : 'Add material', size: 'md', body: `<form class="admin-form" id="mf" novalidate>
    ${textField('name', 'Name', m.name, { required: true, placeholder: 'Pink acrylic yarn, 4 ply' })}
    <div class="admin-form__row">${selectField('kind', 'Type', MATERIAL_KINDS, m.kind)}${selectField('unit', 'Counted in', UNITS.map(([v, l]) => [v, l]), m.unit)}</div>
    <div class="admin-form__row">${textField('cost', 'Cost per unit (Rs)', m.cost, { type: 'number', min: 0, step: 'any', inputmode: 'decimal', hint: 'What one gram, metre or piece costs you' })}${textField('pack', 'Bought in packs of', m.pack || '', { type: 'number', min: 0, step: 'any', optional: true, hint: 'Rounds the shopping list up, e.g. 50 for a 50 g ball' })}</div>
    <div class="admin-form__row">${textField('stock', 'In stock', m.stock, { type: 'number', min: 0, step: 'any', inputmode: 'decimal' })}${textField('reorder', 'Reorder when at or below', m.reorder, { type: 'number', min: 0, step: 'any', inputmode: 'decimal' })}</div>
    ${textField('supplier', 'Supplier', m.supplier || '', { optional: true })}${textArea('notes', 'Notes', m.notes || '', { rows: 2, optional: true })}</form>`,
  footer: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" form="mf" type="submit">${cur ? 'Save changes' : 'Add material'}</button>` })
  const f = d.el.querySelector('#mf'); f.querySelector('#name').focus()
  f.addEventListener('submit', (e) => {
    e.preventDefault(); const v = readForm(f)
    const rec = { name: v.name.trim(), kind: v.kind, unit: v.unit, cost: v.cost === '' ? undefined : num(v.cost), stock: Math.max(0, num(v.stock)), reorder: Math.max(0, num(v.reorder)), pack: v.pack === '' ? 0 : num(v.pack), supplier: v.supplier.trim(), notes: v.notes.trim() }
    const { errors } = validate(schemas.material, rec)
    if (C.materials.all().some((x) => x.name.toLowerCase() === rec.name.toLowerCase() && x.id !== cur?.id)) errors.name = 'You already have a material with that name.'
    if (Object.keys(errors).length) return showErrors(f, errors)
    if (cur) { C.materials.update(cur.id, { ...rec, stock: cur.stock }); const delta = rec.stock - cur.stock; if (delta) adjustMaterial(cur.id, delta, 'Edited in material form'); log('material edited', rec.name) }
    else { let nid = slugify(rec.name) || 'material', n = 2; while (C.materials.get(nid)) nid = `${slugify(rec.name)}-${n++}`; C.materials.insert({ id: nid, ...rec, stock: 0 }); if (rec.stock) adjustMaterial(nid, rec.stock, 'Opening stock'); log('material added', rec.name) }
    toast.show(`${rec.name} saved`); d.close()
  })
}

export function openMaterialAdjust(id) {
  const m = C.materials.get(id); if (!m) return
  const d = openDrawer({ title: `Adjust stock · ${m.name}`, body: `<form class="admin-form" id="ad" novalidate><p class="text-sm text-base-content/70">Now <b>${esc(fmtQty(m.stock, m.unit))}</b>. Use a negative number to take stock off.</p>${textField('delta', `Change by (${m.unit})`, '', { type: 'number', step: 'any', inputmode: 'decimal' })}${selectField('reason', 'Reason', REASONS, 'Purchased')}</form>`, footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" form="ad" type="submit">Save</button>' })
  const f = d.el.querySelector('#ad'); f.querySelector('#delta').focus()
  f.addEventListener('submit', (e) => { e.preventDefault(); const v = readForm(f), n = num(v.delta); if (!n) return showErrors(f, { delta: 'Enter a number other than zero.' }); if (m.stock + n < 0) return showErrors(f, { delta: `Only ${fmtQty(m.stock, m.unit)} in stock, so you cannot remove ${fmtQty(Math.abs(n), m.unit)}.` }); adjustMaterial(id, n, v.reason); log('material stock', `${m.name} ${n > 0 ? '+' : ''}${n}${m.unit}`); toast.show(`${m.name}: ${fmtQty(m.stock + n, m.unit)}`); d.close() })
}

export function materials({ params = {} } = {}) {
  const moves = () => { const rows = C.materialmoves.all().sort((a, b) => b.at - a.at).slice(0, 12); return `<h2 class="admin-card__title">Recent movements</h2>${rows.length ? `<ul class="admin-list">${rows.map((x) => `<li><span class="grow"><b>${esc(x.name)}</b><br><small class="text-base-content/60">${esc(x.reason)} · ${esc(String(x.by).split('@')[0])} · ${esc(dates.ago(x.at))}</small></span><b class="${x.delta >= 0 ? 'text-success' : 'text-error'} admin-num">${x.delta > 0 ? '+' : ''}${esc((+x.delta).toLocaleString('en-US', { maximumFractionDigits: 2 }))}</b></li>`).join('')}</ul>` : '<p class="admin-empty">Nothing moved yet. Starting production on an order takes its materials off automatically.</p>'}` }
  return {
    html: html`${raw(pageHeader({ title: 'Materials', subtitle: 'Yarn, wire, wrapping and everything else a recipe uses', actions: `<button class="btn btn-outline btn-sm" data-export>${icon('download', 'size-4')}Export CSV</button>${can('materials:create') ? `<button class="btn btn-primary btn-sm" data-add>${icon('plus', 'size-4')}Add material</button>` : ''}` }))}<div id="dt"></div><article class="admin-card" id="moves">${raw(moves())}</article>`,
    mount(el) {
      const rows = () => C.materials.all().map((m) => ({ ...m, state: materialState(m), value: m.stock * m.cost, used: usedIn(m.id) }))
      const table = createTable({ rows: rows(), searchKeys: ['name', 'supplier', 'kind'], pageSize: 10, defaultSort: { key: 'name', dir: 'asc' }, sorters: { name: (r) => r.name.toLowerCase(), stock: (r) => r.stock }, filters: { state: (r, v) => r.state === v, kind: (r, v) => r.kind === v } })
      const u1 = C.materials.subscribe(() => table.setRows(rows())), u2 = C.boms.subscribe(() => table.setRows(rows())), u3 = C.materialmoves.subscribe(() => { el.querySelector('#moves').innerHTML = moves() })
      mountDataTable(el.querySelector('#dt'), {
        table, initial: params, searchPlaceholder: 'Search materials',
        filters: [{ key: 'state', label: 'Stock level', options: [['', 'All levels'], ['low', 'Low'], ['out', 'Out'], ['ok', 'In stock']] }, { key: 'kind', label: 'Type', options: [['', 'All types'], ...MATERIAL_KINDS] }],
        columns: [
          { key: 'name', label: 'Material', sortable: true, render: (m) => `<div class="admin-cell"><div><b>${esc(m.name)}</b><small>${esc(kindLabel(m.kind))}${m.supplier ? ` · ${esc(m.supplier)}` : ''}</small></div></div>` },
          { key: 'stock', label: 'In stock', sortable: true, render: (m) => `<span class="admin-num font-semibold">${esc(fmtQty(m.stock, m.unit))}</span>` },
          { key: 'state', label: 'Level', render: (m) => `<span class="badge badge-${MATERIAL_STATE[m.state].tone} badge-soft">${MATERIAL_STATE[m.state].label}</span>${m.reorder ? `<br><small class="text-base-content/60">reorder at ${esc(fmtQty(m.reorder, m.unit))}</small>` : ''}` },
          { key: 'cost', label: 'Cost / unit', sortable: true, class: 'text-end', render: (m) => `<span class="admin-num">${esc(money.format(m.cost))}</span>` },
          { key: 'value', label: 'Stock value', sortable: true, class: 'text-end', render: (m) => `<span class="admin-num">${esc(money.format(m.value))}</span>` },
          { key: 'used', label: 'Used in', sortable: true, class: 'text-end', render: (m) => (m.used ? `<span class="admin-num">${m.used} recipe${m.used > 1 ? 's' : ''}</span>` : '<span class="text-base-content/40">Unused</span>') },
        ],
        onRow: can('materials:edit') ? (m) => openMaterial(m.id) : undefined,
        actions: (m) => [...(can('materials:edit') ? [{ id: 'adjust', label: 'Adjust stock…' }, { id: 'edit', label: 'Edit' }] : []), ...(can('materials:delete') ? [{ id: 'del', label: 'Delete', tone: 'error' }] : [])],
        onAction: async (a, m) => {
          if (a === 'adjust') openMaterialAdjust(m.id); if (a === 'edit') openMaterial(m.id)
          if (a === 'del') { const n = usedIn(m.id); if (n) return toast.show(`${m.name} is used in ${n} recipe${n > 1 ? 's' : ''}. Remove it from them first.`, 'error'); if (await confirm({ title: `Delete ${m.name}?`, body: 'Its stock history stays in the log.', action: 'Delete', tone: 'error' })) { C.materials.remove(m.id); log('material deleted', m.name); toast.show(`${m.name} deleted`) } }
        },
        empty: { title: 'No materials yet', body: 'Add the yarn, wire and packaging you use so recipes can be costed.' },
      })
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-add]')) openMaterial()
        if (e.target.closest('[data-export]')) downloadCsv(`urb-materials-${dates.iso(Date.now())}.csv`, table.view().all, [{ key: 'name', label: 'Material' }, { label: 'Type', value: (m) => kindLabel(m.kind) }, { key: 'unit', label: 'Unit' }, { key: 'stock', label: 'In stock' }, { key: 'reorder', label: 'Reorder at' }, { key: 'cost', label: 'Cost per unit' }, { label: 'Stock value', value: (m) => m.value }, { key: 'supplier', label: 'Supplier' }])
      })
      return () => { u1(); u2(); u3() }
    },
  }
}
