import { computed } from 'vue'
import { daysOverdue, needsAttention, isOverdue } from '../utils/followUp'

export function useCustomerFollowups(customers) {
  function groupForCategory(category) {
    return computed(() =>
      customers.value
        .filter((c) => c.category === category && needsAttention(c))
        .sort((a, b) => {
          const da = daysOverdue(a)
          const db = daysOverdue(b)
          if (da === Infinity) return -1
          if (db === Infinity) return 1
          return db - da
        }),
    )
  }

  const hot = groupForCategory('Hot')
  const warm = groupForCategory('Warm')
  const cold = groupForCategory('Cold')

  const overdueCount = computed(
    () =>
      [...hot.value, ...warm.value, ...cold.value].filter((c) => isOverdue(c)).length,
  )

  const hotOverdueCount = computed(() => hot.value.filter((c) => isOverdue(c)).length)
  const warmOverdueCount = computed(() => warm.value.filter((c) => isOverdue(c)).length)
  const coldOverdueCount = computed(() => cold.value.filter((c) => isOverdue(c)).length)

  return { hot, warm, cold, overdueCount, hotOverdueCount, warmOverdueCount, coldOverdueCount }
}
