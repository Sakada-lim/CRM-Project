import { computed, isRef, ref, unref, watch } from 'vue'

export function useCollectionFilters({
  collection,
  searchQuery,
  activeFilters,
  filterPredicates = {},
  itemsPerPage = 10,
  searchComparator,
  additionalCriteria,
  additionalPredicate,
  isCriteriaActive,
  rangeLabelFormatter,
}) {
  const page = ref(1)
  const pageSize = computed(() => {
    const size = Number(unref(itemsPerPage)) || 1
    return Math.max(1, size)
  })

  const normalizedSearch = computed(() => (searchQuery?.value || '').trim().toLowerCase())

  const searchTokens = computed(() =>
    normalizedSearch.value
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean),
  )

  const filtersRef = computed(() => unref(activeFilters) ?? [])
  const hasActiveFilters = computed(() => filtersRef.value.length > 0)

  const criteriaValue = computed(() => unref(additionalCriteria))
  const hasAdditionalCriteria = computed(() => {
    if (typeof isCriteriaActive === 'function') {
      return Boolean(isCriteriaActive(criteriaValue.value))
    }
    return false
  })

  const hasSearchTokens = computed(() => searchTokens.value.length > 0)
  const isFilteredView = computed(
    () => hasSearchTokens.value || hasActiveFilters.value || hasAdditionalCriteria.value,
  )

  const resolvedComparator =
    typeof searchComparator === 'function'
      ? searchComparator
      : (item, term) => {
          if (!term) {
            return true
          }
          const haystack = JSON.stringify(item ?? {}).toLowerCase()
          return haystack.includes(term)
        }

  const groupedFilters = computed(() => {
    if (!hasActiveFilters.value) {
      return null
    }
    return filtersRef.value.reduce((acc, filter) => {
      if (!filter?.key) {
        return acc
      }
      acc[filter.key] = acc[filter.key] || []
      acc[filter.key].push(filter)
      return acc
    }, {})
  })

  const filteredItems = computed(() => {
    const source = unref(collection) ?? []
    const groups = groupedFilters.value

    return source.filter((item) => {
      const matchesSearch = resolvedComparator(item, normalizedSearch.value, searchTokens.value)
      if (!matchesSearch) {
        return false
      }

      const matchesCriteria =
        typeof additionalPredicate !== 'function'
          ? true
          : additionalPredicate(item, criteriaValue.value)
      if (!matchesCriteria) {
        return false
      }

      if (!groups) {
        return true
      }

      return Object.entries(groups).every(([key, group]) => {
        const predicate = filterPredicates[key]
        if (typeof predicate !== 'function') {
          return true
        }

        const positiveFilters = group.filter((filter) => filter.operator !== 'is_not')
        const negativeFilters = group.filter((filter) => filter.operator === 'is_not')

        const matchesPositives =
          !positiveFilters.length || positiveFilters.some((filter) => predicate(item, filter))

        const matchesNegatives =
          !negativeFilters.length || negativeFilters.every((filter) => predicate(item, filter))

        return matchesPositives && matchesNegatives
      })
    })
  })

  const pageCount = computed(() => {
    const total = filteredItems.value.length
    return Math.max(1, Math.ceil(total / pageSize.value) || 1)
  })

  const currentPage = computed({
    get() {
      const current = page.value
      return Math.min(Math.max(current, 1), pageCount.value)
    },
    set(value) {
      const parsed = Number(value) || 1
      page.value = Math.min(Math.max(parsed, 1), pageCount.value)
    },
  })

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredItems.value.slice(start, start + pageSize.value)
  })

  const defaultRangeLabelFormatter = ({ start, end, total, isFiltered }) => {
    if (!total) {
      return isFiltered ? 'No matches' : '0 results'
    }
    return `${start}-${end} of ${total}`
  }

  const resolvedRangeLabelFormatter =
    typeof rangeLabelFormatter === 'function' ? rangeLabelFormatter : defaultRangeLabelFormatter

  const rangeLabel = computed(() => {
    const total = filteredItems.value.length
    const start = total ? (currentPage.value - 1) * pageSize.value + 1 : 0
    const end = total ? Math.min(currentPage.value * pageSize.value, total) : 0
    return resolvedRangeLabelFormatter({
      start,
      end,
      total,
      isFiltered: isFilteredView.value,
    })
  })

  watch(
    () => filteredItems.value.length,
    () => {
      if (page.value > pageCount.value) {
        page.value = pageCount.value
      }
    },
  )

  watch(
    () => normalizedSearch.value,
    () => {
      page.value = 1
    },
  )

  watch(
    filtersRef,
    () => {
      page.value = 1
    },
    { deep: true },
  )

  if (additionalCriteria && isRef(additionalCriteria)) {
    watch(
      () => additionalCriteria.value,
      () => {
        page.value = 1
      },
      { deep: true },
    )
  }

  watch(
    () => pageSize.value,
    () => {
      page.value = 1
    },
  )

  return {
    page,
    pageSize,
    currentPage,
    pageCount,
    filteredItems,
    paginatedItems,
    rangeLabel,
    normalizedSearch,
    searchTokens,
    hasSearchTokens,
    hasActiveFilters,
    isFilteredView,
  }
}
