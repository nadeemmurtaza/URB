// First-visit data. Products and made-to-order pieces come from the real catalogue (js/data.js); orders, customers and
// enquiries below are FICTIONAL demo rows (flagged demo:true) so the dashboard has something to show. Clear them in Settings.
import { C, DEFAULT_SETTINGS } from './core.js'

const D = window.URB_DATA
const base = D.defaults || { products: D.products, collections: D.collections }
const rng = (seed) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296

/* Starter materials and recipes. These are ESTIMATES made up to show how the costing works: replace the costs and
   quantities with your real ones. Flagged demo:true so they are easy to spot. */
const MATERIALS = [
  ['yarn-pink', 'Pink acrylic yarn, 4 ply', 'yarn', 'g', 4.2, 900, 200, 50], ['yarn-red', 'Red acrylic yarn, 4 ply', 'yarn', 'g', 4.2, 700, 200, 50], ['yarn-white', 'White acrylic yarn, 4 ply', 'yarn', 'g', 4.0, 1000, 200, 50],
  ['yarn-cream', 'Cream cotton yarn', 'yarn', 'g', 5.5, 600, 150, 50], ['yarn-green', 'Green acrylic yarn, 4 ply', 'yarn', 'g', 4.0, 800, 200, 50], ['yarn-blue', 'Blue acrylic yarn, 4 ply', 'yarn', 'g', 4.2, 450, 150, 50],
  ['yarn-purple', 'Purple acrylic yarn, 4 ply', 'yarn', 'g', 4.2, 400, 150, 50], ['yarn-yellow', 'Yellow acrylic yarn, 4 ply', 'yarn', 'g', 4.0, 300, 150, 50], ['yarn-orange', 'Orange acrylic yarn, 4 ply', 'yarn', 'g', 4.2, 350, 150, 50],
  ['wire-stem', 'Floral stem wire', 'wire', 'm', 14, 80, 20, 10], ['wrap-sheet', 'Wrapping paper (kraft or newsprint)', 'wrap', 'sheet', 85, 30, 10, 10], ['ribbon-satin', 'Satin ribbon', 'ribbon', 'm', 38, 60, 15, 10],
  ['stuffing', 'Polyester stuffing', 'filler', 'g', 0.7, 2000, 500, 500], ['box-urb', 'urb parcel box', 'packaging', 'pc', 240, 18, 6, 6], ['card-tag', 'Gift card', 'packaging', 'pc', 22, 100, 25, 25],
  ['keyring', 'Keyring ring', 'hardware', 'pc', 28, 40, 10, 10], ['eyes', 'Safety eyes (pair)', 'hardware', 'pc', 9, 60, 20, 20],
]
const colour = (t) => { t = t.toLowerCase(); if (/blue/.test(t)) return 'yarn-blue'; if (/pink/.test(t)) return 'yarn-pink'; if (/red|poppy|valentine|rose|chinese/.test(t)) return 'yarn-red'; if (/forget/.test(t)) return 'yarn-blue'; if (/lavender|lewisia|iris|violet|orchid|cymbidium/.test(t)) return 'yarn-purple'; if (/sunflower|dill|chrysanth|ping pong|pom/.test(t)) return 'yarn-yellow'; if (/gerbera|african/.test(t)) return 'yarn-orange'; if (/lily of the valley|daisy|calla|stargazer|freesia/.test(t)) return 'yarn-white'; return 'yarn-pink' }
function recipeFor(p) {
  const add = (lines, id, qty) => { const l = lines.find((x) => x.materialId === id); if (l) l.qty = +(l.qty + qty).toFixed(2); else lines.push({ materialId: id, qty: +qty.toFixed(2), scrap: 10 }) }
  const lines = []; let stems = 0
  for (const t of p.inside) { const n = Math.min(8, parseInt(t, 10) || 1); stems += n; add(lines, colour(t), 9 * n) }
  stems = Math.min(stems, 24); add(lines, 'yarn-green', Math.max(6, Math.round(stems * 2.5))); add(lines, 'wire-stem', +(stems * 0.35).toFixed(2))
  lines.push({ materialId: 'wrap-sheet', qty: stems > 8 ? 2 : 1, scrap: 0 }, { materialId: 'ribbon-satin', qty: 1.2, scrap: 5 }, { materialId: 'card-tag', qty: 1, scrap: 0 }, { materialId: 'box-urb', qty: 1, scrap: 0 })
  return { id: p.id, lines, labourMin: 40 * stems, notes: 'Starter estimate: replace with your real quantities and making time.', demo: true, createdAt: 1 }
}

