/** Dependency-free SVG charts that follow the theme (currentColor + daisyUI vars). */
import { esc } from '../../utils/html.js'

/** barChart({ data: [{ label, value }], format, height }) */
export function barChart({ data, format = (v) => v, height = 200 }) {
  const w = 600, pad = { l: 8, r: 8, t: 14, b: 26 }, max = Math.max(1, ...data.map((d) => d.value))
  const bw = (w - pad.l - pad.r) / data.length, ih = height - pad.t - pad.b
  const bars = data.map((d, i) => {
    const h = Math.max(d.value ? 3 : 0, (d.value / max) * ih), x = pad.l + i * bw + bw * 0.18, y = pad.t + ih - h
    return `<g class="admin-bar"><title>${esc(d.label)}: ${esc(format(d.value))}</title><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${h.toFixed(1)}" rx="4"/>${data.length <= 16 || i % 2 === 0 ? `<text x="${(x + bw * 0.32).toFixed(1)}" y="${height - 8}" text-anchor="middle">${esc(d.label)}</text>` : ''}</g>`
  }).join('')
  return `<svg class="admin-chart" viewBox="0 0 ${w} ${height}" role="img" aria-label="Bar chart">${[0.25, 0.5, 0.75, 1].map((f) => `<line class="admin-grid" x1="${pad.l}" x2="${w - pad.r}" y1="${(pad.t + ih * (1 - f)).toFixed(1)}" y2="${(pad.t + ih * (1 - f)).toFixed(1)}"/>`).join('')}${bars}</svg>`
}

/** donut({ data: [{ label, value, tone }], total label }) tones map to daisyUI colour vars. */
export function donut({ data, centre = '' }) {
  const total = data.reduce((t, d) => t + d.value, 0) || 1, r = 52, c = 2 * Math.PI * r
  let off = 0
  const arcs = data.filter((d) => d.value > 0).map((d) => { const len = (d.value / total) * c; const s = `<circle class="admin-arc admin-arc--${d.tone}" cx="70" cy="70" r="${r}" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"><title>${esc(d.label)}: ${d.value}</title></circle>`; off += len; return s }).join('')
  return `<svg class="admin-donut" viewBox="0 0 140 140" role="img" aria-label="Distribution"><circle class="admin-arc admin-arc--track" cx="70" cy="70" r="${r}"/>${arcs}<text x="70" y="75" text-anchor="middle" class="admin-donut__text">${esc(centre)}</text></svg>`
}

/** sparkline(values) -> tiny inline trend */
export function sparkline(values, { w = 96, h = 28 } = {}) {
  const max = Math.max(...values, 1), min = Math.min(...values, 0), span = max - min || 1
  const pts = values.map((v, i) => `${((i / Math.max(1, values.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`).join(' ')
  return `<svg class="admin-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
}
