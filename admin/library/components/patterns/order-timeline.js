import { esc } from '../../utils/html.js'
import { ORDER_FLOW, ORDER_STATUS } from '../../constants/statuses.js'
/** Horizontal/vertical progress for an order. timeline(order, dates) where dates.dateTime formats a timestamp. */
export function orderTimeline(order, dates) {
  const cancelled = order.status === 'cancelled', idx = ORDER_FLOW.indexOf(order.status)
  const when = (s) => { const h = (order.history || []).filter((x) => x.status === s).pop(); return h ? dates.dateTime(h.at) : '' }
  return `<ol class="admin-steps">${(cancelled ? [...ORDER_FLOW.slice(0, Math.max(1, (order.history || []).filter((h) => h.status !== 'cancelled').length)), 'cancelled'] : ORDER_FLOW).map((s, i) => {
    const st = cancelled ? (s === 'cancelled' ? 'bad' : 'done') : i < idx ? 'done' : i === idx ? 'now' : 'next'
    return `<li data-state="${st}"><span class="admin-steps__dot"></span><div><strong>${esc(ORDER_STATUS[s].label)}</strong><small>${esc(when(s))}</small></div></li>`
  }).join('')}</ol>`
}
