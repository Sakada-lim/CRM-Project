import { useCollectionFilters } from './useCollectionFilters'

export function usePropertyFilters({
  properties,
  searchQuery,
  activeFilters,
  filterPredicates = {},
  itemsPerPage = 4,
  criteria,
  criteriaPredicate,
  criteriaIsActive,
}) {
  const propertySearchComparator = (property, term) => {
    if (!term) {
      return true
    }

    const haystack = [property?.address, property?.suburb, property?.state, property?.type]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  }

  const rangeLabelFormatter = ({ start, end, total }) => {
    if (!total) {
      return 'No properties found'
    }
    return `Showing ${start}-${end} of ${total}`
  }

  const { page, pageSize, currentPage, pageCount, filteredItems, paginatedItems, rangeLabel } =
    useCollectionFilters({
      collection: properties,
      searchQuery,
      activeFilters,
      filterPredicates,
      itemsPerPage,
      searchComparator: propertySearchComparator,
      additionalCriteria: criteria,
      additionalPredicate: criteriaPredicate,
      isCriteriaActive: criteriaIsActive,
      rangeLabelFormatter,
    })

  return {
    page,
    pageSize,
    currentPage,
    pageCount,
    filteredProperties: filteredItems,
    paginatedProperties: paginatedItems,
    paginationLabel: rangeLabel,
  }
}
