import { C, auth, money, toast, confirm, log, schemas, adjustStock } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { createTable } from '../library/hooks/use-table.js'
import { createSelection } from '../library/hooks/use-selection.js'
import { mountDataTable } from '../library/components/patterns/data-table.js'
import { pageHeader } from '../library/components/common/page-header.js'
import { openDrawer } from '../library/components/ui/drawer.js'
import { textField, textArea, toggleField, readForm, showErrors } from '../library/components/ui/field.js'
import { imageToDataUrl } from '../library/components/common/image-upload.js'
import { validate } from '../library/utils/validate.js'
import { slugify } from '../library/utils/slug.js'
import { icon } from '../library/components/ui/icons.js'
import { imgSrc, stockBadge, num, isLow } from '../helpers.js'

const TAGS = [['roses', 'Roses'], ['lilies', 'Lilies'], ['sunflowers', 'Sunflowers'], ['pastel', 'Soft'], ['bold', 'Bold']]
const OCC = [['love', 'Love'], ['anniversary', 'Anniversary'], ['birthday', 'Birthday'], ['gratitude', 'Thank you'], ['getwell', 'Get well'], ['justbecause', 'Just because']]
const can = (p) => auth.can(p)
const chips = (name, list, on) => `<fieldset class="admin-field"><legend class="admin-field__label">${name === 'tags' ? 'Type' : 'Occasions'}</legend><div class="flex flex-wrap gap-2">${list.map(([v, l]) => `<label class="btn btn-sm ${on.includes(v) ? 'btn-primary' : 'btn-outline'} has-[:focus-visible]:outline-2" ><input type="checkbox" class="sr-only" name="${name}" value="${v}" ${on.includes(v) ? 'checked' : ''}>${l}</label>`).join('')}</div></fieldset>`

export function uniqueId(name, existing) { const base = slugify(name) || 'bouquet'; let id = base, n = 2; while (existing.some((p) => p.id === id)) id = `${base}-${n++}`; return id }

