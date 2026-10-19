/** Row selection for bulk actions. createSelection() -> { toggle, toggleAll(ids), has, ids, clear, count, subscribe } */
export function createSelection() {
  const set = new Set(), subs = new Set()
  const emit = () => subs.forEach((f) => f([...set]))
  return {
    has: (id) => set.has(id),
    toggle(id) { set.has(id) ? set.delete(id) : set.add(id); emit() },
    toggleAll(ids) { const all = ids.every((i) => set.has(i)); ids.forEach((i) => (all ? set.delete(i) : set.add(i))); emit() },
    ids: () => [...set],
    count: () => set.size,
    clear() { set.clear(); emit() },
    subscribe: (f) => { subs.add(f); return () => subs.delete(f) },
  }
}
