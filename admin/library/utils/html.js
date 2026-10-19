/** Tiny HTML helpers for framework-free views. `html` escapes every interpolation unless it is wrapped in `raw()`. */
const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => MAP[c])

class Raw { constructor(v) { this.v = v } toString() { return this.v } }
/** Mark a string as already-safe HTML. */
export const raw = (v) => new Raw(v)

/** Tagged template: html`<p>${userText}</p>` escapes userText; arrays are joined; raw() passes through. */
export function html(strings, ...values) {
  let out = ''
  strings.forEach((s, i) => {
    out += s
    if (i < values.length) {
      const v = values[i]
      out += Array.isArray(v) ? v.map((x) => (x instanceof Raw ? x.v : esc(x))).join('') : v instanceof Raw ? v.v : esc(v)
    }
  })
  return new Raw(out)
}

/** Set an element's content from html`` output (or a plain string, which is escaped). */
export const mount = (el, content) => { el.innerHTML = content instanceof Raw ? content.v : esc(content) }
