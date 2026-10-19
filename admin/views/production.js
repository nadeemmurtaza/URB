import { C, auth, money, dates, toast, confirm, log } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { createTable } from '../library/hooks/use-table.js'
import { mountDataTable } from '../library/components/patterns/data-table.js'
import { pageHeader } from '../library/components/common/page-header.js'
import { explode, shoppingPlan, isOpen } from '../library/utils/costing.js'
import { badgeFor } from '../library/components/ui/badge.js'
import { ORDER_STATUS } from '../library/constants/statuses.js'
import { downloadCsv } from '../library/utils/csv.js'
import { icon } from '../library/components/ui/icons.js'
import { setStatus } from './orders.js'

const fmt = (n, u) => `${(+n).toLocaleString('en-US', { maximumFractionDigits: 1 })} ${u}`

function snapshot() {
  const open = C.orders.all().filter(isOpen), boms = C.boms.all(), mats = C.materials.all()
  const { needs, noRecipe } = explode({ orders: open, boms }), plan = shoppingPlan(needs, mats)
  const covered = (o) => o.items.every((i) => boms.some((b) => b.id === i.id && b.lines?.length))
  return { open: open.sort((a, b) => (a.date || '').localeCompare(b.date || '')), plan, noRecipe, covered, spend: plan.reduce((t, p) => t + p.cost, 0), shortN: plan.filter((p) => p.short > 0).length }
}

