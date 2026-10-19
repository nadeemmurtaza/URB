import { auth, brand, theme } from '../core.js'
import { esc } from '../library/utils/html.js'
import { USERS } from '../brand.js'

export function mountLogin(root, onDone) {
  root.innerHTML = `<main class="admin-login"><form class="admin-login__card" id="lf" novalidate>
    <div class="grid gap-1 justify-items-start"><img src="${esc(brand.artwork.logo)}" alt="urb" class="h-9 w-auto"><h1 class="text-xl font-extrabold">Admin sign in</h1><p class="text-sm text-base-content/70">Manage orders, bouquets and stock.</p></div>
    <div class="admin-field"><label class="admin-field__label" for="em">Email</label><input class="input input-bordered w-full" id="em" type="email" autocomplete="username" inputmode="email" required><p class="admin-field__error" id="em-error" role="alert" hidden></p></div>
    <div class="admin-field"><label class="admin-field__label" for="pw">Password</label><input class="input input-bordered w-full" id="pw" type="password" autocomplete="current-password" required><p class="admin-field__error" id="pw-error" role="alert" hidden></p></div>
    <p class="admin-field__error" id="lf-error" role="alert" hidden></p>
    <button class="btn btn-primary w-full" type="submit">Sign in</button>
    <div class="rounded-box bg-base-200 p-3 text-sm grid gap-2"><b>Demo access</b><span class="text-base-content/70">This is a design demo, not a secured system. Pick a role to try it:</span><div class="flex flex-wrap gap-2">${USERS.map((u) => `<button type="button" class="btn btn-sm btn-outline" data-as="${esc(u.email)}">${esc(u.name)}</button>`).join('')}</div></div>
    <a class="link text-sm" href="../index.html">← Back to the storefront</a></form></main>`
  const f = root.querySelector('#lf'), err = (id, m) => { const e = root.querySelector(id); e.textContent = m || ''; e.hidden = !m }
  const submit = (email, pw) => { err('#lf-error'); const ok = auth.login(email, pw); if (!ok) { err('#lf-error', 'That email and password do not match.'); root.querySelector('#pw').focus(); return } onDone() }
  f.addEventListener('submit', (e) => { e.preventDefault(); const em = f.querySelector('#em').value, pw = f.querySelector('#pw').value; err('#em-error', em ? '' : 'Enter your email.'); err('#pw-error', pw ? '' : 'Enter your password.'); if (!em) return f.querySelector('#em').focus(); if (!pw) return f.querySelector('#pw').focus(); submit(em, pw) })
  f.addEventListener('click', (e) => { const b = e.target.closest('[data-as]'); if (b) { const u = USERS.find((x) => x.email === b.dataset.as); f.querySelector('#em').value = u.email; f.querySelector('#pw').value = u.secret; submit(u.email, u.secret) } })
  document.title = `Sign in · ${brand.identity.adminTitle}`; f.querySelector('#em').focus()
}
