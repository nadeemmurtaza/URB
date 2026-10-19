export const slugify = (s) => String(s ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
/** Short, sortable-ish unique id: uid('ord') -> ord_lq3k9x2a */
export const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
export const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) } }
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))
export const sum = (arr, f = (x) => x) => arr.reduce((t, x) => t + f(x), 0)
export const groupBy = (arr, f) => arr.reduce((m, x) => { (m[f(x)] ||= []).push(x); return m }, {})
