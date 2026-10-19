import { C, auth, money, dates, toast, confirm, log, adjustStock, brand, settings, schemas, waLink } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { createTable } from '../library/hooks/use-table.js'
import { createSelection } from '../library/hooks/use-selection.js'
import { mountDataTable } from '../library/components/patterns/data-table.js'
import { pageHeader } from '../library/components/common/page-header.js'
import { badgeFor } from '../library/components/ui/badge.js'
import { openDrawer } from '../library/components/ui/drawer.js'
import { textField, textArea, selectField, readForm, showErrors } from '../library/components/ui/field.js'
import { orderTimeline } from '../library/components/patterns/order-timeline.js'
import { invoice, openPrint } from '../library/components/patterns/invoice.js'
import { ORDER_STATUS, PAYMENT_STATUS } from '../library/constants/statuses.js'
import { downloadCsv } from '../library/utils/csv.js'
import { validate } from '../library/utils/validate.js'
import { icon } from '../library/components/ui/icons.js'
import { imgSrc, payLabel, num } from '../helpers.js'
import { consumeOrder, restoreOrder } from '../stockops.js'

const can = (p) => auth.can(p)
const csvCols = [{ key: 'id', label: 'Order' }, { label: 'Placed', value: (o) => dates.iso(o.at) }, { label: 'Customer', value: (o) => o.customer.name }, { label: 'Phone', value: (o) => o.customer.phone }, { label: 'City', value: (o) => o.customer.city }, { label: 'Address', value: (o) => o.customer.address }, { label: 'Items', value: (o) => o.items.map((i) => `${i.qty}x ${i.name}`).join('; ') }, { label: 'Delivery date', value: (o) => o.date }, { label: 'Slot', value: (o) => o.slot }, { key: 'status', label: 'Status' }, { key: 'payment', label: 'Payment' }, { label: 'Method', value: (o) => payLabel(o.pay) }, { key: 'total', label: 'Total' }]

export function setStatus(order, status) {
  const by = auth.session()?.email || 'system'
  const patch = { status, history: [...(order.history || []), { at: Date.now(), status, by }] }
  if (status === 'cancelled') { if (order.reserved) { order.items.forEach((i) => adjustStock(i.id, i.qty, `Order ${order.id} cancelled`)); patch.reserved = false }; const back = restoreOrder(C.orders.get(order.id) || order); if (back) toast.show(`${order.id} cancelled. ${back} materials returned to stock.`) }
  if (status === 'delivered' && order.pay === 'cod' && order.payment === 'unpaid') { patch.payment = 'paid'; toast.show('Delivered. Cash on delivery marked as paid.') }
  C.orders.update(order.id, patch); log(`order → ${ORDER_STATUS[status].label}`, order.id)
  if (status === 'preparing') {
    const r = consumeOrder(C.orders.get(order.id)); log('materials used', order.id)
    toast.show(r.short.length ? `${order.id}: in production. Short of ${r.short.length} material${r.short.length > 1 ? 's' : ''}, stock set to zero.` : r.noRecipe.length ? `${order.id}: in production. ${r.noRecipe.length} item has no recipe, so no materials were taken.` : `${order.id}: in production. ${r.taken.length} materials taken off stock.`, r.short.length || r.noRecipe.length ? 'warning' : 'success')
  } else if (!patch.payment) toast.show(`${order.id}: ${ORDER_STATUS[status].label}`)
}

