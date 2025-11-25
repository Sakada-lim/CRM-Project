<template>
  <v-dialog
    v-model="isOpen"
    :max-width="640"
    transition="dialog-transition"
    :scrim="'rgba(15,23,42,0.65)'"
  >
    <v-card class="filter-dialog-card">
      <header class="dialog-header">
        <h2 class="dialog-title">Filter</h2>
        <v-btn icon variant="text" density="comfortable" class="dialog-close" @click="close">
          <v-icon icon="mdi-close" size="20" />
        </v-btn>
      </header>

      <div class="dialog-body" tabindex="-1">
        <section class="filter-section">
          <div class="section-header">
            <p class="section-title">Customer category</p>
            <v-btn variant="text" size="small" class="text-capitalize" @click="clearCategories">
              Clear
            </v-btn>
          </div>
          <div class="option-grid">
            <v-checkbox
              label="All categories"
              :model-value="draft.categories.length === 0"
              color="primary"
              density="comfortable"
              hide-details
              @click.stop.prevent="clearCategories"
            />
            <v-checkbox
              v-for="option in categoryOptions"
              :key="option.value"
              :label="option.title"
              :value="option.value"
              v-model="draft.categories"
              color="primary"
              density="comfortable"
              hide-details
            />
          </div>
        </section>

        <section class="filter-section">
          <div class="section-header">
            <p class="section-title">Preferred channel</p>
            <v-btn variant="text" size="small" class="text-capitalize" @click="clearChannels">
              Clear
            </v-btn>
          </div>
          <div class="option-grid">
            <v-checkbox
              label="All channels"
              :model-value="draft.channels.length === 0"
              color="primary"
              density="comfortable"
              hide-details
              @click.stop.prevent="clearChannels"
            />
            <v-checkbox
              v-for="option in channelOptions"
              :key="option.value"
              :label="option.title"
              :value="option.value"
              v-model="draft.channels"
              color="primary"
              density="comfortable"
              hide-details
            />
          </div>
        </section>
      </div>

      <footer class="dialog-footer">
        <v-btn variant="text" class="text-capitalize" @click="handleClear"> Clear all </v-btn>
        <v-spacer />
        <v-btn variant="text" class="text-capitalize" @click="close">Cancel</v-btn>
        <v-btn color="primary" class="text-capitalize" @click="handleApply">Apply</v-btn>
      </footer>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useFilterDialogState } from '../../composables/useFilterDialogState'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  criteria: {
    type: Object,
    default: () => ({
      categories: [],
      channels: [],
    }),
  },
  categoryOptions: {
    type: Array,
    default: () => [],
  },
  channelOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'apply', 'clear'])

const { draft, isOpen, close } = useFilterDialogState({
  props,
  emit,
  createEmptyDraft: () => ({ categories: [], channels: [] }),
  mapCriteriaToDraft: (criteria = {}) => ({
    categories: Array.isArray(criteria?.categories) ? [...criteria.categories] : [],
    channels: Array.isArray(criteria?.channels) ? [...criteria.channels] : [],
  }),
})

function clearCategories() {
  draft.categories = []
}

function clearChannels() {
  draft.channels = []
}

function handleClear() {
  draft.categories = []
  draft.channels = []
  emit('clear')
}

function handleApply() {
  emit('apply', {
    categories: [...draft.categories],
    channels: [...draft.channels],
  })
  close()
}
</script>

<style scoped src="../../assets/styles/components/filterDialog.css"></style>
