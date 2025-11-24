import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export function useResponsivePageSize(options = {}) {
  const {
    breakpoints = [
      { minWidth: 1600, size: 12 },
      { minWidth: 1200, size: 9 },
      { minWidth: 900, size: 6 },
      { minWidth: 0, size: 4 },
    ],
    fallbackSize = 4,
    initialWidth = typeof window !== 'undefined' ? window.innerWidth : 1280,
  } = options

  const sortedBreakpoints = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth)
  const windowWidth = ref(initialWidth)

  function updateWidth() {
    if (typeof window === 'undefined') return
    windowWidth.value = window.innerWidth
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('resize', updateWidth)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('resize', updateWidth)
  })

  const pageSize = computed(() => {
    const matched = sortedBreakpoints.find((bp) => windowWidth.value >= bp.minWidth)
    return matched?.size ?? fallbackSize
  })

  return {
    windowWidth,
    pageSize,
  }
}
