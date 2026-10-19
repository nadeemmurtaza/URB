/** Audit trail on top of a collection: log(by, action, target). Keeps the newest `max` entries. */
export function createActivityLog(collection, { max = 300 } = {}) {
  return {
    log(by, action, target = '') {
      collection.insert({ at: Date.now(), by, action, target })
      const rows = collection.all()
      if (rows.length > max) collection.replace(rows.slice(0, max))
    },
    recent: (n = 20) => collection.all().slice(0, n),
  }
}