export function openProduct(id) {
  const cur = id ? C.products.get(id) : null
  const p = cur || { name: '', price: '', was: '', stock: 1, fee: 360, line: '', inside: [], tags: [], occ: [], img: '', soft: true, active: true }
  let img = p.img, photo = p.photo || p.img
  const d = openDrawer({ title: cur ? `Edit ${cur.name}` : 'Add bouquet', size: 'lg', body: `<form class="admin-form" id="pf" novalidate>
    <div class="admin-upload"><img class="admin-upload__img" id="pv" src="${esc(imgSrc(img))}" alt="Product picture preview"><div class="grid gap-2"><label class="btn btn-outline btn-sm w-fit" for="pf-img">${icon('upload', 'size-4')}${img ? 'Replace picture' : 'Upload picture'}</label><input class="sr-only" type="file" accept="image/*" id="pf-img"><p class="admin-field__hint">A clear photo on a plain background works best. It is resized to fit.</p><p class="admin-field__error" id="img-error" role="alert" hidden></p></div></div>
    ${toggleField('soft', 'Photo has a background', p.soft, { hint: 'Fades the edges into the page. Turn off for a cut-out PNG.' })}
    ${textField('name', 'Name', p.name, { required: true })}
    <div class="admin-form__row">${textField('price', 'Price (Rs)', p.price, { type: 'number', min: 0, step: 1, inputmode: 'numeric' })}${textField('was', 'Original price (Rs)', p.was || '', { type: 'number', min: 0, step: 1, optional: true, hint: 'Shows a strike-through and a discount tag' })}</div>
    <div class="admin-form__row">${textField('stock', 'In stock', p.stock, { type: 'number', min: 0, step: 1, inputmode: 'numeric' })}${textField('fee', 'Delivery fee (Rs)', p.fee, { type: 'number', min: 0, step: 10, inputmode: 'numeric' })}</div>
    ${textArea('line', 'Short description', p.line || '', { maxlength: 240, rows: 2 })}
    ${textArea('inside', 'What is inside', (p.inside || []).join('\n'), { rows: 4, hint: 'One item per line, like “3 lilies”.' })}
    ${chips('tags', TAGS, p.tags || [])}${chips('occ', OCC, p.occ || [])}
    ${toggleField('active', 'Visible on the storefront', p.active !== false)}
  </form>`, footer: `${cur ? '<span class="me-auto text-xs text-base-content/60">Edits go live on the storefront immediately.</span>' : ''}<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" form="pf" type="submit">${cur ? 'Save changes' : 'Add bouquet'}</button>` })
  const form = d.el.querySelector('#pf')
  d.el.querySelector('#pf-img').addEventListener('change', async (e) => {
    const err = d.el.querySelector('#img-error'); err.hidden = true
    try { const url = await imageToDataUrl(e.target.files[0]); img = url; photo = url; d.el.querySelector('#pv').src = url; form.querySelector('[name=soft]').checked = true } catch (x) { err.textContent = x.message; err.hidden = false }
  })
  form.addEventListener('submit', (e) => {
    e.preventDefault(); const v = readForm(form)
    const data = { name: v.name.trim(), price: v.price === '' ? undefined : Math.round(num(v.price)), was: v.was === '' ? 0 : Math.round(num(v.was)), stock: Math.max(0, Math.round(num(v.stock))), fee: Math.round(num(v.fee)), line: v.line.trim(), inside: v.inside.split('\n').map((s) => s.trim()).filter(Boolean), img }
    const { errors } = validate(schemas.product, data)
    if (data.was && data.price != null && data.was <= data.price) errors.was = 'Original price should be higher than the price.'
    if (!img) { const ie = d.el.querySelector('#img-error'); ie.textContent = 'Add a picture so shoppers can see it.'; ie.hidden = false } else d.el.querySelector('#img-error').hidden = true
    if (Object.keys(errors).length || !img) { showErrors(form, errors); if (!img && !Object.keys(errors).length) d.el.querySelector('label[for=pf-img]').focus(); return }
    const checked = (n) => [...form.querySelectorAll(`[name=${n}]:checked`)].map((i) => i.value)
    const tags = [...checked('tags'), ...(data.price < 10000 ? ['under10'] : [])]
    const rec = { ...data, tags, occ: checked('occ'), soft: v.soft, active: v.active, photo }
    if (cur) { const delta = rec.stock - (cur.stock || 0); C.products.update(cur.id, { ...rec, stock: cur.stock }); if (delta) adjustStock(cur.id, delta, 'Edited in product form'); log('bouquet edited', rec.name); toast.show(`${rec.name} saved`) }
    else { const nid = uniqueId(rec.name, C.products.all()); C.products.insert({ id: nid, ...rec, custom: true }); C.stockmoves.insert({ at: Date.now(), productId: nid, name: rec.name, delta: rec.stock, reason: 'New bouquet', by: auth.session().email }); log('bouquet added', rec.name); toast.show(`${rec.name} added`) }
    d.close()
  })
  form.addEventListener('change', (e) => { if (e.target.type === 'checkbox' && e.target.closest('label.btn')) { const l = e.target.closest('label'); l.classList.toggle('btn-primary', e.target.checked); l.classList.toggle('btn-outline', !e.target.checked) } })
  form.querySelector('[name=name]').focus()
}

