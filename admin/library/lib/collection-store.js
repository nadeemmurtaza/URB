/**
 * A small client-side database over any storage with get/set (utils/storage.js). One key per collection.
 * Demo/prototype persistence: when a real API exists, replace this file and keep the same collection API.
 *
 *   const db = createDb({ storage })
 *   const orders = db.collection('orders')
 *   orders.insert({ ... })  // adds id + createdAt
 *   orders.update(id, { status: 'paid' }) ; orders.remove(id) ; orders.all() ; orders.get(id)
 *   orders.subscribe(fn)    // fn(rows) on any change, including from another tab
 */
import { uid } from '../utils/slug.js'

export function createDb({ storage, prefix = 'db' } = {}) {
  const subs = new Map()
  const key = (name) => `${prefix}.${name}`
  const emit = (name) => { for (const fn of subs.get(name) || []) fn(read(name)) }
  const read = (name) => storage.get(key(name), [])
  const write = (name, rows) => { storage.set(key(name), rows); emit(name) }
  if (typeof addEventListener === 'function') {
    addEventListener('storage', (e) => { if (e.key && e.key.includes(`.${prefix}.`)) { const name = e.key.split(`${prefix}.`)[1]; emit(name) } })
  }
  return {
    collection(name, { idPrefix = name.slice(0, 3) } = {}) {
      return {
        name,
        all: () => read(name),
        get: (id) => read(name).find((r) => r.id === id) || null,
        insert(row) { const r = { id: row.id || uid(idPrefix), createdAt: Date.now(), ...row }; write(name, [r, ...read(name)]); return r },
        update(id, patch) { let out = null; write(name, read(name).map((r) => (r.id === id ? (out = { ...r, ...(typeof patch === 'function' ? patch(r) : patch), updatedAt: Date.now() }) : r))); return out },
        upsert(row) { return this.get(row.id) ? this.update(row.id, row) : this.insert(row) },
        remove(id) { write(name, read(name).filter((r) => r.id !== id)) },
        replace(rows) { write(name, rows) },
        count: () => read(name).length,
        isSeeded: () => storage.get(key(`${name}.seeded`), false),
        /** Seed once. With { merge: true } existing rows are kept (e.g. orders written by another surface before first load). */
        seed(rows, { merge = false } = {}) { if (!storage.get(key(`${name}.seeded`), false)) { storage.set(key(`${name}.seeded`), true); write(name, merge ? [...read(name), ...rows] : rows) } },
        subscribe(fn) { const s = subs.get(name) || new Set(); s.add(fn); subs.set(name, s); return () => s.delete(fn) },
      }
    },
    /** Snapshot every collection, for export or backup. */
    dump(names) { return Object.fromEntries(names.map((n) => [n, read(n)])) },
    restore(snapshot) { for (const [n, rows] of Object.entries(snapshot)) { storage.set(key(`${n}.seeded`), true); write(n, rows) } },
    clear(names) { for (const n of names) { storage.remove(key(n)); storage.remove(key(`${n}.seeded`)); emit(n) } },
  }
}
