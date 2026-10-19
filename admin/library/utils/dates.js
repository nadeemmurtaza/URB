/** Date helpers bound to a locale tag and timezone from config. createDates({ intlTag, timezone }) */
export function createDates({ intlTag = 'en-US', timezone } = {}) {
  const tz = timezone ? { timeZone: timezone } : {}
  const fmt = (o) => new Intl.DateTimeFormat(intlTag, { ...tz, ...o })
  const day = fmt({ day: 'numeric', month: 'short', year: 'numeric' })
  const short = fmt({ day: 'numeric', month: 'short' })
  const time = fmt({ hour: 'numeric', minute: '2-digit' })
  const rtf = new Intl.RelativeTimeFormat(intlTag, { numeric: 'auto' })
  const d = (v) => (v instanceof Date ? v : new Date(v))
  return {
    day: (v) => day.format(d(v)),
    short: (v) => short.format(d(v)),
    time: (v) => time.format(d(v)),
    dateTime: (v) => `${day.format(d(v))}, ${time.format(d(v))}`,
    iso: (v) => d(v).toISOString().slice(0, 10),
    ago(v) {
      const s = Math.round((d(v).getTime() - Date.now()) / 1000), a = Math.abs(s)
      if (a < 60) return rtf.format(s, 'second')
      if (a < 3600) return rtf.format(Math.round(s / 60), 'minute')
      if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour')
      return rtf.format(Math.round(s / 86400), 'day')
    },
    startOfDay: (v) => { const x = new Date(d(v)); x.setHours(0, 0, 0, 0); return x },
    addDays: (v, n) => { const x = new Date(d(v)); x.setDate(x.getDate() + n); return x },
    sameDay: (a, b) => d(a).toDateString() === d(b).toDateString(),
  }
}
