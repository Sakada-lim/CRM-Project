import { computed, unref } from 'vue'
import { bucketCustomersForWeek } from '../utils/followUp'

// `weekOffset` may be a ref (or plain number) — 0 = current rolling week,
// 1 = next 7-day chunk, -1 = previous 7-day chunk, etc.
export function useCustomerFollowups(customers, weekOffset = 0) {
  const buckets = computed(() =>
    bucketCustomersForWeek(customers.value, new Date(), unref(weekOffset)),
  )

  const overdue = computed(() => buckets.value.overdue)
  const unscheduled = computed(() => buckets.value.unscheduled)
  const days = computed(() => buckets.value.days)

  const overdueCount = computed(() => overdue.value.length)
  const unscheduledCount = computed(() => unscheduled.value.length)

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
