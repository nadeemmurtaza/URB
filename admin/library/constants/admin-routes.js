/**
 * Admin navigation, two levels. `group` is the section on the slim rail; the routes in a group fill the second panel.
 * `perm` shows/hides an item; `icon` is a key into components/ui/icons.js.
 * `views` (optional) are saved filters shown under the route while it is open: label + the query string the view reads.
 */
export const ADMIN_SECTIONS = [
  { id: 'Overview', icon: 'home' },
  { id: 'Sales', icon: 'bag' },
  { id: 'Catalogue', icon: 'flower' },
  { id: 'Marketing', icon: 'tag' },
  { id: 'System', icon: 'cog' },
]
export const ADMIN_ROUTES = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', perm: 'dashboard:view', group: 'Overview' },
  { id: 'orders', label: 'Orders', icon: 'bag', perm: 'orders:view', group: 'Sales', views: [['All orders', ''], ['New', 'status=new'], ['Confirmed', 'status=confirmed'], ['Preparing', 'status=preparing'], ['Out for delivery', 'status=dispatched'], ['Delivered', 'status=delivered'], ['Cancelled', 'status=cancelled']] },
  { id: 'enquiries', label: 'Enquiries', icon: 'chat', perm: 'enquiries:view', group: 'Sales', views: [['All', ''], ['New', 'status=new'], ['Quoted', 'status=quoted'], ['Won', 'status=won'], ['Closed', 'status=closed']] },
  { id: 'customers', label: 'Customers', icon: 'users', perm: 'customers:view', group: 'Sales', views: [['All', ''], ['Repeat customers', 'repeat=repeat'], ['First-time', 'repeat=first']] },
  { id: 'products', label: 'Bouquets', icon: 'flower', perm: 'products:view', group: 'Catalogue', views: [['All', ''], ['Visible', 'vis=on'], ['Hidden', 'vis=off'], ['Low stock', 'stockf=low'], ['Out of stock', 'stockf=out']] },
  { id: 'items', label: 'Made to order', icon: 'yarn', perm: 'items:view', group: 'Catalogue', views: [['All', ''], ['Single stems', 'collection=stems'], ['Plushies', 'collection=plushies'], ['Wear', 'collection=wear'], ['Little things', 'collection=little']] },
  { id: 'inventory', label: 'Inventory', icon: 'box', perm: 'inventory:view', group: 'Catalogue', views: [['All', ''], ['Low', 'st=low'], ['Out of stock', 'st=out'], ['Well stocked', 'st=ok']] },
  { id: 'bom', label: 'Recipes (BOM)', icon: 'clipboard', perm: 'bom:view', group: 'Catalogue', views: [['All recipes', ''], ['No recipe yet', 'state=none'], ['Thin margin', 'state=thin'], ['Loss-making', 'state=loss'], ['Healthy', 'state=healthy']] },
  { id: 'materials', label: 'Materials', icon: 'layers', perm: 'materials:view', group: 'Catalogue', views: [['All', ''], ['Low', 'state=low'], ['Out', 'state=out'], ['Yarn', 'kind=yarn'], ['Wire', 'kind=wire'], ['Wrapping', 'kind=wrap'], ['Ribbon', 'kind=ribbon'], ['Packaging', 'kind=packaging']] },
  { id: 'production', label: 'Make list', icon: 'truck', perm: 'production:view', group: 'Catalogue', views: [['All materials needed', ''], ['Short only', 'short=yes']] },
  { id: 'promos', label: 'Promotions', icon: 'tag', perm: 'promos:view', group: 'Marketing' },
  { id: 'activity', label: 'Activity', icon: 'clock', perm: 'activity:view', group: 'System' },
  { id: 'settings', label: 'Settings', icon: 'cog', perm: 'settings:view', group: 'System' },
]
