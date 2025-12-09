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

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  model: {
    type: Object,
    default: () => ({
      address: '',
      type: 'House',
      status: 'On Market',
      priceGuide: '',
      description: '',
      notes: '',
    }),
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { draft, isOpen, close } = useFilterDialogState({
  props,
  emit,
  // reusing dialog state helper for consistent open/close behavior
  createEmptyDraft: () => ({
    address: '',
    type: 'House',
    status: 'On Market',
    priceGuide: '',
    description: '',
    notes: '',
  }),
  mapCriteriaToDraft: (data = {}) => ({
    address: data?.address ?? '',
    type: data?.type ?? 'House',
    status: data?.status ?? 'On Market',
    priceGuide: data?.priceGuide ?? '',
    description: data?.description ?? '',
    notes: data?.notes ?? '',
  }),
})

function handleConfirm() {
  emit('confirm', { ...draft })
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

