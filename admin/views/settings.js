import { C, COLLECTIONS, db, auth, theme, brand, toast, confirm, log, settings, saveSettings, storage } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { pageHeader } from '../library/components/common/page-header.js'
import { textField, textArea, readForm, showErrors } from '../library/components/ui/field.js'
import { ROLES, RESOURCES, ACTIONS } from '../library/constants/roles.js'
import { downloadJson } from '../library/utils/csv.js'
import { icon } from '../library/components/ui/icons.js'
import { USERS } from '../brand.js'
import { num } from '../helpers.js'

export function settingsView() {
  const s = settings(), edit = auth.can('settings:edit'), owner = auth.session()?.role === 'owner'
  const dis = edit ? '' : ' disabled'
  return {
    html: html`${raw(pageHeader({ title: 'Settings', subtitle: edit ? 'Store details, stock rules, delivery and data' : 'You can view these settings but not change them' }))}
    <div class="admin-grid-2 admin-grid-2--even">
      <article class="admin-card"><h2 class="admin-card__title">Store</h2><form id="sf" class="admin-form" novalidate>
        <dl class="admin-kv"><div><dt>Name</dt><dd>${esc(brand.identity.name)}</dd></div><div><dt>Currency</dt><dd>${esc(brand.locale.currency)}</dd></div><div><dt>Time zone</dt><dd>${esc(brand.locale.timezone)}</dd></div></dl>
        ${raw(textField('email', 'Contact email', s.email, { type: 'email', optional: true, hint: 'Shown to your team only for now' }))}${raw(textField('phone', 'Phone', s.phone, { type: 'tel', optional: true }))}${raw(textField('lowStock', 'Low-stock level', s.lowStock, { type: 'number', min: 0, step: 1, hint: 'Bouquets at or below this number are flagged' }))}
        <fieldset class="grid gap-3"><legend class="admin-field__label">Costing assumptions</legend><p class="admin-field__hint">Used by Recipes (BOM) to work out what each bouquet costs and earns.</p>
        <div class="admin-form__row">${raw(textField('labourRate', 'Labour per hour (Rs)', s.labourRate, { type: 'number', min: 0, step: 10, inputmode: 'numeric' }))}${raw(textField('overheadPct', 'Overhead (%)', s.overheadPct, { type: 'number', min: 0, max: 100, step: 1, inputmode: 'numeric', hint: 'Packaging, electricity, fees' }))}</div>
        ${raw(textField('targetMargin', 'Target margin (%)', s.targetMargin, { type: 'number', min: 0, max: 90, step: 1, inputmode: 'numeric', hint: 'Recipes below this are flagged as thin' }))}</fieldset>
        ${raw(textArea('cities', 'Delivery cities', s.cities.join('\n'), { rows: 6, hint: 'One per line. These appear in the checkout.' }))}
        <button class="btn btn-primary w-fit" type="submit"${dis}>Save settings</button></form></article>
      <div class="grid gap-4 content-start min-w-0">
        <article class="admin-card"><h2 class="admin-card__title">Appearance</h2><div class="join"><button class="btn btn-sm join-item" data-theme-set="light">Light</button><button class="btn btn-sm join-item" data-theme-set="dark">Dark</button></div></article>
        <article class="admin-card"><h2 class="admin-card__title">Team & roles</h2><p class="text-sm text-base-content/70">Demo sign-ins only; a static site cannot protect data. Sign out and in as another role to see what each can do.</p>
          <ul class="admin-list">${raw(USERS.map((u) => `<li><span class="admin-user__av size-9">${esc(u.name.slice(0, 1))}</span><span class="grow"><b>${esc(u.name)}</b><br><small class="text-base-content/60">${esc(u.email)}</small></span><span class="badge badge-ghost">${esc(ROLES[u.role].label)}</span></li>`).join(''))}</ul>
          <div class="overflow-x-auto"><table class="table table-xs"><thead><tr><th>Area</th>${raw(Object.values(ROLES).map((r) => `<th>${esc(r.label)}</th>`).join(''))}</tr></thead><tbody>${raw(RESOURCES.map((r) => `<tr><td class="capitalize">${r}</td>${Object.values(ROLES).map((ro) => `<td>${ACTIONS.filter((a) => ro.permissions.includes(`${r}:${a}`)).map((a) => a[0].toUpperCase()).join('') || '–'}</td>`).join('')}</tr>`).join(''))}</tbody></table></div><p class="text-xs text-base-content/60">V view · C create · E edit · D delete</p></article>
        <article class="admin-card"><h2 class="admin-card__title">Data</h2><p class="text-sm text-base-content/70">Everything lives in this browser. Export a backup before clearing anything.</p>
          <div class="flex flex-wrap gap-2"><button class="btn btn-outline btn-sm" data-export>${raw(icon('download', 'size-4'))}Export backup</button><label class="btn btn-outline btn-sm" for="imp">${raw(icon('upload', 'size-4'))}Import backup</label><input class="sr-only" type="file" id="imp" accept="application/json"${edit ? '' : ' disabled'}></div>
          <p class="admin-field__error" id="imp-error" role="alert" hidden></p>
          ${raw(owner ? `<div class="divider my-1"></div><div class="flex flex-wrap gap-2"><button class="btn btn-ghost btn-sm" data-demo>Remove demo orders &amp; enquiries</button><button class="btn btn-ghost btn-sm text-error" data-reset>Reset to starting catalogue</button></div>` : '<p class="text-sm text-base-content/60">Only the owner can remove or reset data.</p>')}</article>
      </div></div>`,
    mount(el) {
      const f = el.querySelector('#sf')
      f.addEventListener('submit', (e) => {
        e.preventDefault(); if (!edit) return; const v = readForm(f), errors = {}, low = Math.round(num(v.lowStock)), cities = v.cities.split('\n').map((c) => c.trim()).filter(Boolean)
        if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) errors.email = 'That email does not look right.'
        if (v.lowStock === '' || low < 0) errors.lowStock = 'Enter 0 or more.'
        const lab = num(v.labourRate), ovh = num(v.overheadPct), tm = num(v.targetMargin)
        if (v.labourRate === '' || lab < 0) errors.labourRate = 'Enter 0 or more.'
        if (v.overheadPct === '' || ovh < 0 || ovh > 100) errors.overheadPct = 'Enter a number from 0 to 100.'
        if (v.targetMargin === '' || tm < 0 || tm > 90) errors.targetMargin = 'Enter a number from 0 to 90.'
        if (!cities.length) errors.cities = 'Keep at least one city.'
        if (Object.keys(errors).length) return showErrors(f, errors)
        saveSettings({ email: v.email, phone: v.phone, lowStock: low, cities, labourRate: lab, overheadPct: ovh, targetMargin: tm }); log('settings saved'); toast.show('Settings saved')
      })
      el.querySelectorAll('[data-theme-set]').forEach((b) => { b.classList.toggle('btn-primary', theme.mode() === b.dataset.themeSet); b.addEventListener('click', () => { theme.set(b.dataset.themeSet); el.querySelectorAll('[data-theme-set]').forEach((x) => x.classList.toggle('btn-primary', x === b)) }) })
      el.querySelector('[data-export]').addEventListener('click', () => { downloadJson(`urb-backup-${new Date().toISOString().slice(0, 10)}.json`, { app: 'urb-admin', version: 1, at: Date.now(), data: db.dump(COLLECTIONS) }); log('backup exported'); toast.show('Backup downloaded') })
      el.querySelector('#imp').addEventListener('change', async (e) => {
        const er = el.querySelector('#imp-error'); er.hidden = true; const file = e.target.files[0]; if (!file) return
        try { const j = JSON.parse(await file.text()); if (j.app !== 'urb-admin' || typeof j.data !== 'object') throw new Error('That file is not a URB backup.'); const bad = Object.keys(j.data).filter((k) => !COLLECTIONS.includes(k) || !Array.isArray(j.data[k])); if (bad.length) throw new Error(`Unexpected data: ${bad.join(', ')}`)
          if (!(await confirm({ title: 'Replace current data?', body: 'Everything in this browser is replaced by the backup.', action: 'Import' }))) return; db.restore(j.data); log('backup imported'); toast.show('Backup imported'); location.reload() } catch (x) { er.textContent = x.message || 'Could not read that file.'; er.hidden = false } finally { e.target.value = '' }
      })
      el.querySelector('[data-demo]')?.addEventListener('click', async () => { if (!(await confirm({ title: 'Remove demo data?', body: 'Deletes the fictional demo orders and enquiries. Real ones stay.', action: 'Remove', tone: 'error' }))) return; C.orders.replace(C.orders.all().filter((o) => !o.demo)); C.enquiries.replace(C.enquiries.all().filter((o) => !o.demo)); C.stockmoves.replace(C.stockmoves.all().filter((m) => !/^sm_[12]$/.test(m.id))); log('demo data removed'); toast.show('Demo data removed') })
      el.querySelector('[data-reset]')?.addEventListener('click', async () => { if (!(await confirm({ title: 'Reset everything?', body: 'Removes all orders, edits, customers notes and promos and restores the starting catalogue. Export a backup first.', action: 'Reset', tone: 'error' }))) return; db.clear(COLLECTIONS); storage.remove('orders'); toast.show('Reset. Reloading…'); setTimeout(() => location.reload(), 600) })
    },
  }
}
