import { C, money, dates, settings } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { pageHeader } from '../library/components/common/page-header.js'
import { statCard } from '../library/components/common/stat-card.js'
import { barChart, donut } from '../library/components/common/charts.js'
import { badgeFor } from '../library/components/ui/badge.js'
import { ORDER_STATUS } from '../library/constants/statuses.js'
import { imgSrc, orderTotals, pct, live, stockBadge, isLow } from '../helpers.js'
import { materialState } from '../library/utils/costing.js'
import { icon } from '../library/components/ui/icons.js'

export function dashboard({ params, navigate }) {
  const days = [7, 14, 30].includes(+params.range) ? +params.range : 14
  const all = C.orders.all(), now = Date.now(), day0 = dates.startOfDay(now).getTime()
  const inRange = (o, from, to) => o.at >= from && o.at < to
  const cur = all.filter((o) => inRange(o, day0 - (days - 1) * 864e5, now + 1)), prev = all.filter((o) => inRange(o, day0 - (2 * days - 1) * 864e5, day0 - (days - 1) * 864e5))
  const a = orderTotals(cur), b = orderTotals(prev)
  const pending = all.filter((o) => ['new', 'confirmed', 'preparing'].includes(o.status))
  const series = Array.from({ length: days }, (_, i) => { const s = day0 - (days - 1 - i) * 864e5; return { label: dates.short(s).replace(/ \w+$/, '') + (days <= 14 ? '' : ''), value: all.filter((o) => live(o) && o.at >= s && o.at < s + 864e5).reduce((t, o) => t + o.total, 0), d: s } })
  series.forEach((s) => (s.label = dates.short(s.d)))
  const byStatus = Object.keys(ORDER_STATUS).map((k) => ({ label: ORDER_STATUS[k].label, value: all.filter((o) => o.status === k).length, tone: ORDER_STATUS[k].tone }))
  const units = new Map(); cur.filter(live).forEach((o) => o.items.forEach((i) => units.set(i.id, (units.get(i.id) || 0) + i.qty)))
  const top = [...units.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([id, n]) => ({ p: C.products.get(id), n })).filter((x) => x.p)
  const low = C.products.all().filter((p) => p.active !== false && isLow(p)).sort((x, y) => x.stock - y.stock).slice(0, 6)
  const lowMats = C.materials.all().filter((m) => materialState(m) !== 'ok').sort((x, y) => x.stock / (x.reorder || 1) - y.stock / (y.reorder || 1)).slice(0, 4)
  const recent = [...all].sort((x, y) => y.at - x.at).slice(0, 6)
  const enq = C.enquiries.all().filter((e) => e.status === 'new').slice(0, 4)
  const range = [7, 14, 30].map((d) => `<a class="btn btn-sm ${d === days ? 'btn-primary' : 'btn-ghost'}" href="#/dashboard?range=${d}" aria-pressed="${d === days}">${d} days</a>`).join('')
  const demo = all.some((o) => o.demo)
  return html`
  ${raw(pageHeader({ title: 'Dashboard', subtitle: `Last ${days} days, compared with the ${days} before`, actions: `<div class="join">${range}</div><a class="btn btn-primary btn-sm" href="#/orders?new=1">${icon('plus', 'size-4')}New order</a>` }))}
  ${demo ? raw('<div role="note" class="alert alert-info alert-soft text-sm"><span>Showing fictional demo orders so the charts have something to draw. Remove them any time in <a class="link font-semibold" href="#/settings">Settings → Data</a>.</span></div>') : ''}
  <section class="admin-grid-stats" aria-label="Key numbers">
    ${raw(statCard({ label: 'Revenue', value: money.format(a.revenue), delta: pct(a.revenue, b.revenue), hint: `vs ${money.format(b.revenue)}`, icon: 'tag' }))}
    ${raw(statCard({ label: 'Orders', value: String(a.count), delta: pct(a.count, b.count), hint: `vs ${b.count}`, icon: 'bag' }))}
    ${raw(statCard({ label: 'Average order', value: money.format(a.aov), delta: pct(a.aov, b.aov), hint: 'per order', icon: 'flower' }))}
    ${raw(statCard({ label: 'To fulfil', value: String(pending.length), hint: 'new, confirmed or preparing', icon: 'truck' }))}
  </section>
  <section class="admin-grid-2">
    <article class="admin-card"><div class="admin-card__head"><h2 class="admin-card__title">Revenue per day</h2><span class="text-sm text-base-content/60">${esc(money.format(a.revenue))} total</span></div>${raw(barChart({ data: series, format: (v) => money.format(v) }))}</article>
    <article class="admin-card"><div class="admin-card__head"><h2 class="admin-card__title">Orders by status</h2><span class="text-sm text-base-content/60">all time</span></div>
      <div class="flex flex-wrap items-center gap-4">${raw(donut({ data: byStatus, centre: String(all.length) }))}<ul class="admin-legend">${raw(byStatus.map((s) => `<li><i class="t-${s.tone}"></i>${esc(s.label)}<b>${s.value}</b></li>`).join(''))}</ul></div></article>
  </section>
  <section class="admin-grid-2 admin-grid-2--even">
    <article class="admin-card"><div class="admin-card__head"><h2 class="admin-card__title">Recent orders</h2><a class="link text-sm" href="#/orders">View all</a></div>
      ${recent.length ? raw(`<ul class="admin-list">${recent.map((o) => `<li><a class="grow" href="#/orders?open=${esc(o.id)}"><b>${esc(o.id)}</b> <span class="text-base-content/60">${esc(o.customer.name)} · ${esc(dates.ago(o.at))}</span></a><span class="admin-num font-semibold">${esc(money.format(o.total))}</span>${badgeFor(ORDER_STATUS, o.status)}</li>`).join('')}</ul>`) : raw('<p class="admin-empty">No orders yet. They appear here as soon as someone checks out on the storefront or you add one.</p>')}</article>
    <article class="admin-card"><div class="admin-card__head"><h2 class="admin-card__title">Top bouquets</h2><span class="text-sm text-base-content/60">by units</span></div>
      ${top.length ? raw(`<ul class="admin-list">${top.map(({ p, n }) => `<li><img class="admin-thumb" src="${esc(imgSrc(p.img))}" alt=""><span class="grow"><b>${esc(p.name)}</b><br><small class="text-base-content/60">${esc(money.format(p.price))}</small></span><span class="font-bold">${n} sold</span></li>`).join('')}</ul>`) : raw('<p class="admin-empty">Nothing sold in this period.</p>')}</article>
    <article class="admin-card"><div class="admin-card__head"><h2 class="admin-card__title">Low stock</h2><a class="link text-sm" href="#/inventory">Inventory</a></div>
      ${low.length ? raw(`<ul class="admin-list">${low.map((p) => `<li><img class="admin-thumb" src="${esc(imgSrc(p.img))}" alt=""><span class="grow"><b>${esc(p.name)}</b></span>${stockBadge(p.stock)}</li>`).join('')}</ul>`) : raw('<p class="admin-empty">Every bouquet is comfortably stocked.</p>')}
      ${lowMats.length ? raw(`<div class="admin-card__head"><h3 class="font-semibold">Materials to reorder</h3><a class="link text-sm" href="#/production">Make list</a></div><ul class="admin-list">${lowMats.map((m) => `<li><span class="grow"><b>${esc(m.name)}</b></span><span class="badge badge-${m.stock <= 0 ? 'error' : 'warning'} badge-soft">${m.stock <= 0 ? 'out' : `${Math.round(m.stock)} ${esc(m.unit)} left`}</span></li>`).join('')}</ul>`) : ''}</article>
    <article class="admin-card"><div class="admin-card__head"><h2 class="admin-card__title">New enquiries</h2><a class="link text-sm" href="#/enquiries">View all</a></div>
      ${enq.length ? raw(`<ul class="admin-list">${enq.map((e) => `<li><a class="grow" href="#/enquiries?open=${esc(e.id)}"><b>${esc(e.name)}</b><br><small class="text-base-content/60">${esc((e.brief || '').slice(0, 70))}${(e.brief || '').length > 70 ? '…' : ''}</small></a><span class="text-sm text-base-content/60">${esc(dates.ago(e.at))}</span></li>`).join('')}</ul>`) : raw('<p class="admin-empty">No new enquiries.</p>')}</article>
  </section>`
}