export function openOrder(id) {
  const first = C.orders.get(id); if (!first) { toast.show('That order no longer exists.', 'error'); return }
  const d = openDrawer({ title: `Order ${id}`, size: 'lg', body: '' })
  const draw = () => {
    const o = C.orders.get(id); if (!o) return d.close()
    const next = ORDER_STATUS[o.status].next, edit = can('orders:edit')
    d.body.innerHTML = `
      <div class="flex flex-wrap items-center gap-2">${badgeFor(ORDER_STATUS, o.status)}${badgeFor(PAYMENT_STATUS, o.payment)}<span class="text-sm text-base-content/60">Placed ${esc(dates.dateTime(o.at))}${o.demo ? ' · demo' : ''}</span></div>
      ${edit ? `<div class="flex flex-wrap gap-2" role="group" aria-label="Order actions">
        ${next.filter((n) => n !== 'cancelled').map((n) => `<button class="btn btn-primary btn-sm" data-st="${n}">${icon('check', 'size-4')}Mark ${esc(ORDER_STATUS[n].label.toLowerCase())}</button>`).join('')}
        ${o.status !== 'cancelled' ? (o.payment === 'paid' ? `<button class="btn btn-ghost btn-sm" data-pay="unpaid">Mark unpaid</button>` : `<button class="btn btn-secondary btn-sm" data-pay="paid">Mark as paid</button>`) : ''}
        ${next.includes('cancelled') ? '<button class="btn btn-ghost btn-sm text-error" data-st="cancelled">Cancel order</button>' : ''}
        ${o.payment === 'paid' && o.status === 'cancelled' ? '<button class="btn btn-ghost btn-sm" data-pay="refunded">Mark refunded</button>' : ''}
      </div>` : ''}
      <section class="admin-card"><h3 class="admin-card__title">Progress</h3>${orderTimeline(o, dates)}${o.consumed ? `<p class="text-sm text-base-content/70">${icon('check', 'size-4')} Materials were taken off stock when making started (${(o.consumedLines || []).length} materials).</p>` : ''}</section>
      <section class="admin-card"><h3 class="admin-card__title">Items</h3><ul class="admin-list">${o.items.map((i) => { const p = C.products.get(i.id); return `<li><img class="admin-thumb" src="${esc(imgSrc(p?.img))}" alt=""><span class="grow"><b>${esc(i.name)}</b><br><small class="text-base-content/60">${esc(money.format(i.price))} × ${i.qty}</small></span><b class="admin-num">${esc(money.format(i.price * i.qty))}</b></li>` }).join('')}</ul>
        <dl class="admin-kv"><div><dt>Subtotal</dt><dd>${esc(money.format(o.sub))}</dd></div>${o.disc ? `<div><dt>Discount</dt><dd>−${esc(money.format(o.disc))}</dd></div>` : ''}<div><dt>Delivery</dt><dd>${esc(money.format(o.fee))}</dd></div><div class="is-total"><dt>Total</dt><dd>${esc(money.format(o.total))}</dd></div></dl></section>
      <div class="admin-grid-2 admin-grid-2--even">
        <section class="admin-card"><h3 class="admin-card__title">Customer</h3><dl class="admin-kv"><div><dt>Name</dt><dd>${esc(o.customer.name)}</dd></div><div><dt>Phone</dt><dd><a class="link" href="tel:${esc(o.customer.phone)}">${esc(o.customer.phone)}</a></dd></div>${o.customer.email ? `<div><dt>Email</dt><dd><a class="link" href="mailto:${esc(o.customer.email)}">${esc(o.customer.email)}</a></dd></div>` : ''}<div><dt>City</dt><dd>${esc(o.customer.city)}</dd></div><div><dt>Address</dt><dd>${esc(o.customer.address)}</dd></div></dl>
          ${waLink(o.customer.phone) ? `<a class="btn btn-sm btn-outline" target="_blank" rel="noopener" href="${esc(waLink(o.customer.phone, `Hi ${o.customer.name.split(' ')[0]}, about your urb order ${o.id}`))}">${icon('chat', 'size-4')}WhatsApp</a>` : ''}</section>
        <section class="admin-card"><h3 class="admin-card__title">Delivery & payment</h3><dl class="admin-kv"><div><dt>Date</dt><dd>${esc(o.date)}</dd></div><div><dt>Slot</dt><dd>${esc(o.slot)}</dd></div><div><dt>Payment</dt><dd>${esc(payLabel(o.pay))}</dd></div>${o.msg ? `<div><dt>Card message</dt><dd>“${esc(o.msg)}”</dd></div>` : ''}</dl></section>
      </div>
      <section class="admin-card"><h3 class="admin-card__title">Internal notes</h3>
        ${(o.notes || []).length ? `<ul class="admin-list">${o.notes.map((n) => `<li><span class="grow"><b>${esc(n.by.split('@')[0])}</b> <small class="text-base-content/60">${esc(dates.dateTime(n.at))}</small><br>${esc(n.text)}</span></li>`).join('')}</ul>` : '<p class="text-sm text-base-content/60">No notes yet.</p>'}
        ${edit ? `<form data-note class="flex gap-2"><label class="sr-only" for="note-text">Add a note</label><input class="input input-bordered flex-1" id="note-text" placeholder="Add a note for the team" maxlength="300" autocomplete="off"><button class="btn btn-primary" type="submit">Add</button></form>` : ''}</section>`
    if (d.foot === null || !d.foot) { const f = document.createElement('footer'); f.className = 'admin-drawer__foot'; d.el.querySelector('.admin-drawer__panel').appendChild(f); d.foot = f }
    d.foot.innerHTML = `${can('orders:delete') ? '<button class="btn btn-ghost text-error me-auto" data-del>Delete order</button>' : ''}<button class="btn btn-outline" data-print>${icon('print', 'size-4')}Print invoice</button><button class="btn btn-primary" data-close>Done</button>`
  }
  draw()
  const un = C.orders.subscribe(draw)
  d.el.addEventListener('close', un)
  const click = async (e) => {
    const o = C.orders.get(id); if (!o) return
    const st = e.target.closest('[data-st]'), pay = e.target.closest('[data-pay]')
    if (st) { if (st.dataset.st === 'cancelled' && !(await confirm({ title: `Cancel ${o.id}?`, body: 'Items go back into stock. This cannot be undone.', action: 'Cancel order', cancel: 'Keep order', tone: 'error' }))) return; setStatus(o, st.dataset.st) }
    if (pay) { C.orders.update(o.id, { payment: pay.dataset.pay }); log(`payment → ${pay.dataset.pay}`, o.id); toast.show(`Payment marked ${pay.dataset.pay}`) }
    if (e.target.closest('[data-print]')) openPrint(invoice({ order: o, brand, money, dates }))
    if (e.target.closest('[data-del]') && (await confirm({ title: `Delete ${o.id}?`, body: 'The order is removed for good. Stock is not changed.', action: 'Delete', tone: 'error' }))) { C.orders.remove(o.id); log('order deleted', o.id); toast.show(`${o.id} deleted`); d.close() }
  }
  d.el.addEventListener('click', click)
  d.el.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-note]'); if (!f) return; e.preventDefault()
    const text = f.querySelector('input').value.trim(); if (!text) return f.querySelector('input').focus()
    const o = C.orders.get(id); C.orders.update(id, { notes: [...(o.notes || []), { at: Date.now(), by: auth.session().email, text }] }); log('order note', id)
  })
}

