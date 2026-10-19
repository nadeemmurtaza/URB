/**
 * Demo session provider for prototypes. NOT security: a static site cannot protect anything.
 * Real deployments replace `verify` with a server call (or put the site behind an access gateway) and keep this API.
 *   const auth = createAuth({ storage, users: [{ email, name, role, secret }] })
 *   auth.login(email, secret) -> session | null ; auth.session() ; auth.logout() ; auth.can('orders:edit')
 */
import { can } from '../constants/roles.js'

export function createAuth({ storage, users, ttlHours = 12 }) {
  const KEY = 'session'
  const read = () => { const s = storage.get(KEY); return s && Date.now() - s.at < ttlHours * 3600e3 ? s : null }
  const subs = new Set()
  const emit = () => subs.forEach((f) => f(read()))
  return {
    session: read,
    login(email, secret) {
      const u = users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase() && x.secret === secret)
      if (!u) return null
      const s = { email: u.email, name: u.name, role: u.role, at: Date.now() }
      storage.set(KEY, s); emit(); return s
    },
    logout() { storage.remove(KEY); emit() },
    can: (permission) => { const s = read(); return !!s && can(s.role, permission) },
    subscribe: (f) => { subs.add(f); return () => subs.delete(f) },
  }
}
