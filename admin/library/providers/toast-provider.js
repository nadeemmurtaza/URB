/** Toasts using the daisyUI toast/alert classes. createToaster() -> { show(message, tone) }, tone: success | error | info | warning */
export function createToaster({ root = document.body, duration = 3200 } = {}) {
  let host = root.querySelector('[data-toaster]')
  if (!host) { host = document.createElement('div'); host.className = 'toast toast-end toast-bottom z-[100]'; host.setAttribute('data-toaster', ''); host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); root.appendChild(host) }
  return {
    show(message, tone = 'success') {
      const el = document.createElement('div'); el.className = `alert alert-${tone} shadow-lg admin-toast`; el.textContent = message
      host.appendChild(el); setTimeout(() => { el.classList.add('admin-toast-out'); setTimeout(() => el.remove(), 250) }, duration)
    },
  }
}
