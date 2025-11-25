import { computed } from 'vue'

/**
 * Keeps manual filters (from BaseFilterBar) and derived advanced chips in sync.
 * Callers provide a ref holding manual filters plus builders/clearers for advanced chips.
 */
export function useFilterChips({
  manualFilters,
  buildAdvancedChips = () => [],
  clearAdvancedChip,
}) {
  if (!manualFilters) {
    throw new Error('useFilterChips requires a manualFilters ref')
  }

  const safeBuildAdvanced = () => {
    const chips = buildAdvancedChips?.() ?? []
    return Array.isArray(chips) ? chips.filter(Boolean) : []
  }

  const advancedChips = computed(safeBuildAdvanced)

  const toolbarFilters = computed({
    get() {
      const manual = Array.isArray(manualFilters.value)
        ? manualFilters.value.filter((chip) => chip?.meta?.source !== 'advanced')
        : []
      return [...manual, ...advancedChips.value]
    },
    set(nextFilters) {
      const manualNext = nextFilters.filter((chip) => chip?.meta?.source !== 'advanced')
      manualFilters.value = manualNext

      if (!clearAdvancedChip) {
        return
      }

      const nextAdvancedIds = new Set(
        nextFilters.filter((chip) => chip?.meta?.source === 'advanced').map((chip) => chip.id),
      )

      advancedChips.value.forEach((chip) => {
        if (!nextAdvancedIds.has(chip.id) && chip.meta?.field) {
          clearAdvancedChip(chip.meta.field, chip)
        }
      })
    },
  })

  return {
    toolbarFilters,
    advancedChips,
  }
}
