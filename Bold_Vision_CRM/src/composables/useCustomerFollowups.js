import { computed } from 'vue'
import { bucketCustomersForWeek } from '../utils/followUp'

export function useCustomerFollowups(customers) {
  const buckets = computed(() => bucketCustomersForWeek(customers.value))

  const overdue = computed(() => buckets.value.overdue)
  const unscheduled = computed(() => buckets.value.unscheduled)
  const days = computed(() => buckets.value.days)

  const overdueCount = computed(() => overdue.value.length)
  const unscheduledCount = computed(() => unscheduled.value.length)

  // Total needing attention this week (overdue + unscheduled + today's column)
  const needsAttentionCount = computed(
    () => overdue.value.length + unscheduled.value.length,
  )

  return {
    overdue,
    unscheduled,
    days,
    overdueCount,
    unscheduledCount,
    needsAttentionCount,
  }
}
