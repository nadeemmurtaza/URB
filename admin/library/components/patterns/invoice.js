import { esc } from '../../utils/html.js'
/** Printable invoice / packing slip. invoice({ order, brand, money, dates }) -> html; print with openPrint(html). */
export function invoice({ order, brand, money, dates }) {
  return `<article class="admin-invoice"><header><div><h2>${esc(brand.identity.name)}</h2><p>${esc(brand.contact.email || '')}</p></div><div class="text-end"><strong>Invoice ${esc(order.id)}</strong><p>${esc(dates.day(order.at))}</p></div></header>
  <section class="admin-invoice__to"><h3>Deliver to</h3><p>${esc(order.customer.name)}<br>${esc(order.customer.address)}<br>${esc(order.customer.city)} · ${esc(order.customer.phone)}</p><p><b>Delivery:</b> ${esc(order.date)} (${esc(order.slot)})</p>${order.msg ? `<p><b>Card:</b> ${esc(order.msg)}</p>` : ''}</section>
  <table><thead><tr><th>Item</th><th>Qty</th><th class="text-end">Price</th><th class="text-end">Total</th></tr></thead><tbody>${order.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td class="text-end">${esc(money.format(i.price))}</td><td class="text-end">${esc(money.format(i.price * i.qty))}</td></tr>`).join('')}</tbody>
  <tfoot><tr><td colspan="3">Subtotal</td><td class="text-end">${esc(money.format(order.sub))}</td></tr>${order.disc ? `<tr><td colspan="3">Discount</td><td class="text-end">−${esc(money.format(order.disc))}</td></tr>` : ''}<tr><td colspan="3">Delivery</td><td class="text-end">${esc(money.format(order.fee))}</td></tr><tr class="total"><td colspan="3">Total</td><td class="text-end">${esc(money.format(order.total))}</td></tr></tfoot></table></article>`
}
export function openPrint(content) {
  const root = document.createElement('div'); root.className = 'admin-print-root'; root.innerHTML = content; document.body.appendChild(root)
  document.body.classList.add('is-printing'); const done = () => { document.body.classList.remove('is-printing'); root.remove(); removeEventListener('afterprint', done) }
  addEventListener('afterprint', done); setTimeout(() => { print(); setTimeout(done, 1500) }, 60)
}
