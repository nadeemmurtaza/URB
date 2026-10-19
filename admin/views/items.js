import { C, auth, toast, confirm, log } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { createTable } from '../library/hooks/use-table.js'
import { mountDataTable } from '../library/components/patterns/data-table.js'
import { pageHeader } from '../library/components/common/page-header.js'
import { openDrawer } from '../library/components/ui/drawer.js'
import { textField, textArea, selectField, toggleField, readForm, showErrors } from '../library/components/ui/field.js'
import { imageToDataUrl } from '../library/components/common/image-upload.js'
import { slugify } from '../library/utils/slug.js'
import { icon } from '../library/components/ui/icons.js'
import { imgSrc } from '../helpers.js'

const COLL = [['stems', 'Single stems'], ['plushies', 'Plushies'], ['wear', 'Wear'], ['little', 'Little things']]
const can = (p) => auth.can(p)

export function openItem(id) {
  const cur = id ? C.items.get(id) : null
  const it = cur || { collection: 'stems', name: '', note: '', facts: [], colors: [], img: '', soft: true, active: true }
  let img = it.img
  const d = openDrawer({ title: cur ? `Edit ${cur.name}` : 'Add made-to-order piece', size: 'lg', body: `<form class="admin-form" id="itf" novalidate>
    <div class="admin-upload"><img class="admin-upload__img" id="pv" src="${esc(imgSrc(img))}" alt="Picture preview"><div class="grid gap-2"><label class="btn btn-outline btn-sm w-fit" for="it-img">${icon('upload', 'size-4')}${img ? 'Replace picture' : 'Upload picture'}</label><input class="sr-only" type="file" accept="image/*" id="it-img"><p class="admin-field__error" id="img-error" role="alert" hidden></p></div></div>
    ${toggleField('soft', 'Photo has a background', it.soft, { hint: 'Fades the edges into the page. Turn off for a cut-out PNG.' })}
    <div class="admin-form__row">${textField('name', 'Name', it.name, { required: true })}${selectField('collection', 'Collection', COLL, it.collection)}</div>
    ${textArea('note', 'Description', it.note, { rows: 3, maxlength: 300 })}
    ${textArea('facts', 'Key facts', (it.facts || []).join('\n'), { rows: 3, hint: 'One per line, like “4 ply yarn” or “2 hour making time”. The first one shows on the card.' })}
    ${textField('colors', 'Available colours', (it.colors || []).join(', '), { optional: true, hint: 'Separate with commas' })}
    ${toggleField('active', 'Visible on the storefront', it.active !== false)}</form>`,
  footer: '<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" form="itf" type="submit">Save</button>' })
  const form = d.el.querySelector('#itf')
  d.el.querySelector('#it-img').addEventListener('change', async (e) => { const er = d.el.querySelector('#img-error'); er.hidden = true; try { img = await imageToDataUrl(e.target.files[0]); d.el.querySelector('#pv').src = img } catch (x) { er.textContent = x.message; er.hidden = false } })
  form.addEventListener('submit', (e) => {
    e.preventDefault(); const v = readForm(form), errors = {}
    if (v.name.trim().length < 2) errors.name = 'Give it a name.'
    if (v.note.length > 300) errors.note = 'Keep it under 300 characters.'
    const ie = d.el.querySelector('#img-error'); ie.hidden = !!img; if (!img) ie.textContent = 'Add a picture so shoppers can see it.'
    if (Object.keys(errors).length || !img) return showErrors(form, errors)
    const rec = { collection: v.collection, name: v.name.trim(), note: v.note.trim(), facts: v.facts.split('\n').map((s) => s.trim()).filter(Boolean), colors: v.colors.split(',').map((s) => s.trim()).filter(Boolean), img, soft: v.soft, active: v.active }
    if (cur) { C.items.update(cur.id, rec); log('piece edited', rec.name) } else { let nid = `${rec.collection}-${slugify(rec.name) || 'piece'}`, n = 2; while (C.items.get(nid)) nid = `${nid.replace(/-\d+$/, '')}-${n++}`; C.items.insert({ id: nid, ...rec }); log('piece added', rec.name) }
    toast.show(`${rec.name} saved`); d.close()
  })
  form.querySelector('[name=name]').focus()
}

export function items({ params = {} } = {}) {
  return {
    html: html`${raw(pageHeader({ title: 'Made to order', subtitle: 'Stems, plushies, wear and little things. Shoppers enquire; you quote.', actions: can('items:create') ? `<button class="btn btn-primary btn-sm" data-add>${icon('plus', 'size-4')}Add piece</button>` : '' }))}<div id="dt"></div>`,
    mount(el) {
      const table = createTable({ rows: C.items.all(), searchKeys: ['name', 'note', 'collection'], pageSize: 10, defaultSort: { key: 'collection', dir: 'asc' }, sorters: { name: (r) => r.name.toLowerCase() }, filters: { collection: (r, v) => r.collection === v } })
      const un = C.items.subscribe((rows) => table.setRows(rows))
      mountDataTable(el.querySelector('#dt'), {
        initial: params,
        table, searchPlaceholder: 'Search pieces',
        filters: [{ key: 'collection', label: 'Collection', options: [['', 'All collections'], ...COLL] }],
        columns: [
          { key: 'name', label: 'Piece', sortable: true, render: (r) => `<div class="admin-cell"><img class="admin-thumb" src="${esc(imgSrc(r.img))}" alt="" loading="lazy"><div><b>${esc(r.name)}</b><small>${esc((r.facts || [])[0] || '')}</small></div></div>` },
          { key: 'collection', label: 'Collection', sortable: true, render: (r) => `<span class="badge badge-ghost">${esc(COLL.find((c) => c[0] === r.collection)?.[1] || r.collection)}</span>` },
          { key: 'active', label: 'On storefront', render: (r) => `<input type="checkbox" class="toggle toggle-primary toggle-sm" data-vis aria-label="Visible: ${esc(r.name)}" ${r.active !== false ? 'checked' : ''} ${can('items:edit') ? '' : 'disabled'}>` },
        ],
        onRow: can('items:edit') ? (r) => openItem(r.id) : undefined,
        actions: (r) => [...(can('items:edit') ? [{ id: 'edit', label: 'Edit' }] : []), { id: 'view', label: 'View on storefront' }, ...(can('items:delete') ? [{ id: 'del', label: 'Delete', tone: 'error' }] : [])],
        onAction: async (a, r) => { if (a === 'edit') openItem(r.id); if (a === 'view') window.open(`../collection.html?c=${encodeURIComponent(r.collection)}`, '_blank', 'noopener'); if (a === 'del' && (await confirm({ title: `Delete ${r.name}?`, body: 'It disappears from the storefront.', action: 'Delete', tone: 'error' }))) { C.items.remove(r.id); log('piece deleted', r.name); toast.show(`${r.name} deleted`) } },
        empty: { title: 'No pieces yet', body: 'Add one to show it in its collection on the storefront.' },
      })
      el.addEventListener('click', (e) => { if (e.target.closest('[data-add]')) openItem() })
      el.addEventListener('change', (e) => { const t = e.target.closest('[data-vis]'); if (t) { C.items.update(t.closest('tr').dataset.id, { active: t.checked }); log(t.checked ? 'piece shown' : 'piece hidden', t.closest('tr').dataset.id) } })
      return un
    },
  }
}
