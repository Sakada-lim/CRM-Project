const CADENCE_MONTHS = { Hot: 3, Warm: 6, Cold: 12 }

export function cadenceMonths(category) {
  return CADENCE_MONTHS[category] ?? 12
}

export function cadenceLabel(category) {
  const months = cadenceMonths(category)
  return `Every ${months} months (${category})`
}

// Positive = days past due. Infinity = never contacted. Negative = days until due.
export function daysOverdue(customer, today = new Date()) {
  if (!customer.lastContactedAt) return Infinity
  const lastContacted = new Date(customer.lastContactedAt)
  const dueDate = new Date(lastContacted)
  dueDate.setMonth(dueDate.getMonth() + cadenceMonths(customer.category))
  const diffMs = today - dueDate
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function isOverdue(customer, today = new Date()) {
  const days = daysOverdue(customer, today)
  return days === Infinity || days >= 0
}

// Needs attention: overdue OR within 30 days of due date
export function needsAttention(customer, today = new Date()) {
  const days = daysOverdue(customer, today)
  return days === Infinity || days >= -30
}
