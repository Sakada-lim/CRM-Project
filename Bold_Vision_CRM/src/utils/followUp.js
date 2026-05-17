// Cadence defaults — single source of truth.
// Change values here to adjust all quick-pick buttons across the app.
export const CADENCE_MONTHS = { Hot: 3, Warm: 6, Cold: 12 }

export function cadenceMonths(category) {
  return CADENCE_MONTHS[category] ?? CADENCE_MONTHS.Cold
}

export function cadenceLabel(category) {
  const m = cadenceMonths(category)
  return `+${m} month${m === 1 ? '' : 's'}`
}

// ── Status ─────────────────────────────────────────────────────────────────

// Returns one of: 'never-contacted' | 'unscheduled' | 'overdue' | 'approaching' | 'up-to-date'
export function customerStatus(customer, today = new Date()) {
  if (!customer.nextContactAt) {
    return customer.lastContactedAt ? 'unscheduled' : 'never-contacted'
  }
  const next = new Date(customer.nextContactAt)
  const diffDays = Math.ceil((next - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 30) return 'approaching'
  return 'up-to-date'
}

// Days until next contact (negative = past due). null if no schedule set.
export function daysUntilContact(customer, today = new Date()) {
  if (!customer.nextContactAt) return null
  const next = new Date(customer.nextContactAt)
  return Math.ceil((next - today) / (1000 * 60 * 60 * 24))
}

export function isOverdue(customer, today = new Date()) {
  return customerStatus(customer, today) === 'overdue'
}

export function needsAttention(customer, today = new Date()) {
  const s = customerStatus(customer, today)
  return s !== 'up-to-date'
}

// ── Week bucketing ──────────────────────────────────────────────────────────

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// Returns array of 7 Date objects starting from `start` (for Kanban column
// headers). Defaults to today; pass a non-today date to render a shifted
// week (e.g. the result of today + 7 days for next-week navigation).
export function weekDays(start = new Date()) {
  const base = startOfDay(start)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    return d
  })
}

// Buckets customers into { overdue, unscheduled, days } for the Kanban.
//
// `today` is the real-world today, used for the "overdue" bucket.
// `viewStart` is the first day of the 7-column view; defaults to today.
//
// `weekOffset` shorthand: pass an integer N to view N×7 days into the
// future (or past, if negative). Customers with next_contact_at outside
// the [viewStart, viewStart+7) window are not shown — except those
// genuinely before `today`, which go to overdue.
export function bucketCustomersForWeek(customers, today = new Date(), weekOffset = 0) {
  const todayStart = startOfDay(today)
  const viewStart = new Date(todayStart)
  viewStart.setDate(viewStart.getDate() + weekOffset * 7)
  const viewEnd = new Date(viewStart)
  viewEnd.setDate(viewEnd.getDate() + 7)

  const overdue = []
  const unscheduled = []
  const days = weekDays(viewStart).map((date) => ({ date, customers: [] }))

  for (const c of customers) {
    if (!c.nextContactAt) {
      unscheduled.push(c)
      continue
    }
    const next = new Date(c.nextContactAt)
    if (next < todayStart) {
      overdue.push(c)
    } else if (next >= viewStart && next < viewEnd) {
      const bucket = days.find((d) => isSameDay(d.date, next))
      if (bucket) bucket.customers.push(c)
    }
    // Outside the window — hidden until the user navigates to its week
  }

  // Overdue: longest overdue first (oldest next_contact_at first)
  overdue.sort((a, b) => new Date(a.nextContactAt) - new Date(b.nextContactAt))
  // Each day bucket: earliest appointment first
  for (const d of days) {
    d.customers.sort((a, b) => new Date(a.nextContactAt) - new Date(b.nextContactAt))
  }

  return { overdue, unscheduled, days }
}
