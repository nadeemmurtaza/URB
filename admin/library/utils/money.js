/**
 * Money formatting from locale config (config/brand `locale`): no currency or locale literal lives here.
 * createMoney({ currency, intlTag, minorUnits, display }) -> { format, parse, compact }   display: 'code' (PKR 1,200) | 'symbol' (Rs 1,200)
 * Amounts are whole major units (e.g. rupees) unless minorUnits > 0 and `minor: true` is passed.
 */
export function createMoney({ currency, intlTag = 'en-US', minorUnits = 0, display = 'code' }) {
  const nf = (digits) => new Intl.NumberFormat(intlTag, { style: 'currency', currency, currencyDisplay: display, minimumFractionDigits: digits, maximumFractionDigits: digits })
  const whole = nf(0), fine = nf(minorUnits)
  return {
    format(n, { minor = false } = {}) {
      const v = minor && minorUnits ? n / 10 ** minorUnits : n
      return (minorUnits && !Number.isInteger(v) ? fine : whole).format(v).replace(/ /g, ' ')
    },
    parse(s) { const v = parseFloat(String(s).replace(/[^\d.-]/g, '')); return Number.isFinite(v) ? v : 0 },
    compact(n) { return new Intl.NumberFormat(intlTag, { notation: 'compact', maximumFractionDigits: 1 }).format(n) },
  }
}
