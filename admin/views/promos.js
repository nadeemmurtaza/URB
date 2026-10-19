import { C, auth, dates, toast, confirm, log, schemas } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { createTable } from '../library/hooks/use-table.js'
import { mountDataTable } from '../library/components/patterns/data-table.js'
import { pageHeader } from '../library/components/common/page-header.js'
import { openDrawer } from '../library/components/ui/drawer.js'
import { textField, toggleField, readForm, showErrors } from '../library/components/ui/field.js'
import { validate } from '../library/utils/validate.js'
import { icon } from '../library/components/ui/icons.js'
import { num } from '../helpers.js'

const can = (p) => auth.can(p)
const state = (p) => (!p.active ? ['Off', 'neutral'] : p.expires && p.expires < dates.iso(Date.now()) ? ['Expired', 'warning'] : p.limit && p.used >= p.limit ? ['Used up', 'warning'] : ['Live', 'success'])

function openPromo(id) {
  const cur = id ? C.promos.get(id) : null, p = cur || { code: '', pct: 10, active: true, expires: '', limit: 0, used: 0 }
  const d = openDrawer({ title: cur ? `Edit ${cur.code}` : 'New promo code', body: `<form class="admin-form" id="pf" novalidate>
    ${textField('code', 'Code', p.code, { required: true, hint: 'Letters and numbers. Shoppers type this at checkout; case does not matter.' })}
    <div class="admin-form__row">${textField('pct', 'Discount (%)', p.pct, { type: 'number', min: 1, max: 90, inputmode: 'numeric' })}${textField('limit', 'Use limit', p.limit || '', { type: 'number', min: 0, optional: true, hint: 'Leave empty for unlimited' })}</div>
    ${textField('expires', 'Expires on', p.expires || '', { type: 'date', optional: true })}
    ${toggleField('active', 'Active', p.active)}</form>`, footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" form="pf" type="submit">Save</button>' })
  const f = d.el.querySelector('#pf'); f.querySelector('#code').focus()
  f.addEventListener('submit', (e) => {
    e.preventDefault(); const v = readForm(f), rec = { code: v.code.trim().toUpperCase(), pct: Math.round(num(v.pct)), limit: v.limit === '' ? 0 : Math.round(num(v.limit)), expires: v.expires, active: v.active }
    const { errors } = validate(schemas.promo, rec)
    if (C.promos.all().some((x) => x.code === rec.code && x.id !== cur?.id)) errors.code = 'That code already exists.'
    if (Object.keys(errors).length) return showErrors(f, errors)
    if (cur) C.promos.update(cur.id, rec); else C.promos.insert({ ...rec, used: 0 })
    log(cur ? 'promo edited' : 'promo created', rec.code); toast.show(`${rec.code} saved`); d.close()
  })
}

export function promos() {
  return {
    html: html`${raw(pageHeader({ title: 'Promotions', subtitle: 'Codes shoppers can enter at checkout', actions: can('promos:create') ? `<button class="btn btn-primary btn-sm" data-add>${icon('plus', 'size-4')}New code</button>` : '' }))}<div id="dt"></div>`,
    mount(el) {
      const table = createTable({ rows: C.promos.all(), searchKeys: ['code'], pageSize: 10, defaultSort: { key: 'code', dir: 'asc' } })
      const un = C.promos.subscribe((rows) => table.setRows(rows))
      mountDataTable(el.querySelector('#dt'), {
        table, searchPlaceholder: 'Search codes',
        columns: [
          { key: 'code', label: 'Code', sortable: true, render: (p) => `<b class="font-mono tracking-wide">${esc(p.code)}</b>` },
          { key: 'pct', label: 'Discount', sortable: true, render: (p) => `<span class="admin-num font-semibold">${p.pct}% off</span>` },
          { key: 'used', label: 'Used', sortable: true, render: (p) => `<span class="admin-num">${p.used || 0}${p.limit ? ` / ${p.limit}` : ''}</span>` },
          { key: 'expires', label: 'Expires', render: (p) => (p.expires ? `<span class="admin-num">${esc(p.expires)}</span>` : '<span class="text-base-content/40">Never</span>') },
          { key: 'state', label: 'Status', render: (p) => { const [l, t] = state(p); return `<span class="badge badge-${t} badge-soft">${l}</span>` } },
          { key: 'active', label: 'On', render: (p) => `<input type="checkbox" class="toggle toggle-primary toggle-sm" data-on aria-label="Active: ${esc(p.code)}" ${p.active ? 'checked' : ''} ${can('promos:edit') ? '' : 'disabled'}>` },
        ],
        onRow: can('promos:edit') ? (p) => openPromo(p.id) : undefined,
        actions: (p) => [...(can('promos:edit') ? [{ id: 'edit', label: 'Edit' }] : []), ...(can('promos:delete') ? [{ id: 'del', label: 'Delete', tone: 'error' }] : [])],
        onAction: async (a, p) => { if (a === 'edit') openPromo(p.id); if (a === 'del' && (await confirm({ title: `Delete ${p.code}?`, body: 'Shoppers can no longer use it.', action: 'Delete', tone: 'error' }))) { C.promos.remove(p.id); log('promo deleted', p.code); toast.show(`${p.code} deleted`) } },
        empty: { title: 'No promo codes', body: 'Create one to offer a discount.' },
      })
      el.addEventListener('click', (e) => { if (e.target.closest('[data-add]')) openPromo() })
      el.addEventListener('change', (e) => { const t = e.target.closest('[data-on]'); if (t) { const id = t.closest('tr').dataset.id; C.promos.update(id, { active: t.checked }); log(t.checked ? 'promo on' : 'promo off', C.promos.get(id).code) } })
      return un
    },
  }
}
