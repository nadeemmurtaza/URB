import { esc } from '../../utils/html.js'
/** pageHeader({ title, subtitle, actions: htmlString }) */
export const pageHeader = ({ title, subtitle = '', actions = '' }) =>
  `<header class="admin-pagehead"><div><h1 class="admin-pagehead__title">${esc(title)}</h1>${subtitle ? `<p class="admin-pagehead__sub">${esc(subtitle)}</p>` : ''}</div>${actions ? `<div class="admin-pagehead__actions">${actions}</div>` : ''}</header>`
export const emptyState = ({ title, body = '', action = '' }) =>
  `<div class="admin-empty"><h3>${esc(title)}</h3>${body ? `<p>${esc(body)}</p>` : ''}${action}</div>`
