import { C, auth, money, dates, toast, log, waLink } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { createTable } from '../library/hooks/use-table.js'
import { mountDataTable } from '../library/components/patterns/data-table.js'
import { pageHeader } from '../library/components/common/page-header.js'
import { badgeFor } from '../library/components/ui/badge.js'
import { openDrawer } from '../library/components/ui/drawer.js'
import { ORDER_STATUS } from '../library/constants/statuses.js'
import { downloadCsv } from '../library/utils/csv.js'
import { icon } from '../library/components/ui/icons.js'
import { customers as derive } from '../helpers.js'

function openCustomer(id) {
  const c = derive().find((x) => x.id === id); if (!c) return
  const d = openDrawer({ title: c.name, size: 'lg', body: `
    <div class="admin-grid-stats">${[['Orders', c.orders.length], ['Spent', money.format(c.spent)], ['First order', dates.short(c.first)], ['Last order', dates.short(c.last)]].map(([l, v]) => `<article class="admin-stat"><span class="admin-stat__label">${l}</span><strong class="admin-stat__value">${esc(v)}</strong></article>`).join('')}</div>
    <section class="admin-card"><h3 class="admin-card__title">Contact</h3><dl class="admin-kv"><div><dt>Phone</dt><dd><a class="link" href="tel:${esc(c.phone)}">${esc(c.phone)}</a></dd></div>${c.email ? `<div><dt>Email</dt><dd><a class="link" href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd></div>` : ''}<div><dt>City</dt><dd>${esc(c.city)}</dd></div></dl>${waLink(c.phone) ? `<a class="btn btn-sm btn-outline w-fit" target="_blank" rel="noopener" href="${esc(waLink(c.phone, `Hi ${c.name.split(' ')[0]}, it's urb`))}">${icon('chat', 'size-4')}WhatsApp</a>` : ''}</section>
    <section class="admin-card"><h3 class="admin-card__title">Notes</h3><form id="cn" class="grid gap-2"><label class="sr-only" for="cn-t">Notes about ${esc(c.name)}</label><textarea class="textarea textarea-bordered w-full" id="cn-t" rows="3" maxlength="600" placeholder="Favourite colours, birthdays, delivery tips">${esc(c.notes)}</textarea><button class="btn btn-primary btn-sm w-fit" type="submit" ${auth.can('customers:edit') ? '' : 'disabled'}>Save notes</button></form></section>
    <section class="admin-card"><h3 class="admin-card__title">Orders</h3><ul class="admin-list">${c.orders.sort((a, b) => b.at - a.at).map((o) => `<li><a class="grow" href="#/orders?open=${esc(o.id)}" data-close-link><b>${esc(o.id)}</b> <span class="text-base-content/60">${esc(dates.short(o.at))}</span></a><span class="admin-num font-semibold">${esc(money.format(o.total))}</span>${badgeFor(ORDER_STATUS, o.status)}</li>`).join('')}</ul></section>` })
  d.el.querySelector('#cn').addEventListener('submit', (e) => { e.preventDefault(); C.customers.upsert({ id: c.id, name: c.name, phone: c.phone, notes: d.el.querySelector('#cn-t').value.trim() }); log('customer notes', c.name); toast.show('Notes saved') })
  d.el.addEventListener('click', (e) => { if (e.target.closest('[data-close-link]')) d.close() })
}

export function customers({ params = {} } = {}) {
  return {
    html: html`${raw(pageHeader({ title: 'Customers', subtitle: 'Built automatically from orders, grouped by phone number', actions: `<button class="btn btn-outline btn-sm" data-export>${icon('download', 'size-4')}Export CSV</button>` }))}<div id="dt"></div>`,
    mount(el) {
      const table = createTable({ rows: derive(), searchKeys: ['name', 'phone', 'city', 'email'], pageSize: 10, defaultSort: { key: 'last', dir: 'desc' }, sorters: { orders: (r) => r.orders.length, name: (r) => r.name.toLowerCase() }, filters: { city: (r, v) => r.city === v, repeat: (r, v) => (v === 'repeat' ? r.orders.length > 1 : r.orders.length === 1) } })
      const un = C.orders.subscribe(() => table.setRows(derive()))
      const cities = [...new Set(derive().map((c) => c.city))].sort()
      mountDataTable(el.querySelector('#dt'), {
        initial: params,
        table, searchPlaceholder: 'Search name, phone or city',
        filters: [{ key: 'city', label: 'City', options: [['', 'All cities'], ...cities.map((c) => [c, c])] }, { key: 'repeat', label: 'Type', options: [['', 'All customers'], ['repeat', 'Repeat'], ['first', 'First-time']] }],
        columns: [
          { key: 'name', label: 'Customer', sortable: true, render: (c) => `<div class="admin-cell"><span class="admin-user__av size-9">${esc(c.name.slice(0, 1))}</span><div><b>${esc(c.name)}</b><small>${esc(c.phone)}</small></div></div>` },
          { key: 'city', label: 'City', sortable: true },
          { key: 'orders', label: 'Orders', sortable: true, class: 'text-end', render: (c) => `<span class="admin-num">${c.orders.length}</span>${c.orders.length > 1 ? ' <span class="badge badge-success badge-soft badge-sm">repeat</span>' : ''}` },
          { key: 'spent', label: 'Spent', sortable: true, class: 'text-end', render: (c) => `<span class="admin-num font-semibold">${esc(money.format(c.spent))}</span>` },
          { key: 'last', label: 'Last order', sortable: true, render: (c) => `<span class="admin-num">${esc(dates.short(c.last))}</span>` },
        ],
        onRow: (c) => openCustomer(c.id),
        actions: (c) => [{ id: 'open', label: 'View customer' }, ...(auth.can('orders:create') ? [{ id: 'order', label: 'New order for them' }] : [])],
        onAction: async (a, c) => { if (a === 'open') openCustomer(c.id); if (a === 'order') { const { openNewOrder } = await import('./orders.js'); openNewOrder({ name: c.name, phone: c.phone }) } },
        empty: { title: 'No customers yet', body: 'They appear as soon as the first order is placed.' },
      })
      el.addEventListener('click', (e) => { if (e.target.closest('[data-export]')) downloadCsv(`urb-customers-${dates.iso(Date.now())}.csv`, table.view().all, [{ key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' }, { key: 'city', label: 'City' }, { label: 'Orders', value: (c) => c.orders.length }, { key: 'spent', label: 'Spent' }, { label: 'Last order', value: (c) => dates.iso(c.last) }, { key: 'notes', label: 'Notes' }]) })
      return un
    },
  }
}
