/**
 * Data table with search, filters, sort, pagination, row selection and row actions.
 * Pure rendering + event wiring on top of hooks/use-table.js and hooks/use-selection.js.
 *
 *   const dt = mountDataTable(el, {
 *     table,                                  // createTable(...)
 *     columns: [{ key, label, sortable, render(row) -> html, class }],
 *     rowId: (r) => r.id,
 *     filters: [{ key, label, options: [[value, label]] }],
 *     selection,                              // optional createSelection()
 *     bulk: [{ id, label, tone }],            // buttons shown while rows are selected
 *     onRow(row), onAction(actionId, row), onBulk(actionId, ids),
 *     actions: (row) => [{ id, label }],      // per-row menu items
 *     initial: { status: 'new' }              // filter values to apply on first render (e.g. from the URL)
 *     searchPlaceholder, empty: { title, body }, toolbar: htmlString
 *   })
 */
import { esc } from '../../utils/html.js'
import { icon } from '../ui/icons.js'
import { emptyState } from '../common/page-header.js'
import { PAGE_SIZES } from '../../constants/statuses.js'

export function mountDataTable(el, o) {
  const { table, columns, rowId = (r) => r.id, filters = [], selection, bulk = [], actions, searchPlaceholder = 'Search', empty = { title: 'Nothing here yet' } } = o
  el.classList.add('admin-dt')
  el.innerHTML = `
    <div class="admin-dt__bar">
      <label class="admin-search"><span class="sr-only">${esc(searchPlaceholder)}</span>${icon('search', 'size-4')}<input type="search" data-q placeholder="${esc(searchPlaceholder)}" autocomplete="off"></label>
      ${filters.map((f) => `<label class="admin-filter"><span class="sr-only">${esc(f.label)}</span><select class="select select-bordered select-sm" data-f="${esc(f.key)}">${f.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>`).join('')}
      <span class="admin-dt__spacer"></span>${o.toolbar || ''}
    </div>
    <div class="admin-dt__bulk" data-bulk hidden><strong data-bulkcount></strong>${bulk.map((b) => `<button class="btn btn-sm btn-${b.tone || 'ghost'}" data-bulk-id="${esc(b.id)}">${esc(b.label)}</button>`).join('')}<button class="btn btn-sm btn-ghost" data-bulk-clear>Clear</button></div>
    <div class="admin-dt__scroll"><table class="table admin-table"><thead></thead><tbody></tbody></table></div>
    <div class="admin-dt__empty" data-empty hidden></div>
    <footer class="admin-dt__foot"><span data-range></span><div class="admin-dt__pager"><select class="select select-bordered select-xs" data-size aria-label="Rows per page">${PAGE_SIZES.map((n) => `<option value="${n}"${n === table.view().pageSize ? ' selected' : ''}>${n} / page</option>`).join('')}</select><button class="btn btn-sm btn-ghost" data-prev aria-label="Previous page">${icon('chevron', 'size-4 rotate-180')}</button><span data-page class="text-sm"></span><button class="btn btn-sm btn-ghost" data-next aria-label="Next page">${icon('chevron', 'size-4')}</button></div></footer>`
  const $ = (s) => el.querySelector(s)
  const head = $('thead'), body = $('tbody')
  let rowsById = new Map()

  function render() {
    const v = table.view()
    rowsById = new Map(v.rows.map((r) => [String(rowId(r)), r]))
    const allSel = selection && v.rows.length && v.rows.every((r) => selection.has(rowId(r)))
    head.innerHTML = `<tr>${selection ? `<th class="w-10"><input type="checkbox" class="checkbox checkbox-sm" data-all aria-label="Select all rows" ${allSel ? 'checked' : ''}></th>` : ''}${columns.map((c) => `<th class="${esc(c.class || '')}">${c.sortable ? `<button class="admin-sort${v.sort?.key === c.key ? ' is-on' : ''}" data-sort="${esc(c.key)}" aria-label="Sort by ${esc(c.label)}">${esc(c.label)}${v.sort?.key === c.key ? icon(v.sort.dir === 'asc' ? 'arrowUp' : 'arrowDown', 'size-3.5') : ''}</button>` : esc(c.label)}</th>`).join('')}${actions ? '<th class="w-12"><span class="sr-only">Actions</span></th>' : ''}</tr>`
    body.innerHTML = v.rows.map((r) => `<tr data-id="${esc(rowId(r))}"${o.onRow ? ' class="is-clickable" tabindex="0"' : ''}>${selection ? `<td><input type="checkbox" class="checkbox checkbox-sm" data-sel aria-label="Select row" ${selection.has(rowId(r)) ? 'checked' : ''}></td>` : ''}${columns.map((c) => `<td class="${esc(c.class || '')}" data-label="${esc(c.label)}">${c.render ? c.render(r) : esc(r[c.key] ?? '')}</td>`).join('')}${actions ? `<td class="text-end"><div class="dropdown dropdown-end"><button tabindex="0" class="btn btn-ghost btn-sm btn-square" aria-label="Row actions" data-menu>${icon('menu', 'size-4')}</button><ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-20 w-44 p-2 shadow-lg border border-base-300">${actions(r).map((a) => `<li><button data-act="${esc(a.id)}" class="${a.tone ? 'text-' + a.tone : ''}">${esc(a.label)}</button></li>`).join('')}</ul></div></td>` : ''}</tr>`).join('')
    const none = !v.total
    $('[data-empty]').hidden = !none; $('.admin-dt__scroll').hidden = none; $('.admin-dt__foot').hidden = none
    if (none) { const f = v.search || Object.values(v.filters).some(Boolean); $('[data-empty]').innerHTML = emptyState(f ? { title: 'No matches', body: 'Try a different search or clear the filters.', action: '<button class="btn btn-sm btn-primary" data-clear>Clear filters</button>' } : empty) }
    $('[data-range]').textContent = `${v.from}–${v.to} of ${v.total}`
    $('[data-page]').textContent = `${v.page} / ${v.pages}`
    $('[data-prev]').disabled = v.page <= 1; $('[data-next]').disabled = v.page >= v.pages
    bulkState()
  }
  function bulkState() { if (!selection) return; const n = selection.count(); $('[data-bulk]').hidden = !n; $('[data-bulkcount]').textContent = `${n} selected` }

  $('[data-q]').addEventListener('input', (e) => table.setSearch(e.target.value))
  el.querySelectorAll('[data-f]').forEach((s) => s.addEventListener('change', () => table.setFilter(s.dataset.f, s.value)))
  $('[data-size]').addEventListener('change', (e) => table.setPageSize(+e.target.value))
  $('[data-prev]').addEventListener('click', () => table.setPage(table.view().page - 1))
  $('[data-next]').addEventListener('click', () => table.setPage(table.view().page + 1))
  el.addEventListener('click', (e) => {
    const t = e.target
    if (t.closest('[data-clear]')) { table.clearFilters(); $('[data-q]').value = ''; el.querySelectorAll('[data-f]').forEach((s) => (s.value = '')); return }
    const s = t.closest('[data-sort]'); if (s) return table.sortBy(s.dataset.sort)
    if (t.closest('[data-all]')) return selection.toggleAll(table.view().rows.map(rowId))
    if (t.closest('[data-bulk-clear]')) return selection.clear()
    const b = t.closest('[data-bulk-id]'); if (b) return o.onBulk && o.onBulk(b.dataset.bulkId, selection.ids())
    const tr = t.closest('tr[data-id]'); if (!tr) return
    const row = rowsById.get(tr.dataset.id)
    if (t.closest('[data-sel]')) return selection.toggle(rowId(row))
    const a = t.closest('[data-act]'); if (a) { document.activeElement?.blur(); return o.onAction && o.onAction(a.dataset.act, row) }
    if (t.closest('[data-menu],.dropdown,button,a,input,select,label')) return
    o.onRow && o.onRow(row)
  })
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('tr.is-clickable')) o.onRow(rowsById.get(e.target.dataset.id)) })
  for (const f of filters) { const v = o.initial?.[f.key]; if (v) { table.setFilter(f.key, v); const sel = el.querySelector(`[data-f="${f.key}"]`); if (sel) sel.value = v } }
  table.subscribe(render); selection && selection.subscribe(render); render()
  return { render, el }
}
