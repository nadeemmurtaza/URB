/** Form fields on daisyUI. Every control gets a label, a hint slot and an error slot (aria-wired). */
import { esc } from '../../utils/html.js'
const wrap = (id, label, control, { hint = '', error = '', optional = false } = {}) => `
<div class="admin-field" data-field="${esc(id)}">
  <label class="admin-field__label" for="${esc(id)}">${esc(label)}${optional ? ' <span class="text-base-content/50 font-normal">optional</span>' : ''}</label>
  ${control}
  ${hint ? `<p class="admin-field__hint" id="${esc(id)}-hint">${esc(hint)}</p>` : ''}
  <p class="admin-field__error" id="${esc(id)}-error" role="alert" ${error ? '' : 'hidden'}>${esc(error)}</p>
</div>`
const attrs = (o) => Object.entries(o).filter(([, v]) => v !== false && v != null).map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`)).join(' ')

export const textField = (id, label, value = '', o = {}) => wrap(id, label, `<input class="input input-bordered w-full" id="${esc(id)}" name="${esc(id)}" value="${esc(value)}" ${attrs({ type: o.type || 'text', placeholder: o.placeholder, required: o.required, min: o.min, max: o.max, step: o.step, inputmode: o.inputmode, autocomplete: o.autocomplete || 'off', 'aria-describedby': o.hint ? `${id}-hint` : false })}>`, o)
export const textArea = (id, label, value = '', o = {}) => wrap(id, label, `<textarea class="textarea textarea-bordered w-full" id="${esc(id)}" name="${esc(id)}" rows="${o.rows || 3}" ${attrs({ placeholder: o.placeholder, maxlength: o.maxlength })}>${esc(value)}</textarea>`, o)
export const selectField = (id, label, options, value = '', o = {}) => wrap(id, label, `<select class="select select-bordered w-full" id="${esc(id)}" name="${esc(id)}">${options.map((x) => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(l)}</option>` }).join('')}</select>`, o)
export const toggleField = (id, label, checked = false, o = {}) => `<label class="admin-toggle" for="${esc(id)}"><input type="checkbox" class="toggle toggle-primary" id="${esc(id)}" name="${esc(id)}" ${checked ? 'checked' : ''}><span>${esc(label)}${o.hint ? `<small class="block text-base-content/60">${esc(o.hint)}</small>` : ''}</span></label>`

/** Read a form into an object (numbers stay strings; the caller coerces by schema). */
export function readForm(form) {
  const out = {}
  for (const el of form.elements) { if (!el.name) continue; out[el.name] = el.type === 'checkbox' ? el.checked : el.value }
  return out
}
/** Show validate() errors next to their fields; returns the first invalid element (focused). */
export function showErrors(form, errors) {
  let first = null
  form.querySelectorAll('[data-field]').forEach((f) => {
    const id = f.dataset.field, e = errors[id], p = f.querySelector('.admin-field__error'), c = f.querySelector('input,select,textarea')
    if (p) { p.textContent = e || ''; p.hidden = !e }
    if (c) { c.toggleAttribute('aria-invalid', !!e); if (e) { c.setAttribute('aria-invalid', 'true'); first ||= c } else c.removeAttribute('aria-invalid') }
  })
  first?.focus(); return first
}
