// Shared display formatters. Use these instead of ad-hoc string templates so
// every price / size renders the same way across cards, detail views, and broadcasts.

const AUD = '$'

// Format a single numeric price as $1.5M / $850K / $500.
// Returns '' for null/undefined/NaN.
export function formatPriceSingle(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    const str = Number.isInteger(m) ? `${m}` : trimZeros(m.toFixed(2))
    return `${AUD}${str}M`
  }
  if (n >= 1_000) {
    const k = n / 1_000
    const str = Number.isInteger(k) ? `${k}` : trimZeros(k.toFixed(1))
    return `${AUD}${str}K`
  }
  return `${AUD}${n.toLocaleString('en-AU')}`
}

// Format min + optional max. Single price when max is null/equal, range otherwise.
export function formatPrice(min, max) {
  const a = formatPriceSingle(min)
  const b = formatPriceSingle(max)
  if (!a && !b) return ''
  if (!b || min === max) return a
  if (!a) return b
  return `${a} – ${b}`
}

// Parse flexible user input ("1m", "1.5M", "850k", "$1,000,000", "1000000")
// into a number. Returns null when unparseable.
export function parsePriceInput(raw) {
  if (raw == null) return null
  const cleaned = String(raw).trim().replace(/[$,\s]/g, '').toLowerCase()
  if (!cleaned) return null
  const m = cleaned.match(/^(\d+(?:\.\d+)?)([mk]?)$/)
  if (!m) return null
  const num = parseFloat(m[1])
  if (m[2] === 'm') return Math.round(num * 1_000_000)
  if (m[2] === 'k') return Math.round(num * 1_000)
  return Math.round(num)
}

// Parse an existing display string like "$1.5M – $1.6M" or "850k-900k" back
// into { min, max }. Used when editing legacy free-text price guides.
export function parsePriceGuideString(text) {
  if (!text) return { min: null, max: null }
  const matches = [...String(text).matchAll(/(\d+(?:[.,]\d+)?)\s*([mk]?)/gi)]
  if (matches.length === 0) return { min: null, max: null }
  const values = matches.map((m) => {
    const num = parseFloat(m[1].replace(/,/g, ''))
    const unit = m[2].toLowerCase()
    if (unit === 'm') return Math.round(num * 1_000_000)
    if (unit === 'k') return Math.round(num * 1_000)
    return Math.round(num)
  })
  if (values.length === 1) return { min: values[0], max: null }
  return { min: Math.min(values[0], values[1]), max: Math.max(values[0], values[1]) }
}

// Format a sqm value as "1,200 m²". Returns '' for null/0/NaN.
export function formatSqm(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return ''
  return `${n.toLocaleString('en-AU')} m²`
}

function trimZeros(str) {
  return str.replace(/\.?0+$/, '')
}
