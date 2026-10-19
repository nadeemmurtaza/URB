import { C, auth, money, dates, toast, adjustStock, log, settings } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { createTable } from '../library/hooks/use-table.js'
import { mountDataTable } from '../library/components/patterns/data-table.js'
import { pageHeader } from '../library/components/common/page-header.js'
import { openDrawer } from '../library/components/ui/drawer.js'
import { textField, selectField, readForm, showErrors } from '../library/components/ui/field.js'
import { downloadCsv } from '../library/utils/csv.js'
import { icon } from '../library/components/ui/icons.js'
import { imgSrc, stockBadge, isLow, num } from '../helpers.js'

const REASONS = ['Restock', 'Sold offline', 'Damaged', 'Stock count correction', 'Returned']
const can = () => auth.can('inventory:edit')

function openAdjust(id) {
  const p = C.products.get(id); if (!p) return
  const d = openDrawer({ title: `Adjust stock · ${p.name}`, body: `<form class="admin-form" id="adj" novalidate><p class="text-sm text-base-content/70">Currently <b>${p.stock}</b> in stock. Use a negative number to remove.</p>${textField('delta', 'Change by', '1', { type: 'number', step: 1, inputmode: 'numeric' })}${selectField('reason', 'Reason', REASONS, 'Restock')}</form>`, footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" form="adj" type="submit">Save</button>' })
  const f = d.el.querySelector('#adj'); f.querySelector('#delta').select()
  f.addEventListener('submit', (e) => { e.preventDefault(); const v = readForm(f), n = Math.round(num(v.delta)); if (!n) return showErrors(f, { delta: 'Enter a number other than zero.' }); if (p.stock + n < 0) return showErrors(f, { delta: `Only ${p.stock} in stock, so you cannot remove ${Math.abs(n)}.` }); adjustStock(id, n, v.reason); log('stock adjusted', `${p.name} ${n > 0 ? '+' : ''}${n}`); toast.show(`${p.name}: ${p.stock + n} in stock`); d.close() })
}

export function inventory({ params = {} } = {}) {
  const log20 = () => C.stockmoves.all().sort((a, b) => b.at - a.at).slice(0, 15)
  const moves = () => `<h2 class="admin-card__title">Recent stock movements</h2>${log20().length ? `<ul class="admin-list">${log20().map((m) => `<li><span class="grow"><b>${esc(m.name)}</b><br><small class="text-base-content/60">${esc(m.reason)} · ${esc(m.by.split('@')[0])} · ${esc(dates.ago(m.at))}</small></span><b class="${m.delta >= 0 ? 'text-success' : 'text-error'}">${m.delta > 0 ? '+' : ''}${m.delta}</b></li>`).join('')}</ul>` : '<p class="admin-empty">No movements yet.</p>'}`
  return {
    html: html`${raw(pageHeader({ title: 'Inventory', subtitle: `Low stock is ${settings().lowStock} or fewer. Change it in Settings.`, actions: `<button class="btn btn-outline btn-sm" data-export>${icon('download', 'size-4')}Export CSV</button>` }))}<div id="dt"></div><article class="admin-card" id="moves">${raw(moves())}</article>`,
    mount(el) {
      const table = createTable({ rows: C.products.all(), searchKeys: ['name', 'id'], pageSize: 10, defaultSort: { key: 'stock', dir: 'asc' }, sorters: { name: (r) => r.name.toLowerCase() }, filters: { st: (r, v) => (v === 'low' ? isLow(r) && r.stock > 0 : v === 'out' ? r.stock <= 0 : r.stock > settings().lowStock) } })
      const u1 = C.products.subscribe((rows) => table.setRows(rows)), u2 = C.stockmoves.subscribe(() => { el.querySelector('#moves').innerHTML = moves() })
      mountDataTable(el.querySelector('#dt'), {
        initial: params,
        table, searchPlaceholder: 'Search bouquets',
        filters: [{ key: 'st', label: 'Stock level', options: [['', 'All levels'], ['low', 'Low'], ['out', 'Out of stock'], ['ok', 'Well stocked']] }],
        columns: [
          { key: 'name', label: 'Bouquet', sortable: true, render: (p) => `<div class="admin-cell"><img class="admin-thumb" src="${esc(imgSrc(p.img))}" alt="" loading="lazy"><div><b>${esc(p.name)}</b><small>${p.active === false ? 'hidden on storefront' : 'on storefront'}</small></div></div>` },
          { key: 'stock', label: 'In stock', sortable: true, render: (p) => `<div class="join" role="group" aria-label="Stock for ${esc(p.name)}"><button class="btn btn-xs join-item" data-adj="-1" aria-label="Remove one" ${can() && p.stock > 0 ? '' : 'disabled'}>−</button><span class="join-item admin-num inline-flex min-w-10 items-center justify-center border border-base-300 px-2 text-sm font-bold">${p.stock}</span><button class="btn btn-xs join-item" data-adj="1" aria-label="Add one" ${can() ? '' : 'disabled'}>+</button></div>` },
          { key: 'level', label: 'Level', render: (p) => stockBadge(p.stock) },
          { key: 'price', label: 'Stock value', class: 'text-end', render: (p) => `<span class="admin-num">${esc(money.format(p.price * p.stock))}</span>` },
        ],
        actions: (p) => (can() ? [{ id: 'adjust', label: 'Adjust stock…' }, { id: 'edit', label: 'Edit bouquet' }] : []),
        onAction: (a, p) => { if (a === 'adjust') openAdjust(p.id); if (a === 'edit') location.hash = `#/products?edit=${p.id}` },
        empty: { title: 'No bouquets to count', body: 'Add bouquets first.' },
      })
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-adj]'); if (b) { const id = b.closest('tr').dataset.id, n = +b.dataset.adj; adjustStock(id, n, n > 0 ? 'Quick add' : 'Quick remove'); return }
        if (e.target.closest('[data-export]')) downloadCsv(`urb-stock-${dates.iso(Date.now())}.csv`, C.products.all(), [{ key: 'name', label: 'Bouquet' }, { key: 'stock', label: 'In stock' }, { key: 'price', label: 'Price' }, { label: 'Stock value', value: (p) => p.price * p.stock }])
      })
      return () => { u1(); u2() }
    },
  }
}
