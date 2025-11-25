<template>
  <v-dialog
    v-model="isOpen"
    :max-width="640"
    transition="dialog-transition"
    :scrim="'rgba(15,23,42,0.65)'"
  >
    <v-card class="customer-filter-dialog">
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
        <v-btn variant="text" class="text-capitalize" @click="handleClear">
          Clear all
        </v-btn>
        <v-spacer />
        <v-btn variant="text" class="text-capitalize" @click="close">Cancel</v-btn>
        <v-btn color="primary" class="text-capitalize" @click="handleApply">Apply</v-btn>
      </footer>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'

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

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const draft = reactive({ categories: [], channels: [] })

function syncDraft(criteria) {
  draft.categories = Array.isArray(criteria?.categories) ? [...criteria.categories] : []
  draft.channels = Array.isArray(criteria?.channels) ? [...criteria.channels] : []
}

watch(
  () => props.criteria,
  (value) => syncDraft(value || {}),
  { immediate: true, deep: true },
)

function close() {
  isOpen.value = false
}

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

<style scoped>
.customer-filter-dialog {
  border-radius: 18px;
  padding: 8px 8px 16px;
  display: flex;
  flex-direction: column;
  max-height: 50vh;
}

.dialog-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 16px 12px;
  border-bottom: 1.5px solid #edf1f5;
}

.dialog-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  text-align: center;
}

.dialog-close {
  position: absolute;
  top: 4px;
  right: 4px;
}

.dialog-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0 16px 8px;
}

.filter-section {
  position: relative;
  padding: 16px 16px 20px;
}

.filter-section::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 0;
  height: 1.5px;
  background-color: #edf1f5;
}

.filter-section:last-of-type::after {
  display: none;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.option-grid {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.dialog-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px 4px;
  border-top: 1.5px solid #edf1f5;
}
</style>
