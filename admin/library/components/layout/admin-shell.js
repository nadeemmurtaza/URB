/**
 * Admin shell with a two-level sidebar and breadcrumbs.
 *   rail    : one icon per section (ADMIN_SECTIONS)
 *   panel   : the pages of the open section, with saved views under the open page
 *   tabs    : level 3, a horizontal strip under the top bar with the saved views of the open page (hidden when it has none)
 *   crumbs  : Admin / Section / Page / View
 *   mobile  : both levels live in one drawer (rail as a strip on top)
 *   const shell = mountShell(root, { brand, routes, sections, auth, theme, views, search, onLogout, logoSrc })
 * A view is (ctx) => string | html`` | Promise<...> | { html, mount(el) -> cleanup? } ; ctx = { el, params, rest, navigate, route }.
 */
import { esc } from '../../utils/html.js'
import { icon } from '../ui/icons.js'

export function mountShell(root, { brand, routes, sections, auth, theme, views, search, onLogout, logoSrc, counts }) {
  const s = auth.session()
  const badges = {}
  const secs = (sections || [...new Set(routes.map((r) => r.group))].map((id) => ({ id, icon: routes.find((r) => r.group === id).icon })))
  const allowed = (g) => routes.filter((r) => r.group === g && auth.can(r.perm))
  const visibleSecs = () => secs.filter((x) => allowed(x.id).length)
  const parse = () => { const [path, qs] = location.hash.replace(/^#\/?/, '').split('?'); const [id, ...rest] = (path || 'dashboard').split('/'); return { id: id || 'dashboard', rest, qs: qs || '', params: Object.fromEntries(new URLSearchParams(qs || '')) } }
  const badge = (id) => `<i class="admin-nav__badge" data-badge="${id}"${badges[id] ? '' : ' hidden'}>${badges[id] || ''}</i>`
  const sectionBadge = (g) => allowed(g).reduce((t, r) => t + (+badges[r.id] || 0), 0)

  const rail = (g) => visibleSecs().map((x) => { const first = allowed(x.id)[0], n = sectionBadge(x.id); return `<a href="#/${first.id}" class="admin-rail__link${x.id === g ? ' is-active' : ''}" ${x.id === g ? 'aria-current="true"' : ''} aria-label="${esc(x.id)}${n ? `, ${n} need attention` : ''}" title="${esc(x.id)}">${icon(x.icon, 'size-6')}<span>${esc(x.id)}</span>${n ? '<i class="admin-rail__dot"></i>' : ''}</a>` }).join('')
  const panel = (g, id) => `<p class="admin-sub__title">${esc(g)}</p><nav class="admin-sub__nav" aria-label="${esc(g)}">${allowed(g).map((r) => `<a href="#/${r.id}" class="admin-nav__link${r.id === id ? ' is-active' : ''}" ${r.id === id ? 'aria-current="page"' : ''}>${icon(r.icon)}<span>${esc(r.label)}</span>${badge(r.id)}</a>`).join('')}</nav>`
  const tabs = (route, qs) => !route.views ? '' : `<ul class="admin-tabs__list">${route.views.map(([l, q]) => { const on = (q || '') === qs, n = counts ? counts(route.id, q || '') : null; return `<li><a href="#/${route.id}${q ? '?' + q : ''}" class="admin-tab${on ? ' is-active' : ''}" ${on ? 'aria-current="page"' : ''}>${esc(l)}${n != null ? `<span class="admin-tab__n">${n}</span>` : ''}</a></li>` }).join('')}</ul>`
  const crumbs = (route, qs) => {
    const view = route.views && qs ? route.views.find(([, q]) => q === qs) : null, first = allowed(route.group)[0]
    const items = [['Admin', '#/dashboard'], ...(route.group !== 'Overview' ? [[route.group, `#/${first.id}`]] : []), [route.label, `#/${route.id}`], ...(view && view[1] ? [[view[0], null]] : [])]
    return `<ol>${items.map(([l, h], i) => i === items.length - 1 ? `<li aria-current="page">${esc(l)}</li>` : `<li><a href="${h}">${esc(l)}</a></li>`).join('')}</ol>`
  }

  root.innerHTML = `
  <a class="admin-skip" href="#admin-main">Skip to content</a>
  <div class="admin-shell">
    <aside class="admin-side" id="admin-side" aria-label="Main">
      <div class="admin-rail"><a class="admin-rail__brand" href="#/dashboard" aria-label="${esc(brand.identity.adminTitle)}">${logoSrc ? `<img src="${esc(logoSrc)}" alt="${esc(brand.identity.name)}">` : `<b>${esc(brand.identity.shortName.slice(0, 2))}</b>`}</a><nav class="admin-rail__nav" data-rail aria-label="Sections"></nav><a class="admin-rail__link admin-rail__store" href="/" target="_blank" rel="noopener" aria-label="View storefront" title="View storefront">${icon('external', 'size-6')}<span>Store</span></a></div>
      <div class="admin-sub" data-panel></div>
    </aside>
    <div class="admin-scrim" data-scrim hidden></div>
    <div class="admin-main">
      <header class="admin-top">
        <button class="btn btn-ghost btn-square admin-top__menu" data-menu aria-label="Open menu" aria-controls="admin-side" aria-expanded="false">${icon('menu')}</button>
        <label class="admin-gsearch"><span class="sr-only">Search the admin</span>${icon('search', 'size-4')}<input type="search" data-gsearch placeholder="Search orders, bouquets, customers" autocomplete="off"><div class="admin-gsearch__out" data-gout hidden></div></label>
        <span class="admin-top__spacer"></span>
        <button class="btn btn-ghost btn-square" data-theme aria-label="Toggle dark mode">${icon(theme.mode() === 'dark' ? 'sun' : 'moon')}</button>
        <div class="dropdown dropdown-end"><button tabindex="0" class="admin-user" aria-label="Account menu"><span class="admin-user__av">${esc((s?.name || '?').slice(0, 1))}</span><span class="admin-user__name">${esc(s?.name || '')}<small>${esc(s?.role || '')}</small></span></button>
          <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-30 w-52 p-2 shadow-lg border border-base-300"><li class="menu-title">${esc(s?.email || '')}</li>${auth.can('settings:view') ? `<li><a href="#/settings">${icon('cog', 'size-4')}Settings</a></li>` : ''}<li><button data-logout>${icon('logout', 'size-4')}Sign out</button></li></ul></div>
      </header>
      <nav class="admin-tabs" data-tabs aria-label="Views" hidden></nav>
      <nav class="admin-crumbs" data-crumbs aria-label="Breadcrumb"></nav>
      <main id="admin-main" class="admin-content" tabindex="-1"></main>
    </div>
  </div>`
  const main = root.querySelector('#admin-main'), side = root.querySelector('#admin-side'), scrim = root.querySelector('[data-scrim]')
  const toggleSide = (open) => { side.classList.toggle('is-open', open); scrim.hidden = !open; root.querySelector('[data-menu]').setAttribute('aria-expanded', String(open)) }
  const drawNav = () => { const { id, qs } = parse(), route = routes.find((r) => r.id === id) || routes[0]; root.querySelector('[data-rail]').innerHTML = rail(route.group); root.querySelector('[data-panel]').innerHTML = panel(route.group, route.id); const t = root.querySelector('[data-tabs]'); t.innerHTML = tabs(route, qs); t.hidden = !route.views; root.querySelector('[data-crumbs]').innerHTML = crumbs(route, qs) }
  root.querySelector('[data-menu]').addEventListener('click', () => toggleSide(!side.classList.contains('is-open')))
  scrim.addEventListener('click', () => toggleSide(false))
  side.addEventListener('click', (e) => { if (e.target.closest('.admin-sub a')) toggleSide(false) })
  root.querySelector('[data-logout]').addEventListener('click', () => { auth.logout(); onLogout && onLogout() })
  root.querySelector('[data-theme]').addEventListener('click', (e) => { theme.toggle(); e.currentTarget.innerHTML = icon(theme.mode() === 'dark' ? 'sun' : 'moon') })

  const navigate = (to) => { location.hash = to.startsWith('#') ? to : `#/${to}` }
  let token = 0, cleanup = null
  async function render() {
    const { id, rest, params } = parse(), my = ++token
    const route = routes.find((r) => r.id === id) || routes[0]
    if (!auth.can(route.perm)) { const first = routes.find((r) => auth.can(r.perm)); if (first && first.id !== route.id) return navigate(first.id) }
    drawNav(); cleanup && cleanup(); cleanup = null
    // Each render gets its own container, so listeners a view attaches to ctx.el are discarded with it.
    const host = document.createElement('div'); host.className = 'admin-view'; host.dataset.view = route.id
    host.innerHTML = '<div class="admin-loading"><span class="loading loading-spinner"></span></div>'
    main.replaceChildren(host)
    const ctx = { el: host, params, rest, navigate, route }
    let out; try { out = await views[route.id](ctx) } catch (err) { console.error(err); out = `<div class="admin-empty"><h3>Something went wrong</h3><p>${esc(err.message)}</p></div>` }
    if (my !== token) return
    if (out && typeof out === 'object' && 'html' in out) { host.innerHTML = String(out.html); cleanup = (out.mount && out.mount(host)) || null }
    else host.innerHTML = String(out ?? '')   // string, or html`` output
    document.title = `${route.label} · ${brand.identity.adminTitle}`
    window.scrollTo({ top: 0 })
  }
  addEventListener('hashchange', render)
  const gs = root.querySelector('[data-gsearch]'), go = root.querySelector('[data-gout]')
  if (search) {
    gs.addEventListener('input', () => { const q = gs.value.trim(); if (!q) { go.hidden = true; return } const res = search(q).slice(0, 8); go.innerHTML = res.length ? res.map((r) => `<a href="${esc(r.href)}" data-g><b>${esc(r.title)}</b><small>${esc(r.kind)} · ${esc(r.sub || '')}</small></a>`).join('') : '<p class="p-3 text-sm text-base-content/60">No results</p>'; go.hidden = false })
    go.addEventListener('click', () => { go.hidden = true; gs.value = '' })
    document.addEventListener('click', (e) => { if (!e.target.closest('.admin-gsearch')) go.hidden = true })
  }
  addEventListener('keydown', (e) => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { e.preventDefault(); gs.focus() } })
  render()
  return { render, navigate, setBadge(id, n) { badges[id] = n; const b = root.querySelector(`[data-badge="${id}"]`); if (b) { b.textContent = n; b.hidden = !n } }, refreshNav: drawNav }
}
