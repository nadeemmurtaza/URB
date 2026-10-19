/** CSV export. toCsv(rows, columns) with columns [{ key, label, value?(row) }]; downloadCsv triggers a browser download. */
const cell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
export function toCsv(rows, columns) {
  const head = columns.map((c) => cell(c.label ?? c.key)).join(',')
  const body = rows.map((r) => columns.map((c) => cell(c.value ? c.value(r) : r[c.key])).join(','))
  return [head, ...body].join('\n')
}
export function downloadCsv(filename, rows, columns) {
  const blob = new Blob(['﻿' + toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
