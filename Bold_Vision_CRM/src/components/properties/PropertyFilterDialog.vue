<template>
  <v-dialog
    v-model="isOpen"
    :max-width="640"
    transition="dialog-transition"
    :scrim="'rgba(15,23,42,0.65)'"
  >
    <v-card class="property-filter-dialog">
      <header class="dialog-header">
        <h2 class="dialog-title">Filter</h2>
        <v-btn icon variant="text" density="comfortable" class="dialog-close" @click="close">
          <v-icon icon="mdi-close" size="20" />
        </v-btn>
      </header>

      <div class="dialog-body" tabindex="-1">
        <section class="filter-section">
          <div class="section-header">
            <p class="section-title">Status</p>
            <v-btn variant="text" size="small" class="text-capitalize" @click="clearStatus">
              Clear
            </v-btn>
          </div>
          <v-radio-group v-model="draft.status" class="status-group">
            <v-radio
              label="All statuses"
              value=""
              color="primary"
              density="comfortable"
              hide-details
            />
            <v-radio
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.title"
              :value="option.value"
              color="primary"
              density="comfortable"
              hide-details
            />
          </v-radio-group>
        </section>

        <section class="filter-section">
          <div class="section-header">
            <p class="section-title">Property type</p>
            <v-btn variant="text" size="small" class="text-capitalize" @click="clearTypes">
              Clear
            </v-btn>
          </div>
          <div class="type-grid">
            <v-checkbox
              label="All types"
              :model-value="draft.types.length === 0"
              color="primary"
              density="comfortable"
              hide-details
              @click.stop.prevent="clearTypes"
            />
            <v-checkbox
              v-for="option in typeOptions"
              :key="option.value"
              :label="option.title"
              :value="option.value"
              v-model="draft.types"
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
    default: () => ({ status: '', types: [] }),
  },
  statusOptions: {
    type: Array,
    default: () => [],
  },
  typeOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'apply', 'clear'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const draft = reactive({ status: '', types: [] })

function syncDraft(criteria) {
  draft.status = criteria?.status ?? ''
  draft.types = Array.isArray(criteria?.types) ? [...criteria.types] : []
}

watch(
  () => props.criteria,
  (value) => syncDraft(value || {}),
  { immediate: true, deep: true },
)

function close() {
  isOpen.value = false
}

function clearStatus() {
  draft.status = ''
}

function clearTypes() {
  draft.types = []
}

function handleClear() {
  draft.status = ''
  draft.types = []
  emit('clear')
}

function handleApply() {
  emit('apply', {
    status: draft.status,
    types: [...draft.types],
  })
  close()
}
</script>

<style scoped>
.property-filter-dialog {
  border-radius: 18px;
  padding: 8px 8px 16px;
}

.dialog-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 16px 12px;
  border-bottom: 1.5px solid #edf1f5;
}

.dialog-eyebrow {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin-bottom: 4px;
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
  max-height: 65vh;
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

.status-group {
  display: grid;
  gap: 4px;
}

.type-grid {
  display: grid;
  gap: 4px;
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
