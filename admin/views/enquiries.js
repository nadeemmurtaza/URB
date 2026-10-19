import { C, auth, money, dates, toast, log, waLink } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { createTable } from '../library/hooks/use-table.js'
import { mountDataTable } from '../library/components/patterns/data-table.js'
import { pageHeader } from '../library/components/common/page-header.js'
import { badgeFor } from '../library/components/ui/badge.js'
import { openDrawer } from '../library/components/ui/drawer.js'
import { ENQUIRY_STATUS } from '../library/constants/statuses.js'
import { icon } from '../library/components/ui/icons.js'
import { num } from '../helpers.js'

const can = () => auth.can('enquiries:edit')

export function openEnquiry(id) {
  if (!C.enquiries.get(id)) return toast.show('That enquiry no longer exists.', 'error')
  const d = openDrawer({ title: 'Enquiry', size: 'lg', body: '' })
  const draw = () => {
    const e = C.enquiries.get(id); if (!e) return d.close()
    d.setTitle(`Enquiry from ${e.name}`)
    const next = ENQUIRY_STATUS[e.status].next
    d.body.innerHTML = `
      <div class="flex flex-wrap items-center gap-2">${badgeFor(ENQUIRY_STATUS, e.status)}<span class="text-sm text-base-content/60">${esc(dates.dateTime(e.at))}${e.demo ? ' · demo' : ''}</span></div>
      <section class="admin-card"><h3 class="admin-card__title">Request</h3><dl class="admin-kv">${e.occasion ? `<div><dt>Occasion</dt><dd>${esc(e.occasion)}</dd></div>` : ''}${e.item ? `<div><dt>About</dt><dd>${esc(e.item)}</dd></div>` : ''}${e.email ? `<div><dt>Email</dt><dd><a class="link" href="mailto:${esc(e.email)}">${esc(e.email)}</a></dd></div>` : ''}${e.phone ? `<div><dt>Phone</dt><dd><a class="link" href="tel:${esc(e.phone)}">${esc(e.phone)}</a></dd></div>` : ''}</dl><p class="rounded-box bg-base-200 p-3">${esc(e.brief)}</p>
        <div class="flex flex-wrap gap-2">${e.phone && waLink(e.phone) ? `<a class="btn btn-sm btn-outline" target="_blank" rel="noopener" href="${esc(waLink(e.phone, `Hi ${e.name.split(' ')[0]}, about your urb request`))}">${icon('chat', 'size-4')}WhatsApp</a>` : ''}${e.email ? `<a class="btn btn-sm btn-outline" href="mailto:${esc(e.email)}?subject=${encodeURIComponent('Your urb request')}&body=${encodeURIComponent(e.reply || '')}">${icon('chat', 'size-4')}Email</a>` : ''}</div></section>
      ${can() ? `<section class="admin-card"><h3 class="admin-card__title">Quote & reply</h3><form id="qf" class="admin-form" novalidate>
        <div class="admin-field"><label class="admin-field__label" for="quote">Quote (Rs)</label><input class="input input-bordered w-full" id="quote" type="number" min="0" step="50" value="${e.quote ?? ''}" inputmode="numeric"><p class="admin-field__error" id="quote-error" role="alert" hidden></p></div>
        <div class="admin-field"><label class="admin-field__label" for="reply">Your reply</label><textarea class="textarea textarea-bordered w-full" id="reply" rows="3" maxlength="600" placeholder="What you will make, the price and when it will be ready">${esc(e.reply || '')}</textarea></div>
        <div class="flex flex-wrap gap-2"><button class="btn btn-primary btn-sm" type="submit">Save quote</button>${next.map((n) => `<button type="button" class="btn btn-sm ${n === 'won' ? 'btn-secondary' : 'btn-ghost'}" data-st="${n}">Mark ${esc(ENQUIRY_STATUS[n].label.toLowerCase())}</button>`).join('')}${e.status === 'won' ? '<button type="button" class="btn btn-sm btn-outline" data-order>Create order…</button>' : ''}</div></form></section>` : ''}`
  }
  draw(); const un = C.enquiries.subscribe(draw); d.el.addEventListener('close', un)
  d.el.addEventListener('submit', (ev) => {
    if (!ev.target.closest('#qf')) return; ev.preventDefault()
    const q = d.el.querySelector('#quote').value, err = d.el.querySelector('#quote-error'); err.hidden = true
    if (q !== '' && num(q) < 0) { err.textContent = 'A quote cannot be negative.'; err.hidden = false; return }
    const e = C.enquiries.get(id), patch = { quote: q === '' ? undefined : Math.round(num(q)), reply: d.el.querySelector('#reply').value.trim() }
    if (e.status === 'new' && patch.quote) patch.status = 'quoted'
    C.enquiries.update(id, patch); log('enquiry quoted', e.name); toast.show(patch.status === 'quoted' ? 'Quote saved, marked as quoted' : 'Saved')
  })
  d.el.addEventListener('click', async (ev) => {
    const s = ev.target.closest('[data-st]'); if (s) { C.enquiries.update(id, { status: s.dataset.st }); log(`enquiry → ${s.dataset.st}`, C.enquiries.get(id).name); toast.show(`Marked ${s.dataset.st}`) }
    if (ev.target.closest('[data-order]')) { const e = C.enquiries.get(id), { openNewOrder } = await import('./orders.js'); d.close(); openNewOrder({ name: e.name, phone: e.phone || '' }) }
  })
}

