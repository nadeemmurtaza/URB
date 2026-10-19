/** Status flows. `next` lists the transitions the UI offers; `tone` maps to a daisyUI badge colour. */
export const ORDER_STATUS = {
  new: { label: 'New', tone: 'info', next: ['confirmed', 'cancelled'] },
  confirmed: { label: 'Confirmed', tone: 'primary', next: ['preparing', 'cancelled'] },
  preparing: { label: 'Preparing', tone: 'warning', next: ['dispatched', 'cancelled'] },
  dispatched: { label: 'Out for delivery', tone: 'secondary', next: ['delivered', 'cancelled'] },
  delivered: { label: 'Delivered', tone: 'success', next: [] },
  cancelled: { label: 'Cancelled', tone: 'error', next: [] },
}
export const ORDER_FLOW = ['new', 'confirmed', 'preparing', 'dispatched', 'delivered']
export const PAYMENT_STATUS = {
  unpaid: { label: 'Unpaid', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  refunded: { label: 'Refunded', tone: 'neutral' },
}
export const ENQUIRY_STATUS = {
  new: { label: 'New', tone: 'info', next: ['quoted', 'closed'] },
  quoted: { label: 'Quoted', tone: 'warning', next: ['won', 'closed'] },
  won: { label: 'Won', tone: 'success', next: [] },
  closed: { label: 'Closed', tone: 'neutral', next: ['new'] },
}
export const STOCK = { low: 2, out: 0 }
export const PAGE_SIZES = [10, 25, 50]