export function production({ params = {} } = {}) {
  const view = () => {
    const s = snapshot()
    return `<section class="admin-grid-stats"><article class="admin-stat"><div class="admin-stat__top"><span class="admin-stat__label">Orders to make</span><span class="admin-stat__icon">${icon('bag', 'size-5')}</span></div><strong class="admin-stat__value">${s.open.length}</strong><p class="admin-stat__foot text-base-content/60">new, confirmed, or in production but not started</p></article>
      <article class="admin-stat"><div class="admin-stat__top"><span class="admin-stat__label">Materials needed</span><span class="admin-stat__icon">${icon('layers', 'size-5')}</span></div><strong class="admin-stat__value">${s.plan.length}</strong><p class="admin-stat__foot text-base-content/60">different materials</p></article>
      <article class="admin-stat"><div class="admin-stat__top"><span class="admin-stat__label">Short of stock</span><span class="admin-stat__icon">${icon('alert', 'size-5')}</span></div><strong class="admin-stat__value ${s.shortN ? 'text-error' : ''}">${s.shortN}</strong><p class="admin-stat__foot text-base-content/60">${s.shortN ? 'to buy before you can finish' : 'you have everything'}</p></article>
      <article class="admin-stat"><div class="admin-stat__top"><span class="admin-stat__label">Estimated purchase</span><span class="admin-stat__icon">${icon('tag', 'size-5')}</span></div><strong class="admin-stat__value">${esc(money.format(s.spend))}</strong><p class="admin-stat__foot text-base-content/60">rounded up to whole packs</p></article></section>
      ${s.noRecipe.length ? `<div role="note" class="alert alert-warning alert-soft text-sm"><span><b>${s.noRecipe.length} item${s.noRecipe.length > 1 ? 's have' : ' has'} no recipe</b>, so ${s.noRecipe.length > 1 ? 'their' : 'its'} materials are not counted: ${s.noRecipe.map((n) => `${esc(n.name)} ×${n.qty}`).join(', ')}. <a class="link font-semibold" href="#/bom?state=none">Create recipes</a></span></div>` : ''}`
  }
  return {
    html: html`${raw(pageHeader({ title: 'Make list', subtitle: 'What the open orders need, set against what is on the shelf', actions: `<button class="btn btn-outline btn-sm" data-export>${icon('download', 'size-4')}Shopping list CSV</button><button class="btn btn-outline btn-sm" data-print>${icon('print', 'size-4')}Print</button>` }))}<div id="sum">${raw(view())}</div><div id="dt"></div>
    <article class="admin-card"><div class="admin-card__head"><h2 class="admin-card__title">Orders in this list</h2><span class="text-sm text-base-content/60">earliest delivery first</span></div><div id="orders"></div></article>`,
    mount(el) {
      const rows = () => snapshot().plan.map((p) => ({ ...p, id: p.materialId, shortFlag: p.short > 0 ? 'yes' : 'no' }))
      const table = createTable({ rows: rows(), searchKeys: ['name'], pageSize: 25, defaultSort: { key: 'short', dir: 'desc' }, sorters: { name: (r) => r.name.toLowerCase() }, filters: { short: (r, v) => (v === 'yes' ? r.short > 0 : true) } })
      const ordersHtml = () => { const s = snapshot(); return s.open.length ? `<ul class="admin-list">${s.open.map((o) => `<li><span class="grow"><a class="font-semibold" href="#/orders?open=${esc(o.id)}">${esc(o.id)}</a> <span class="text-base-content/60">${esc(o.customer.name)} · deliver ${esc(o.date || '?')} · ${o.items.map((i) => `${i.qty}× ${esc(i.name)}`).join(', ')}</span>${s.covered(o) ? '' : '<br><small class="text-warning">has an item with no recipe</small>'}</span>${badgeFor(ORDER_STATUS, o.status)}${auth.can('orders:edit') ? `<button class="btn btn-primary btn-sm" data-start="${esc(o.id)}">Start making</button>` : ''}</li>`).join('')}</ul>` : '<p class="admin-empty">Nothing to make right now. New orders appear here as they arrive.</p>' }
      el.querySelector('#orders').innerHTML = ordersHtml()
      const refresh = () => { table.setRows(rows()); el.querySelector('#sum').innerHTML = view(); el.querySelector('#orders').innerHTML = ordersHtml() }
      const subs = [C.orders.subscribe(refresh), C.boms.subscribe(refresh), C.materials.subscribe(refresh)]
      mountDataTable(el.querySelector('#dt'), {
        table, initial: params, searchPlaceholder: 'Search materials',
        filters: [{ key: 'short', label: 'Show', options: [['', 'All needed'], ['yes', 'Short only']] }],
        columns: [
          { key: 'name', label: 'Material', sortable: true, render: (r) => `<b>${esc(r.name)}</b>` },
          { key: 'need', label: 'Needed', sortable: true, class: 'text-end', render: (r) => `<span class="admin-num">${esc(fmt(r.need, r.unit))}</span>` },
          { key: 'onHand', label: 'On hand', sortable: true, class: 'text-end', render: (r) => `<span class="admin-num">${esc(fmt(r.onHand, r.unit))}</span>` },
          { key: 'short', label: 'Short by', sortable: true, class: 'text-end', render: (r) => (r.short > 0 ? `<span class="badge badge-error badge-soft admin-num">${esc(fmt(r.short, r.unit))}</span>` : '<span class="badge badge-success badge-soft">enough</span>') },
          { key: 'buy', label: 'Buy (whole packs)', sortable: true, class: 'text-end', render: (r) => (r.buy ? `<span class="admin-num font-semibold">${esc(fmt(r.buy, r.unit))}</span>` : '<span class="text-base-content/40">—</span>') },
          { key: 'cost', label: 'Est. cost', sortable: true, class: 'text-end', render: (r) => (r.cost ? `<span class="admin-num">${esc(money.format(r.cost))}</span>` : '<span class="text-base-content/40">—</span>') },
        ],
        empty: { title: 'No materials needed', body: 'Orders with recipes will list their materials here.' },
      })
      el.addEventListener('click', async (e) => {
        const st = e.target.closest('[data-start]')
        if (st) {
          const o = C.orders.get(st.dataset.start); if (!o) return
          const need = explode({ orders: [o], boms: C.boms.all() }).needs, short = shoppingPlan(need, C.materials.all()).filter((p) => p.short > 0)
          if (short.length && !(await confirm({ title: 'Not enough materials', body: `Short of ${short.map((s) => `${s.name} (${fmt(s.short, s.unit)})`).join(', ')}. Start anyway? Stock will go to zero for those.`, action: 'Start anyway', tone: 'warning' }))) return
          if (o.status === 'new') setStatus(o, 'confirmed')
          setStatus(C.orders.get(o.id), 'preparing')
        }
        if (e.target.closest('[data-export]')) downloadCsv(`urb-shopping-list-${dates.iso(Date.now())}.csv`, snapshot().plan.filter((p) => p.short > 0), [{ key: 'name', label: 'Material' }, { key: 'unit', label: 'Unit' }, { label: 'Needed', value: (p) => +p.need.toFixed(2) }, { label: 'On hand', value: (p) => +p.onHand.toFixed(2) }, { label: 'Short by', value: (p) => +p.short.toFixed(2) }, { label: 'Buy', value: (p) => +p.buy.toFixed(2) }, { label: 'Estimated cost', value: (p) => Math.round(p.cost) }])
        if (e.target.closest('[data-print]')) window.print()
      })
      return () => subs.forEach((u) => u())
    },
  }
}
