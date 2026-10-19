import { esc } from '../../utils/html.js'
import { icon } from '../ui/icons.js'
/** KPI tile. statCard({ label, value, delta: +12.5, hint, icon }) ; delta is a percentage vs the previous period. */
export function statCard({ label, value, delta = null, hint = '', icon: ic = null }) {
  const up = delta != null && delta >= 0
  return `<article class="admin-stat"><div class="admin-stat__top"><span class="admin-stat__label">${esc(label)}</span>${ic ? `<span class="admin-stat__icon">${icon(ic, 'size-5')}</span>` : ''}</div><strong class="admin-stat__value">${esc(value)}</strong>
  <p class="admin-stat__foot">${delta == null ? '' : `<span class="admin-delta ${up ? 'is-up' : 'is-down'}">${icon(up ? 'arrowUp' : 'arrowDown', 'size-3.5')}${Math.abs(delta).toFixed(1)}%</span>`}<span class="text-base-content/60">${esc(hint)}</span></p></article>`
}
