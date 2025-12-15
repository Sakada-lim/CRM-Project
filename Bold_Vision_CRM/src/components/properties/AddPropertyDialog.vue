<template>
  <v-dialog
    v-model="isOpen"
    :max-width="640"
    transition="dialog-transition"
    :scrim="'rgba(15,23,42,0.65)'"
  >
    <v-card class="filter-dialog-card add-property-dialog">
      <header class="dialog-header">
        <h2 class="dialog-title">Add Property</h2>
        <v-btn icon variant="text" density="comfortable" class="dialog-close" @click="close">
          <v-icon icon="mdi-close" size="20" />
        </v-btn>
      </header>

      <div class="dialog-body" tabindex="-1">
        <PropertyForm v-model="draft" />
      </div>

      <footer class="dialog-footer">
        <v-spacer />
        <v-btn variant="text" class="text-capitalize" @click="close">Cancel</v-btn>
        <v-btn color="primary" class="text-capitalize" @click="handleConfirm">Add property</v-btn>
      </footer>
    </v-card>
  </v-dialog>
</template>

<script setup>
import PropertyForm from './PropertiesForm.vue'
import { useFilterDialogState } from '../../composables/useFilterDialogState'
import { createEmptyPropertyDraft } from '../../constants/propertyDefaults'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  model: {
    type: Object,
    default: () => createEmptyPropertyDraft(),
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { draft, isOpen, close } = useFilterDialogState({
  props,
  emit,
  // reusing dialog state helper for consistent open/close behavior
  createEmptyDraft: () => createEmptyPropertyDraft(),
  mapCriteriaToDraft: (data = {}) => {
    const base = createEmptyPropertyDraft()
    return {
      ...base,
      ...data,
      gallery: Array.isArray(data?.gallery) ? [...data.gallery] : [...base.gallery],
      highlights: Array.isArray(data?.highlights) ? [...data.highlights] : [...base.highlights],
      amenities: Array.isArray(data?.amenities) ? [...data.amenities] : [...base.amenities],
    }
  },
})

function handleConfirm() {
  emit('confirm', {
    ...draft,
    gallery: Array.isArray(draft.gallery) ? [...draft.gallery] : [],
    highlights: Array.isArray(draft.highlights) ? [...draft.highlights] : [],
    amenities: Array.isArray(draft.amenities) ? [...draft.amenities] : [],
  })
}
</script>

<style scoped src="../../assets/styles/components/filterDialog.css">
</style>

<style scoped>
/* Scoped, component-specific override. Using wrapper class for specificity. */
:deep(.add-property-dialog .dialog-body) {
  padding: 8px 16px 8px !important;
}
</style>

