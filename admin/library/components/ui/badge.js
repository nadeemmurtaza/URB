import { esc } from '../../utils/html.js'
/** Status pill. badge('Paid', 'success') or badgeFor(ORDER_STATUS, 'new') */
export const badge = (label, tone = 'neutral', soft = true) => `<span class="badge badge-${tone}${soft ? ' badge-soft' : ''} whitespace-nowrap">${esc(label)}</span>`
export const badgeFor = (map, key) => (map[key] ? badge(map[key].label, map[key].tone) : badge(key))