export function enquiries({ params }) {
  return {
    html: html`${raw(pageHeader({ title: 'Enquiries', subtitle: 'Custom requests from the storefront contact form' }))}<div id="dt"></div>`,
    mount(el) {
      const table = createTable({ rows: C.enquiries.all(), searchKeys: ['name', 'brief', 'item', 'occasion', 'email'], pageSize: 10, defaultSort: { key: 'at', dir: 'desc' }, sorters: { at: (r) => r.at }, filters: { status: (r, v) => r.status === v } })
      const un = C.enquiries.subscribe((rows) => table.setRows(rows))
      mountDataTable(el.querySelector('#dt'), {
        initial: params,
        table, searchPlaceholder: 'Search enquiries',
        filters: [{ key: 'status', label: 'Status', options: [['', 'All statuses'], ...Object.entries(ENQUIRY_STATUS).map(([k, v]) => [k, v.label])] }],
        columns: [
          { key: 'at', label: 'Received', sortable: true, render: (e) => `<span class="admin-num">${esc(dates.short(e.at))}</span>` },
          { key: 'name', label: 'From', sortable: true, render: (e) => `<b>${esc(e.name)}</b>${e.demo ? ' <span class="badge badge-ghost badge-xs">demo</span>' : ''}` },
          { key: 'brief', label: 'Request', render: (e) => `<span class="line-clamp-2 max-w-md text-base-content/80">${esc(e.item ? `${e.item}: ` : '')}${esc(e.brief)}</span>` },
          { key: 'quote', label: 'Quote', class: 'text-end', render: (e) => (e.quote ? `<span class="admin-num font-semibold">${esc(money.format(e.quote))}</span>` : '<span class="text-base-content/40">—</span>') },
          { key: 'status', label: 'Status', render: (e) => badgeFor(ENQUIRY_STATUS, e.status) },
        ],
        onRow: (e) => openEnquiry(e.id),
        actions: (e) => [{ id: 'open', label: 'Open' }, ...(can() ? ENQUIRY_STATUS[e.status].next.map((n) => ({ id: `st:${n}`, label: `Mark ${ENQUIRY_STATUS[n].label.toLowerCase()}` })) : []), ...(auth.can('enquiries:delete') ? [{ id: 'del', label: 'Delete', tone: 'error' }] : [])],
        onAction: (a, e) => { if (a === 'open') openEnquiry(e.id); else if (a === 'del') { C.enquiries.remove(e.id); log('enquiry deleted', e.name); toast.show('Enquiry deleted') } else { C.enquiries.update(e.id, { status: a.slice(3) }); log(`enquiry → ${a.slice(3)}`, e.name) } },
        empty: { title: 'No enquiries yet', body: 'Requests sent from the storefront’s custom bouquet form land here.' },
      })
      if (params.open) { openEnquiry(params.open); history.replaceState(null, '', '#/enquiries') }
      return un
    },
  }
}
