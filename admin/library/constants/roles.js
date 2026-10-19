/** Roles and permission keys for any back office. Permissions are `resource:action`. */
export const ACTIONS = ['view', 'create', 'edit', 'delete']
export const RESOURCES = ['dashboard', 'orders', 'products', 'items', 'inventory', 'materials', 'bom', 'production', 'customers', 'enquiries', 'promos', 'settings', 'activity']

const all = RESOURCES.flatMap((r) => ACTIONS.map((a) => `${r}:${a}`))
export const ROLES = {
  owner: { label: 'Owner', permissions: all },
  manager: { label: 'Manager', permissions: all.filter((p) => !p.startsWith('settings:') || p === 'settings:view') },
  staff: { label: 'Staff', permissions: ['dashboard:view', 'orders:view', 'orders:edit', 'customers:view', 'enquiries:view', 'enquiries:edit', 'inventory:view', 'inventory:edit', 'products:view', 'materials:view', 'materials:edit', 'bom:view', 'production:view'] },
  viewer: { label: 'Viewer', permissions: RESOURCES.map((r) => `${r}:view`).filter((p) => p !== 'settings:view') },
}
export const can = (role, permission) => !!ROLES[role]?.permissions.includes(permission)
