import { computed, ref, unref, watch } from 'vue'

export function useCustomerFilters({
  customers,
  searchQuery,
  activeFilters,
  filterPredicates = {},
  itemsPerPage = 10,
}) {
  const page = ref(1)
  const pageSize = computed(() => {
    const size = Number(unref(itemsPerPage)) || 10
    return Math.max(1, size)
  })

  const normalizedSearch = computed(() => (searchQuery?.value || '').trim().toLowerCase())

  const searchTokens = computed(() =>
    normalizedSearch.value
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean),
  )

  const hasSearchTokens = computed(() => searchTokens.value.length > 0)
  const hasActiveFilters = computed(() => (activeFilters?.value?.length ?? 0) > 0)
  const isFilteredView = computed(() => hasSearchTokens.value || hasActiveFilters.value)

  const filteredCustomers = computed(() => {
    const source = customers?.value ?? []
    if (!hasSearchTokens.value && !hasActiveFilters.value) {
      return source
    }

    return source.filter((customer) => {
      const haystack = [
        customer.name,
        customer.email,
        customer.phone,
        customer.channel,
        customer.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !hasSearchTokens.value || searchTokens.value.every((token) => haystack.includes(token))

      const matchesFilters =
        !hasActiveFilters.value ||
        activeFilters.value.every((filter) => {
          const predicate = filterPredicates[filter.key]
          if (typeof predicate !== 'function') {
            return true
          }
          return predicate(customer, filter)
        })

      return matchesSearch && matchesFilters
    })
  })

  const pageCount = computed(() =>
    Math.max(1, Math.ceil(filteredCustomers.value.length / pageSize.value) || 1),
  )

  const currentPage = computed({
    get() {
      return Math.min(Math.max(page.value, 1), pageCount.value)
    },
    set(value) {
      const parsed = Number(value) || 1
      page.value = Math.min(Math.max(parsed, 1), pageCount.value)
    },
  })

  const paginatedCustomers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredCustomers.value.slice(start, start + pageSize.value)
  })

  const rangeLabel = computed(() => {
    const total = filteredCustomers.value.length
    if (!total) {
      return isFilteredView.value ? 'No matches' : '0 results'
    }

    const start = (currentPage.value - 1) * pageSize.value + 1
    const end = Math.min(currentPage.value * pageSize.value, total)
    const baseLabel = `${start}-${end} of ${total}`
    return isFilteredView.value ? `${baseLabel} • filtered` : baseLabel
  })

  watch(
    () => filteredCustomers.value.length,
    () => {
      if (page.value > pageCount.value) {
        page.value = pageCount.value
      }
    },
  )

  watch(
    () => searchQuery?.value,
    () => {
      page.value = 1
    },
  )

  watch(
    () => activeFilters?.value,
    () => {
      page.value = 1
    },
    { deep: true },
  )

  watch(
    () => pageSize.value,
    () => {
      page.value = 1
    },
  )

  return {
    page,
    currentPage,
    pageCount,
    paginatedCustomers,
    filteredCustomers,
    normalizedSearch,
    searchTokens,
    hasSearchTokens,
    hasActiveFilters,
    isFilteredView,
    rangeLabel,
    pageSize,
  }
}
