/** Namespaced, failure-tolerant JSON storage (private windows and blocked storage fall back to memory). */
export function createStorage(namespace, backend) {
  const mem = new Map()
  let store = backend
  if (!store) { try { store = globalThis.localStorage; store.getItem('__t') } catch { store = null } }
  const k = (key) => `${namespace}.${key}`
  return {
    get(key, fallback = null) {
      try { const v = mem.has(k(key)) ? mem.get(k(key)) : store ? store.getItem(k(key)) : null; return v == null ? fallback : JSON.parse(v) } catch { return fallback }
    },
    set(key, value) {
      const s = JSON.stringify(value)
      try { if (!store) throw 0; store.setItem(k(key), s); mem.delete(k(key)) } catch { mem.set(k(key), s) }
    },
    remove(key) { mem.delete(k(key)); try { store && store.removeItem(k(key)) } catch { /* ignore */ } },
    keys() { const out = []; try { for (let i = 0; i < (store?.length || 0); i++) { const n = store.key(i); if (n && n.startsWith(namespace + '.')) out.push(n.slice(namespace.length + 1)) } } catch { /* ignore */ } return out },
    namespace,
  }
}
