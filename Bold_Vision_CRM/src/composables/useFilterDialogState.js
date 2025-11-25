import { computed, reactive, watch } from 'vue'

/**
 * Shared dialog state helper for filter modals.
 * Handles v-model wiring plus syncing incoming criteria into a reactive draft object.
 */
export function useFilterDialogState({ props, emit, createEmptyDraft, mapCriteriaToDraft }) {
  if (typeof createEmptyDraft !== 'function') {
    throw new Error('useFilterDialogState requires a createEmptyDraft function')
  }

  const normalizeCriteria = mapCriteriaToDraft || ((criteria = {}) => ({ ...criteria }))

  const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
  })

  const draft = reactive(createEmptyDraft())

  function assignDraftValues(values) {
    const keys = new Set([...Object.keys(draft), ...Object.keys(values)])
    keys.forEach((key) => {
      draft[key] = values[key]
    })
  }

  function syncDraft(criteria = {}) {
    const mapped = normalizeCriteria(criteria)
    assignDraftValues(mapped)
  }

  function resetDraft() {
    assignDraftValues(createEmptyDraft())
  }

  watch(
    () => props.criteria,
    (next) => {
      syncDraft(next || {})
    },
    { immediate: true, deep: true },
  )

  function close() {
    isOpen.value = false
  }

  return {
    draft,
    isOpen,
    close,
    resetDraft,
    syncDraft,
  }
}