export function products({ params }) {
  return {
    html: html`${raw(pageHeader({ title: 'Bouquets', subtitle: 'Prices, stock and visibility on the storefront', actions: can('products:create') ? `<button class="btn btn-primary btn-sm" data-add>${icon('plus', 'size-4')}Add bouquet</button>` : '' }))}<div id="dt"></div>`,
    mount(el) {
      const table = createTable({ rows: C.products.all(), searchKeys: ['name', 'id', 'line'], pageSize: 10, defaultSort: { key: 'name', dir: 'asc' }, sorters: { name: (r) => r.name.toLowerCase(), price: (r) => r.price, stock: (r) => r.stock }, filters: { vis: (r, v) => (v === 'on' ? r.active !== false : r.active === false), stockf: (r, v) => (v === 'low' ? isLow(r) && r.stock > 0 : v === 'out' ? r.stock <= 0 : true) } })
      const selection = createSelection(), un = C.products.subscribe((rows) => table.setRows(rows))
      mountDataTable(el.querySelector('#dt'), {
        initial: params,
        table, selection, searchPlaceholder: 'Search bouquets',
        filters: [{ key: 'vis', label: 'Visibility', options: [['', 'All'], ['on', 'Visible'], ['off', 'Hidden']] }, { key: 'stockf', label: 'Stock', options: [['', 'Any stock'], ['low', 'Low stock'], ['out', 'Out of stock']] }],
        columns: [
          { key: 'name', label: 'Bouquet', sortable: true, render: (p) => `<div class="admin-cell"><img class="admin-thumb" src="${esc(imgSrc(p.img))}" alt="" loading="lazy"><div><b>${esc(p.name)}</b><small>${esc(p.tags.filter((t) => t !== 'under10').join(', ') || 'no type')}</small></div></div>` },
          { key: 'price', label: 'Price', sortable: true, class: 'text-end', render: (p) => `<span class="admin-num font-semibold">${esc(money.format(p.price))}</span>${p.was ? `<br><s class="admin-num text-xs text-base-content/50">${esc(money.format(p.was))}</s>` : ''}` },
          { key: 'stock', label: 'Stock', sortable: true, render: (p) => stockBadge(p.stock) },
          { key: 'fee', label: 'Delivery', class: 'text-end', render: (p) => `<span class="admin-num">${esc(money.format(p.fee))}</span>` },
          { key: 'active', label: 'On storefront', render: (p) => `<input type="checkbox" class="toggle toggle-primary toggle-sm" data-vis aria-label="Visible: ${esc(p.name)}" ${p.active !== false ? 'checked' : ''} ${can('products:edit') ? '' : 'disabled'}>` },
        ],
        onRow: can('products:edit') ? (p) => openProduct(p.id) : undefined,
        actions: (p) => [...(can('products:edit') ? [{ id: 'edit', label: 'Edit' }] : []), ...(can('products:create') ? [{ id: 'dup', label: 'Duplicate' }] : []), { id: 'view', label: 'View on storefront' }, ...(can('products:delete') ? [{ id: 'del', label: 'Delete', tone: 'error' }] : [])],
        onAction: async (a, p) => {
          if (a === 'edit') openProduct(p.id)
          if (a === 'view') window.open(`../product.html?id=${encodeURIComponent(p.id)}`, '_blank', 'noopener')
          if (a === 'dup') { const nid = uniqueId(`${p.name} copy`, C.products.all()); C.products.insert({ ...p, id: nid, name: `${p.name} (copy)`, stock: 0, active: false, custom: true }); log('bouquet duplicated', p.name); toast.show('Duplicated as a hidden draft with no stock') }
          if (a === 'del' && (await confirm({ title: `Delete ${p.name}?`, body: 'It disappears from the storefront. Past orders keep their details.', action: 'Delete', tone: 'error' }))) { C.products.remove(p.id); log('bouquet deleted', p.name); toast.show(`${p.name} deleted`) }
        },
        bulk: [...(can('products:edit') ? [{ id: 'on', label: 'Show', tone: 'primary' }, { id: 'off', label: 'Hide' }] : []), ...(can('products:delete') ? [{ id: 'del', label: 'Delete', tone: 'error' }] : [])],
        onBulk: async (id, ids) => {
          if (id === 'del') { if (!(await confirm({ title: `Delete ${ids.length} bouquets?`, body: 'This cannot be undone.', action: 'Delete', tone: 'error' }))) return; ids.forEach((i) => C.products.remove(i)); log('bulk delete', `${ids.length} bouquets`); toast.show(`${ids.length} deleted`) }
          else { ids.forEach((i) => C.products.update(i, { active: id === 'on' })); log(id === 'on' ? 'bulk show' : 'bulk hide', `${ids.length} bouquets`); toast.show(`${ids.length} ${id === 'on' ? 'now visible' : 'hidden'}`) }
          selection.clear()
        },
        empty: { title: 'No bouquets yet', body: 'Add your first one to put it on the storefront.' },
      })
      el.addEventListener('click', (e) => { if (e.target.closest('[data-add]')) openProduct() })
      el.addEventListener('change', (e) => { const t = e.target.closest('[data-vis]'); if (!t) return; const id = t.closest('tr').dataset.id; C.products.update(id, { active: t.checked }); log(t.checked ? 'bouquet shown' : 'bouquet hidden', C.products.get(id)?.name) })
      if (params.edit) { openProduct(params.edit); history.replaceState(null, '', '#/products') }
      return un
    },
  }
}
