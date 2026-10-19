/**
 * Side drawer / modal built on <dialog> (focus trap, Esc, backdrop click for free).
 *   const d = openDrawer({ title, body: htmlString, footer: htmlString, size: 'md' | 'lg', onClose })
 *   d.el  (the dialog), d.body (content element), d.close()
 */
import { esc } from '../../utils/html.js'
import { icon } from './icons.js'
export function openDrawer({ title = '', body = '', footer = '', size = 'md', onClose } = {}) {
  const dlg = document.createElement('dialog')
  dlg.className = `admin-drawer admin-drawer--${size}`
  dlg.innerHTML = `<div class="admin-drawer__panel"><header class="admin-drawer__head"><h2 class="admin-drawer__title">${esc(title)}</h2><button class="btn btn-ghost btn-square btn-sm" data-close aria-label="Close">${icon('x')}</button></header><div class="admin-drawer__body">${body}</div>${footer ? `<footer class="admin-drawer__foot">${footer}</footer>` : ''}</div>`
  const close = () => { dlg.classList.add('is-closing'); setTimeout(() => { dlg.close(); dlg.remove(); onClose && onClose() }, 180) }
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) close() })
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close() })
  document.body.appendChild(dlg); dlg.showModal()
  return { el: dlg, body: dlg.querySelector('.admin-drawer__body'), foot: dlg.querySelector('.admin-drawer__foot'), close, setTitle: (t) => { dlg.querySelector('.admin-drawer__title').textContent = t } }
}
