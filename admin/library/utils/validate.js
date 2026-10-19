/**
 * Minimal JSON-Schema validator (subset): type, required, properties, enum, minimum, maximum, minLength, maxLength, pattern, items.
 * validate(schema, data, messages?) -> { valid, errors: { [field]: message } }. `messages` lets a surface localise copy.
 */
const DEFAULT = {
  required: 'This field is required.', type: 'Wrong type of value.', enum: 'Choose one of the listed options.',
  minimum: (n) => `Must be at least ${n}.`, maximum: (n) => `Must be at most ${n}.`,
  minLength: (n) => `Use at least ${n} characters.`, maxLength: (n) => `Use at most ${n} characters.`, pattern: 'This does not look right.',
}
const msg = (m, k, arg) => { const v = m[k]; return typeof v === 'function' ? v(arg) : v }
export function validate(schema, data, messages = {}) {
  const m = { ...DEFAULT, ...messages }, errors = {}
  const check = (s, v, path) => {
    const empty = v === undefined || v === null || v === ''
    if (empty) return
    const t = s.type
    if (t === 'number' || t === 'integer') { if (typeof v !== 'number' || Number.isNaN(v) || (t === 'integer' && !Number.isInteger(v))) return void (errors[path] ||= msg(m, 'type')) }
    else if (t === 'string' && typeof v !== 'string') return void (errors[path] ||= msg(m, 'type'))
    else if (t === 'boolean' && typeof v !== 'boolean') return void (errors[path] ||= msg(m, 'type'))
    else if (t === 'array' && !Array.isArray(v)) return void (errors[path] ||= msg(m, 'type'))
    if (s.enum && !s.enum.includes(v)) errors[path] ||= msg(m, 'enum')
    if (typeof v === 'number') { if (s.minimum != null && v < s.minimum) errors[path] ||= msg(m, 'minimum', s.minimum); if (s.maximum != null && v > s.maximum) errors[path] ||= msg(m, 'maximum', s.maximum) }
    if (typeof v === 'string') { if (s.minLength != null && v.trim().length < s.minLength) errors[path] ||= msg(m, 'minLength', s.minLength); if (s.maxLength != null && v.length > s.maxLength) errors[path] ||= msg(m, 'maxLength', s.maxLength); if (s.pattern && !new RegExp(s.pattern).test(v)) errors[path] ||= msg(m, 'pattern') }
    if (Array.isArray(v) && s.items) v.forEach((x, i) => check(s.items, x, `${path}.${i}`))
  }
  for (const r of schema.required || []) { const v = data?.[r]; if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) errors[r] = msg(m, 'required') }
  for (const [k, s] of Object.entries(schema.properties || {})) check(s, data?.[k], k)
  return { valid: !Object.keys(errors).length, errors }
}
