/**
 * Table state without a framework: search, filters, sort and pagination over an array of rows.
 *   const t = createTable({ rows, searchKeys: ['name'], pageSize: 10, sorters: { price: (r) => r.price } })
 *   t.setSearch('rose'); t.setFilter('status', 'new'); t.sortBy('price'); t.setPage(2)
 *   t.view() -> { rows, total, page, pages, from, to, sort, search, filters }
 * Call t.setRows(next) when the underlying data changes; t.subscribe(fn) fires after every change.
 */
export function createTable({ rows = [], searchKeys = [], pageSize = 10, sorters = {}, filters = {}, defaultSort = null } = {}) {
  let data = rows, search = '', page = 1, size = pageSize, sort = defaultSort
  const active = {}
  const subs = new Set()
  const emit = () => subs.forEach((f) => f(view()))
  const get = (r, k) => k.split('.').reduce((o, p) => o?.[p], r)
  function view() {
    const q = search.trim().toLowerCase()
    let out = data.filter((r) => (!q || searchKeys.some((k) => String(get(r, k) ?? '').toLowerCase().includes(q))) &&
      Object.entries(active).every(([k, v]) => v === '' || v == null || (filters[k] ? filters[k](r, v) : get(r, k) === v)))
    if (sort) {
      const f = sorters[sort.key] || ((r) => get(r, sort.key)), dir = sort.dir === 'desc' ? -1 : 1
      out = [...out].sort((a, b) => { const x = f(a), y = f(b); return (x > y ? 1 : x < y ? -1 : 0) * dir })
    }
    const total = out.length, pages = Math.max(1, Math.ceil(total / size)), p = Math.min(page, pages)
    return { rows: out.slice((p - 1) * size, p * size), all: out, total, page: p, pages, pageSize: size, from: total ? (p - 1) * size + 1 : 0, to: Math.min(total, p * size), sort, search, filters: { ...active } }
  }
  return {
    view,
    subscribe: (f) => { subs.add(f); return () => subs.delete(f) },
    setRows(next) { data = next; emit() },
    setSearch(q) { search = q; page = 1; emit() },
    setFilter(k, v) { active[k] = v; page = 1; emit() },
    clearFilters() { search = ''; for (const k in active) delete active[k]; page = 1; emit() },
    sortBy(key) { sort = sort && sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }; emit() },
    setPage(p) { page = Math.max(1, p); emit() },
    setPageSize(n) { size = n; page = 1; emit() },
  }
}
