/** Promise-based confirm dialog on the daisyUI modal: await confirm({ title, body, action, tone }) -> boolean */
import { esc } from '../utils/html.js'
export function createConfirm() {
  return ({ title = 'Are you sure?', body = '', action = 'Confirm', cancel = 'Cancel', tone = 'primary' } = {}) => new Promise((resolve) => {
    const d = document.createElement('dialog'); d.className = 'modal modal-bottom sm:modal-middle'
    d.innerHTML = `<div class="modal-box"><h3 class="text-lg font-bold">${esc(title)}</h3><p class="py-3 text-base-content/70">${esc(body)}</p><div class="modal-action"><button class="btn btn-ghost" data-r="0">${esc(cancel)}</button><button class="btn btn-${tone}" data-r="1">${esc(action)}</button></div></div><form method="dialog" class="modal-backdrop"><button aria-label="Close">close</button></form>`
    const done = (v) => { d.close(); d.remove(); resolve(v) }
    d.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) done(b.dataset.r === '1') })
    d.addEventListener('cancel', (e) => { e.preventDefault(); done(false) })
    d.addEventListener('close', () => resolve(false))
    document.body.appendChild(d); d.showModal(); d.querySelector('[data-r="1"]').focus()
  })
}
