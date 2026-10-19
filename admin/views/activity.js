import { C, dates } from '../core.js'
import { html, raw, esc } from '../library/utils/html.js'
import { createTable } from '../library/hooks/use-table.js'
import { mountDataTable } from '../library/components/patterns/data-table.js'
import { pageHeader } from '../library/components/common/page-header.js'

export function activity() {
  return {
    html: html`${raw(pageHeader({ title: 'Activity', subtitle: 'Who changed what, newest first. Keeps the last 300 entries.' }))}<div id="dt"></div>`,
    mount(el) {
      const table = createTable({ rows: C.activity.all(), searchKeys: ['by', 'action', 'target'], pageSize: 25, defaultSort: { key: 'at', dir: 'desc' } })
      const un = C.activity.subscribe((rows) => table.setRows(rows))
      mountDataTable(el.querySelector('#dt'), { table, searchPlaceholder: 'Search the log',
        columns: [{ key: 'at', label: 'When', sortable: true, render: (r) => `<span class="admin-num" title="${esc(dates.dateTime(r.at))}">${esc(dates.ago(r.at))}</span>` }, { key: 'by', label: 'Who', sortable: true, render: (r) => esc(String(r.by).split('@')[0]) }, { key: 'action', label: 'What', sortable: true }, { key: 'target', label: 'On' }],
        empty: { title: 'Nothing logged yet', body: 'Changes you make in the admin appear here.' } })
      return un
    },
  }
}