export function openNewOrder(prefill = {}) {
  if (!can('orders:create')) { toast.show('Your role cannot create orders.', 'error'); return }
  const prods = C.products.all().filter((p) => p.active !== false)
  const opts = [['', 'Choose a bouquet']].concat(prods.map((p) => [p.id, `${p.name} · ${money.format(p.price)}${p.stock <= 0 ? ' (out of stock)' : ''}`]))
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10)
  const d = openDrawer({ title: 'New order', size: 'lg', body: `<form class="admin-form" id="neworder" novalidate>
    <p class="text-sm text-base-content/70">For orders that arrive by DM or phone. Stock is taken off as soon as you save.</p>
    <div class="admin-form__row">${textField('name', 'Customer name', prefill.name || '', { required: true, autocomplete: 'off' })}${textField('phone', 'Mobile number', prefill.phone || '', { type: 'tel', placeholder: '0300 1234567', inputmode: 'tel' })}</div>
    <div class="admin-form__row">${selectField('city', 'City', settings().cities, settings().cities[0])}${textField('email', 'Email', '', { type: 'email', optional: true })}</div>
    ${textField('address', 'Delivery address', '', { placeholder: 'House, street, area' })}
    <div class="admin-form__row">${textField('date', 'Delivery date', tomorrow, { type: 'date' })}${selectField('slot', 'Time slot', [['Morning', 'Morning (9am to 1pm)'], ['Evening', 'Evening (4pm to 8pm)']], 'Morning')}</div>
    <div class="admin-form__row">${selectField('pay', 'Payment', [['cod', 'Cash on delivery'], ['bank', 'Bank transfer'], ['card', 'Card link']], 'cod')}${textField('msg', 'Card message', '', { optional: true, hint: 'Up to 160 characters' })}</div>
    <fieldset class="grid gap-2"><legend class="admin-field__label">Items</legend><div id="lines" class="grid gap-2"></div><p class="admin-field__error" id="lines-error" role="alert" hidden></p><button type="button" class="btn btn-ghost btn-sm w-fit" data-addline>${icon('plus', 'size-4')}Add another item</button></fieldset>
    <dl class="admin-kv" id="totals"></dl></form>`,
    footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" form="neworder" type="submit">Create order</button>' })
  const form = d.el.querySelector('#neworder'), lines = form.querySelector('#lines')
  const addLine = (pid = '', qty = 1) => { const row = document.createElement('div'); row.className = 'flex gap-2 items-start'; row.innerHTML = `<select class="select select-bordered flex-1 min-w-0" aria-label="Bouquet">${opts.map(([v, l]) => `<option value="${esc(v)}"${v === pid ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select><input class="input input-bordered w-20" type="number" min="1" value="${qty}" aria-label="Quantity"><button type="button" class="btn btn-ghost btn-square" data-rm aria-label="Remove item">${icon('x', 'size-4')}</button>`; lines.appendChild(row) }
  const collect = () => [...lines.children].map((r) => ({ p: C.products.get(r.querySelector('select').value), qty: Math.max(1, Math.floor(num(r.querySelector('input').value))) })).filter((x) => x.p)
  const totals = () => { const l = collect(), sub = l.reduce((t, x) => t + x.p.price * x.qty, 0), fee = l.length ? Math.max(...l.map((x) => x.p.fee)) : 0; form.querySelector('#totals').innerHTML = `<div><dt>Subtotal</dt><dd>${esc(money.format(sub))}</dd></div><div><dt>Delivery</dt><dd>${esc(money.format(fee))}</dd></div><div class="is-total"><dt>Total</dt><dd>${esc(money.format(sub + fee))}</dd></div>`; return { l, sub, fee } }
  addLine(prefill.item || '', 1); totals()
  form.addEventListener('change', totals); form.addEventListener('input', (e) => e.target.type === 'number' && totals())
  d.el.addEventListener('click', (e) => { if (e.target.closest('[data-addline]')) { addLine(); totals() } const rm = e.target.closest('[data-rm]'); if (rm && lines.children.length > 1) { rm.parentElement.remove(); totals() } })
  form.addEventListener('submit', (e) => {
    e.preventDefault(); const v = readForm(form), { l, sub, fee } = totals(), errors = {}
    Object.assign(errors, validate(schemas.customer, { name: v.name, phone: v.phone, email: v.email }).errors)
    if (!/^(\+92|0)?3\d{9}$/.test(String(v.phone).replace(/[\s-]/g, ''))) errors.phone = 'Enter a Pakistani mobile number, like 0300 1234567.'
    if (String(v.address).trim().length < 6) errors.address = 'Add a full address so the rider can find it.'
    if (!v.date || v.date < dates.iso(Date.now())) errors.date = 'Choose today or a later date.'
    const le = form.querySelector('#lines-error'); le.hidden = true
    if (!l.length) { le.textContent = 'Add at least one item.'; le.hidden = false }
    for (const x of l) if (x.qty > x.p.stock) { le.textContent = `Only ${x.p.stock} of ${x.p.name} in stock.`; le.hidden = false }
    if (Object.keys(errors).length || !le.hidden) { showErrors(form, errors); if (!le.hidden && !Object.keys(errors).length) lines.querySelector('select').focus(); return }
    const n = Math.max(100099, ...C.orders.all().map((o) => parseInt(String(o.id).replace(/\D/g, ''), 10) || 0)) + 1
    const now = Date.now(), by = auth.session().email
    const order = C.orders.insert({ id: `URB-${n}`, at: now, status: 'new', payment: 'unpaid', pay: v.pay, customer: { name: v.name.trim(), phone: v.phone, email: v.email, city: v.city, address: v.address.trim() }, items: l.map((x) => ({ id: x.p.id, name: x.p.name, qty: x.qty, price: x.p.price })), sub, disc: 0, fee, total: sub + fee, date: v.date, slot: v.slot, msg: v.msg, notes: [], history: [{ at: now, status: 'new', by }], source: 'admin', reserved: true })
    l.forEach((x) => adjustStock(x.p.id, -x.qty, `Order ${order.id}`)); log('order created', order.id); toast.show(`Order ${order.id} created`); d.close(); location.hash = `#/orders?open=${order.id}`
  })
  form.querySelector('input')?.focus()
}

export function orders({ params, navigate }) {
  return {
    html: html`${raw(pageHeader({ title: 'Orders', subtitle: 'Every order from the storefront and from DMs', actions: can('orders:create') ? `<button class="btn btn-primary btn-sm" data-new>${icon('plus', 'size-4')}New order</button>` : '' }))}<div id="dt"></div>`,
    mount(el) {
      const table = createTable({ rows: C.orders.all(), searchKeys: ['id', 'customer.name', 'customer.phone', 'customer.city'], pageSize: 10, defaultSort: { key: 'at', dir: 'desc' }, sorters: { at: (r) => r.at, total: (r) => r.total, customer: (r) => r.customer.name.toLowerCase() }, filters: { status: (r, v) => r.status === v, payment: (r, v) => r.payment === v } })
      const selection = createSelection()
      const unsub = C.orders.subscribe((rows) => table.setRows(rows))
      mountDataTable(el.querySelector('#dt'), {
        initial: params,
        table, selection, searchPlaceholder: 'Search order, name, phone or city',
        filters: [{ key: 'status', label: 'Status', options: [['', 'All statuses'], ...Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label])] }, { key: 'payment', label: 'Payment', options: [['', 'Any payment'], ...Object.entries(PAYMENT_STATUS).map(([k, v]) => [k, v.label])] }],
        columns: [
          { key: 'id', label: 'Order', sortable: true, render: (o) => `<b>${esc(o.id)}</b>${o.demo ? ' <span class="badge badge-ghost badge-xs">demo</span>' : ''}` },
          { key: 'at', label: 'Placed', sortable: true, render: (o) => `<span class="admin-num">${esc(dates.short(o.at))}</span>` },
          { key: 'customer', label: 'Customer', sortable: true, render: (o) => `<div class="admin-cell"><div><b>${esc(o.customer.name)}</b><small>${esc(o.customer.city)}</small></div></div>` },
          { key: 'items', label: 'Items', render: (o) => `<span class="text-base-content/70">${o.items.reduce((t, i) => t + i.qty, 0)} · ${esc(o.items[0]?.name || '')}${o.items.length > 1 ? ` +${o.items.length - 1}` : ''}</span>` },
          { key: 'total', label: 'Total', sortable: true, class: 'text-end', render: (o) => `<span class="admin-num font-semibold">${esc(money.format(o.total))}</span>` },
          { key: 'payment', label: 'Payment', render: (o) => badgeFor(PAYMENT_STATUS, o.payment) },
          { key: 'status', label: 'Status', render: (o) => badgeFor(ORDER_STATUS, o.status) },
        ],
        onRow: (o) => openOrder(o.id),
        actions: (o) => [{ id: 'open', label: 'View order' }, ...(can('orders:edit') ? ORDER_STATUS[o.status].next.filter((n) => n !== 'cancelled').map((n) => ({ id: `st:${n}`, label: `Mark ${ORDER_STATUS[n].label.toLowerCase()}` })) : []), { id: 'print', label: 'Print invoice' }],
        onAction: (a, o) => { if (a === 'open') openOrder(o.id); else if (a === 'print') openPrint(invoice({ order: o, brand, money, dates })); else if (a.startsWith('st:')) setStatus(o, a.slice(3)) },
        bulk: can('orders:edit') ? [{ id: 'confirmed', label: 'Mark confirmed', tone: 'primary' }, { id: 'paid', label: 'Mark paid' }, { id: 'csv', label: 'Export CSV' }] : [{ id: 'csv', label: 'Export CSV' }],
        onBulk: (id, ids) => {
          const rows = ids.map((i) => C.orders.get(i)).filter(Boolean)
          if (id === 'csv') downloadCsv(`urb-orders-${dates.iso(Date.now())}.csv`, rows, csvCols)
          if (id === 'confirmed') { rows.filter((o) => o.status === 'new').forEach((o) => setStatus(o, 'confirmed')); toast.show('Confirmed the new orders in your selection') }
          if (id === 'paid') { rows.filter((o) => o.status !== 'cancelled').forEach((o) => C.orders.update(o.id, { payment: 'paid' })); log('bulk mark paid', `${rows.length} orders`); toast.show('Marked as paid') }
          selection.clear()
        },
        toolbar: `<button class="btn btn-sm btn-outline" data-export>${icon('download', 'size-4')}Export CSV</button>`,
        empty: { title: 'No orders yet', body: 'Orders from the storefront appear here automatically, or add one by hand.' },
      })
      el.addEventListener('click', (e) => { if (e.target.closest('[data-new]')) openNewOrder(); if (e.target.closest('[data-export]')) downloadCsv(`urb-orders-${dates.iso(Date.now())}.csv`, table.view().all, csvCols) })
      if (params.open) { openOrder(params.open); history.replaceState(null, '', '#/orders') }
      if (params.new) { openNewOrder(); history.replaceState(null, '', '#/orders') }
      return unsub
    },
  }
}
