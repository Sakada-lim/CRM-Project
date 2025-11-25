import { useCollectionFilters } from './useCollectionFilters'

export function useCustomerFilters({
  customers,
  searchQuery,
  activeFilters,
  filterPredicates = {},
  itemsPerPage = 10,
}) {
  const customerSearchComparator = (customer, _term, tokens) => {
    if (!tokens?.length) {
      return true
    }

    const haystack = [
      customer?.name,
      customer?.email,
      customer?.phone,
      customer?.channel,
      customer?.category,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return tokens.every((token) => haystack.includes(token))
  }

  const rangeLabelFormatter = ({ start, end, total, isFiltered }) => {
    if (!total) {
      return isFiltered ? 'No matches' : '0 results'
    }

    const baseLabel = `${start}-${end} of ${total}`
    return isFiltered ? `${baseLabel} • filtered` : baseLabel
  }

  const {
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
  } = useCollectionFilters({
    collection: customers,
    searchQuery,
    activeFilters,
    filterPredicates,
    itemsPerPage,
    searchComparator: customerSearchComparator,
    rangeLabelFormatter,
  })

  return {
    page,
    currentPage,
    pageCount,
    paginatedCustomers: paginatedItems,
    filteredCustomers: filteredItems,
    normalizedSearch,
    searchTokens,
    hasSearchTokens,
    hasActiveFilters,
    isFilteredView,
    rangeLabel,
    pageSize,
  }
}
