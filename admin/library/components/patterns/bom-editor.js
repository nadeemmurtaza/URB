/**
 * Recipe (bill of materials) editor with a live cost roll-up. Framework-free.
 *
 *   const ed = mountBomEditor(el, { bom, materials, money, labourRate, overheadPct, price, targetMargin, onApplyPrice })
 *   ed.value()     -> { lines: [{ materialId, qty, scrap }], labourMin, notes }
 *   ed.validate()  -> { valid, errors: string[] }   (also marks the offending rows)
 *   ed.setPrice(p) -> re-run the margin line after the product price changes
 *
 * The editor owns no storage: the caller saves value() wherever BOMs live.
 */
import { esc } from '../../utils/html.js'
import { costBom, margin, suggestPrice, marginState } from '../../utils/costing.js'
import { MARGIN_STATE } from '../../constants/materials.js'
import { icon } from '../ui/icons.js'

export function mountBomEditor(el, { bom, materials, money, labourRate = 0, overheadPct = 0, price = 0, targetMargin = 50, onApplyPrice, step = 50 }) {
  let curPrice = price
  const usable = [...materials].sort((a, b) => a.name.localeCompare(b.name))
  const opts = (sel) => `<option value="">Choose a material</option>${usable.map((m) => `<option value="${esc(m.id)}"${m.id === sel ? ' selected' : ''}>${esc(m.name)} (${esc(m.unit)})</option>`).join('')}`
  const row = (l = {}) => `<tr data-line><td data-label="Material"><select class="select select-bordered select-sm w-full min-w-40" data-f="materialId" aria-label="Material">${opts(l.materialId)}</select></td>
    <td data-label="Qty"><div class="flex items-center gap-1"><input class="input input-bordered input-sm w-20" type="number" min="0" step="any" inputmode="decimal" data-f="qty" aria-label="Quantity" value="${esc(l.qty ?? '')}"><span class="text-xs text-base-content/60 w-8" data-unit></span></div></td>
    <td data-label="Waste %"><input class="input input-bordered input-sm w-16" type="number" min="0" max="100" step="1" inputmode="numeric" data-f="scrap" aria-label="Waste percent" value="${esc(l.scrap ?? 0)}"></td>
    <td data-label="Cost" class="text-end admin-num" data-cost></td>
    <td class="text-end"><button type="button" class="btn btn-ghost btn-sm btn-square" data-rm aria-label="Remove line">${icon('x', 'size-4')}</button></td></tr>`
  el.innerHTML = `<div class="admin-bom">
    <div class="admin-dt__scroll"><table class="table admin-table admin-bom__table"><thead><tr><th>Material</th><th>Qty</th><th>Waste %</th><th class="text-end">Cost</th><th><span class="sr-only">Remove</span></th></tr></thead><tbody data-lines>${(bom?.lines?.length ? bom.lines : [{}]).map(row).join('')}</tbody></table></div>
    <p class="admin-field__error" data-err role="alert" hidden></p>
    <button type="button" class="btn btn-ghost btn-sm w-fit" data-add>${icon('plus', 'size-4')}Add material</button>
    <div class="admin-form__row">
      <div class="admin-field"><label class="admin-field__label" for="bom-labour">Making time (minutes)</label><input class="input input-bordered w-full" id="bom-labour" type="number" min="0" max="6000" step="5" inputmode="numeric" value="${esc(bom?.labourMin ?? 0)}"><p class="admin-field__hint" data-hours></p></div>
      <div class="admin-field"><label class="admin-field__label" for="bom-notes">Notes <span class="text-base-content/50 font-normal">optional</span></label><textarea class="textarea textarea-bordered w-full" id="bom-notes" rows="2" maxlength="600" placeholder="Hook size, stitch counts, wrapping style">${esc(bom?.notes || '')}</textarea></div>
    </div>
    <section class="admin-rollup" aria-live="polite" data-roll></section></div>`
  const $ = (s) => el.querySelector(s), body = $('[data-lines]'), mats = new Map(materials.map((m) => [m.id, m]))
  const read = () => ({ lines: [...body.querySelectorAll('[data-line]')].map((r) => ({ materialId: r.querySelector('[data-f=materialId]').value, qty: parseFloat(r.querySelector('[data-f=qty]').value) || 0, scrap: parseFloat(r.querySelector('[data-f=scrap]').value) || 0 })), labourMin: parseFloat($('#bom-labour').value) || 0, notes: $('#bom-notes').value.trim() })
  function refresh() {
    const v = read(), c = costBom({ bom: { lines: v.lines.filter((l) => l.materialId), labourMin: v.labourMin }, materials, labourRate, overheadPct })
    body.querySelectorAll('[data-line]').forEach((r, i) => { const m = mats.get(v.lines[i].materialId); r.querySelector('[data-unit]').textContent = m ? m.unit : ''; const lc = m ? (v.lines[i].qty * (1 + v.lines[i].scrap / 100) * m.cost) : 0; r.querySelector('[data-cost]').textContent = m ? money.format(lc) : '' })
    $('[data-hours]').textContent = v.labourMin ? `${(v.labourMin / 60).toFixed(1)} hours at ${money.format(labourRate)} an hour` : ''
    const mg = margin(curPrice, c.total), st = marginState(mg.pct, targetMargin), sug = suggestPrice(c.total, targetMargin, step)
    const cell = (l, v, cls = '') => `<div class="admin-rollup__cell ${cls}"><dt>${l}</dt><dd>${esc(v)}</dd></div>`
    $('[data-roll]').innerHTML = `<dl class="admin-rollup__grid">${cell('Materials', money.format(c.materials))}${cell('Labour', money.format(c.labour))}${cell(`Overhead ${overheadPct}%`, money.format(c.overhead))}${cell('Cost to make one', money.format(c.total), 'is-key')}${cell('Selling price', money.format(curPrice))}${cell('Profit', money.format(mg.amount) + (mg.pct == null ? '' : ` · ${mg.pct.toFixed(0)}%`), mg.amount < 0 ? 'is-bad' : '')}</dl>
      <p class="flex flex-wrap items-center gap-2 text-sm"><span class="badge badge-${MARGIN_STATE[st].tone} badge-soft">${esc(MARGIN_STATE[st].label)} margin</span>${c.total ? `<span class="text-base-content/70">A ${targetMargin}% margin needs <b>${esc(money.format(sug))}</b>.</span>${onApplyPrice && sug !== curPrice ? `<button type="button" class="btn btn-xs btn-outline" data-apply="${sug}">Use ${esc(money.format(sug))}</button>` : ''}` : ''}</p>`
  }
  // 'input' also fires for selects. Do not refresh on 'change' as well: it fires on blur, and rebuilding the roll-up then
  // replaces a button the user is in the middle of clicking.
  el.addEventListener('input', refresh)
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-add]')) { body.insertAdjacentHTML('beforeend', row()); refresh(); body.lastElementChild.querySelector('select').focus() }
    const rm = e.target.closest('[data-rm]'); if (rm) { if (body.children.length > 1) rm.closest('tr').remove(); else { body.innerHTML = row() } refresh() }
    const ap = e.target.closest('[data-apply]'); if (ap && onApplyPrice) { curPrice = +ap.dataset.apply; onApplyPrice(curPrice); refresh() }
  })
  refresh()
  return {
    value: read,
    setPrice(p) { curPrice = p; refresh() },
    validate() {
      const v = read(), errors = [], seen = new Set()
      body.querySelectorAll('[data-line]').forEach((r, i) => {
        const l = v.lines[i], bad = []
        if (!l.materialId) bad.push('Choose a material on every line, or remove the empty line.')
        else if (seen.has(l.materialId)) bad.push(`${mats.get(l.materialId)?.name} appears twice. Combine the quantities.`)
        else seen.add(l.materialId)
        if (l.materialId && !(l.qty > 0)) bad.push(`Enter a quantity for ${mats.get(l.materialId)?.name}.`)
        if (l.scrap < 0 || l.scrap > 100) bad.push('Waste must be between 0 and 100.')
        r.classList.toggle('is-bad', bad.length > 0); errors.push(...bad)
      })
      if (v.labourMin < 0 || v.labourMin > 6000) errors.push('Making time must be between 0 and 6000 minutes.')
      const e = $('[data-err]'); e.textContent = errors[0] || ''; e.hidden = !errors.length
      return { valid: !errors.length, errors: [...new Set(errors)] }
    },
  }
}
