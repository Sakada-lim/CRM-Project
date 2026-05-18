// Keystroke-level input filters. Used on @keydown to block invalid characters
// before they appear in the field — gives the agent immediate feedback rather
// than a delayed validation error. Each helper also exposes a `sanitize()`
// counterpart for paste / autofill paths.
//
// Pattern:
//   <input @keydown="currencyKeydown" @input="onCurrencyInput($event, update)" />
//
// where `update` is the model setter (e.g. `(v) => patch('client1', { rentAmount: v })`).

// ── Currency: digits, decimal point, comma, dollar sign, space, k/m suffix ──

const CURRENCY_ALLOWED = /^[0-9.,$ kmKM]$/

// Allow navigation keys + ctrl/cmd combos to pass through (copy/paste/select-all).
const PASSTHROUGH = new Set([
  'Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'Home', 'End',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
])

export function currencyKeydown(e) {
  if (PASSTHROUGH.has(e.key)) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key.length !== 1) return  // function keys, etc.
  if (!CURRENCY_ALLOWED.test(e.key)) e.preventDefault()
}

export function currencySanitize(value) {
  return String(value ?? '').replace(/[^0-9.,$ kmKM]/g, '')
}

// ── Integer: digits only ────────────────────────────────────────────────────

const INT_ALLOWED = /^[0-9]$/

export function integerKeydown(e) {
  if (PASSTHROUGH.has(e.key)) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key.length !== 1) return
  if (!INT_ALLOWED.test(e.key)) e.preventDefault()
}

export function integerSanitize(value) {
  return String(value ?? '').replace(/\D/g, '')
}

// ── Decimal: digits + at most one decimal point ─────────────────────────────

export function decimalKeydown(e) {
  if (PASSTHROUGH.has(e.key)) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key.length !== 1) return
  // Only digits and a single dot (already present? block another)
  if (e.key === '.') {
    if (String(e.target.value || '').includes('.')) e.preventDefault()
    return
  }
  if (!/^[0-9]$/.test(e.key)) e.preventDefault()
}

export function decimalSanitize(value) {
  const s = String(value ?? '').replace(/[^0-9.]/g, '')
  const firstDot = s.indexOf('.')
  if (firstDot === -1) return s
  return s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '')
}

// ── Date-ish text (MM/YYYY) — digits and slash only ─────────────────────────

const DATE_PARTIAL = /^[0-9/]$/

export function dateTextKeydown(e) {
  if (PASSTHROUGH.has(e.key)) return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key.length !== 1) return
  if (!DATE_PARTIAL.test(e.key)) e.preventDefault()
}

export function dateTextSanitize(value) {
  return String(value ?? '').replace(/[^0-9/]/g, '')
}
