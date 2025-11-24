import { computed, ref, unref, watch } from 'vue'

export function usePropertyFilters({
  properties,
  searchQuery,
  activeFilters,
  filterPredicates = {},
  itemsPerPage = 4,
}) {
  const page = ref(1)
  const pageSize = computed(() => {
    const size = Number(unref(itemsPerPage)) || 1
    return Math.max(1, size)
  })

  const normalizedSearch = computed(() => (searchQuery?.value || '').trim().toLowerCase())

  const filteredProperties = computed(() => {
    const source = properties?.value ?? []
    const filters = activeFilters?.value ?? []
    const term = normalizedSearch.value

    return source.filter((property) => {
      const haystack = [property.address, property.suburb, property.state, property.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = !term || haystack.includes(term)
      if (!matchesSearch) {
        return false
      }

      if (!filters.length) {
        return true
      }

      return filters.every((filter) => {
        const predicate = filterPredicates[filter.key]
        if (typeof predicate !== 'function') {
          return true
        }
        return predicate(property, filter)
      })
    })
  })

  const pageCount = computed(() => {
    const total = filteredProperties.value.length
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

  const paginatedProperties = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredProperties.value.slice(start, start + pageSize.value)
  })

  const paginationLabel = computed(() => {
    const total = filteredProperties.value.length
    if (!total) {
      return 'No properties found'
    }

    const start = (currentPage.value - 1) * pageSize.value + 1
    const end = Math.min(currentPage.value * pageSize.value, total)
    return `Showing ${start}-${end} of ${total}`
  })

  watch(
    () => filteredProperties.value.length,
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
    pageSize,
    currentPage,
    pageCount,
    filteredProperties,
    paginatedProperties,
    paginationLabel,
  }
}