export function seedAll() {
  C.materials.seed(MATERIALS.map(([id, name, kind, unit, cost, stock, reorder, pack]) => ({ id, name, kind, unit, cost, stock, reorder, pack, supplier: '', notes: '', demo: true, createdAt: 1 })))
  C.boms.seed(base.products.map(recipeFor))
  C.products.seed(base.products.map((p) => ({ id: p.id, name: p.name, price: p.price, was: p.was || 0, stock: p.stock, fee: p.fee, line: p.line, inside: p.inside, tags: p.tags, occ: p.occ, img: p.img, photo: p.photo, soft: !!p.soft, kind: p.kind || 'bouquet', cut: p.cut || p.img, active: true, createdAt: 1 })))
  C.items.seed(base.collections.flatMap((c) => c.items.map((it) => ({ id: `${c.id}-${it.id}`, collection: c.id, name: it.name, note: it.note, facts: it.facts || [], colors: it.colors || [], img: it.img, soft: !!it.soft, active: true, createdAt: 1 }))))
  C.promos.seed([{ id: 'promo_welcome', code: D.promo.code, pct: D.promo.pct, active: true, used: 0, expires: '', limit: 0 }])
  C.settings.seed([{ ...DEFAULT_SETTINGS, cities: D.cities }])
  const r = rng(7), pick = (a) => a[Math.floor(r() * a.length)]
  const people = [['Ayesha Khan', 'Lahore', 'House 14, Street 9, Gulberg III'], ['Hira Malik', 'Islamabad', 'Flat 6, Block C, F-11 Markaz'], ['Sana Raza', 'Karachi', 'B-22, Block 5, Clifton'], ['Maryam Qureshi', 'Rawalpindi', 'House 3, Street 12, Bahria Town Phase 4'], ['Fatima Noor', 'Lahore', '55-B, DHA Phase 5'], ['Zainab Ali', 'Islamabad', 'House 9, Street 21, G-10/2'], ['Iqra Sheikh', 'Peshawar', 'House 31, Hayatabad Phase 3'], ['Mahnoor Tariq', 'Karachi', 'A-104, Gulshan-e-Iqbal Block 13'], ['Areeba Siddiqui', 'Faisalabad', 'House 7, Peoples Colony No. 1'], ['Noor Fatima', 'Multan', 'House 18, Shah Rukn-e-Alam Colony'], ['Laiba Ahmed', 'Lahore', 'Flat 12, Askari 11'], ['Rida Javed', 'Islamabad', 'House 2, Street 5, E-11/3'], ['Kinza Butt', 'Lahore', '23-C, Johar Town Block F'], ['Saba Hussain', 'Karachi', 'C-9, Bahadurabad'], ['Alina Chaudhry', 'Rawalpindi', 'House 40, Satellite Town']]
  const cust = people.map(([name, city, address], i) => ({ name, city, address, phone: `030${1 + (i % 6)}${String(1000000 + Math.floor(r() * 8999999))}`.slice(0, 11) }))
  const prods = base.products, now = Date.now(), slots = ['Morning', 'Evening'], pays = ['cod', 'cod', 'bank', 'card']
  const orders = Array.from({ length: 34 }, (_, i) => {
    const ageD = Math.floor(Math.pow(r(), 1.3) * 30), at = now - ageD * 864e5 - Math.floor(r() * 8) * 36e5 - 36e5
    const c = pick(cust), lines = Array.from({ length: 1 + (r() < 0.3 ? 1 : 0) }, () => { const p = pick(prods); return { id: p.id, name: p.name, qty: 1 + (r() < 0.12 ? 1 : 0), price: p.price } })
    const sub = lines.reduce((t, l) => t + l.price * l.qty, 0), fee = Math.max(...lines.map((l) => prods.find((p) => p.id === l.id).fee)), disc = r() < 0.18 ? Math.round(sub * 0.05) : 0
    const status = ageD > 5 ? (r() < 0.9 ? 'delivered' : 'cancelled') : ageD > 3 ? pick(['dispatched', 'delivered', 'preparing']) : ageD > 1 ? pick(['confirmed', 'preparing', 'dispatched']) : pick(['new', 'new', 'confirmed'])
    const flow = ['new', 'confirmed', 'preparing', 'dispatched', 'delivered'], idx = flow.indexOf(status)
    const history = (status === 'cancelled' ? ['new', 'cancelled'] : flow.slice(0, idx + 1)).map((s, k) => ({ at: at + k * 5 * 36e5, status: s, by: 'owner@urb.example' }))
    const pay = pick(pays), paid = status === 'delivered' || (pay !== 'cod' && status !== 'new' && status !== 'cancelled')
    const d = new Date(at + 2 * 864e5)
    return { id: `URB-${100100 + i}`, at, status, payment: status === 'cancelled' ? 'unpaid' : paid ? 'paid' : 'unpaid', pay, customer: { name: c.name, phone: c.phone, email: '', city: c.city, address: c.address }, items: lines, sub, disc, fee, total: sub - disc + fee, date: d.toISOString().slice(0, 10), slot: pick(slots), msg: r() < 0.4 ? pick(['Happy birthday!', 'Thank you for everything.', 'Love you, always.', 'Congratulations!', 'Get well soon.']) : '', notes: [], history, demo: true, createdAt: at }
  }).sort((a, b) => b.at - a.at)
  C.orders.seed(orders, { merge: true })
  C.enquiries.seed([
    { id: 'enq_1', at: now - 4 * 36e5, name: 'Mahnoor Tariq', email: 'mahnoor@example.com', occasion: 'Birthday', brief: 'A pastel bouquet in blue and cream, about 12 stems, for my sister. Budget around 9,000.', status: 'new', demo: true },
    { id: 'enq_2', at: now - 30 * 36e5, name: 'Kinza Butt', occasion: 'Anniversary', brief: 'Two plushie cats in grey and pink, gift wrapped, for delivery in Lahore.', item: 'Chonky cat', status: 'quoted', quote: 4200, reply: 'Two cats in lilac-grey and pink, wrapped in the urb box. Ready in 7 days.', demo: true },
    { id: 'enq_3', at: now - 3 * 864e5, name: 'Rida Javed', occasion: 'Thank you', brief: 'Single orange poppy stems, three of them, with a handwritten card.', item: 'Corn poppy', status: 'won', quote: 3900, demo: true },
    { id: 'enq_4', at: now - 6 * 864e5, name: 'Saba Hussain', occasion: 'Other', brief: 'Can you make a cardigan in mustard yellow, size medium?', item: 'Patchwork cardigan', status: 'closed', demo: true },
    { id: 'enq_5', at: now - 20 * 36e5, name: 'Laiba Ahmed', occasion: 'Love', brief: 'A rose bouquet in deep red with baby’s-breath, wrapped in newsprint.', status: 'new', demo: true },
  ].map((e) => ({ ...e, createdAt: e.at })), { merge: true })
  C.stockmoves.seed([{ id: 'sm_1', at: now - 5 * 864e5, productId: 'forget-me-not', name: 'Forget-Me-Not Bouquet', delta: 4, reason: 'Restock', by: 'owner@urb.example' }, { id: 'sm_2', at: now - 2 * 864e5, productId: 'white-muse', name: 'White Muse Bouquet', delta: -1, reason: 'Damaged', by: 'staff@urb.example' }])
}
