<template>
  <div class="cust-toolbar">
    <!-- Title row -->
    <div class="cust-toolbar__header">
      <div class="cust-toolbar__title">
        <h1>Customers</h1>
        <p v-if="supportingText">{{ supportingText }}</p>
      </div>
      <slot name="actions">
        <button class="btn btn-primary cust-add-btn" @click="$emit('add')">
          <AppIcon name="plus" :size="14" />
          <span class="cust-add-label">Add new customer</span>
        </button>
      </slot>
    </div>

    <!-- Filter strip: 2-row layout -->
    <div class="cust-toolbar__strip">
      <!-- Row 1: Category chips -->
      <div class="cust-toolbar__chips-row">
        <div class="status-chips" role="tablist">
          <button
            v-for="c in CATEGORY_GROUPS"
            :key="c.label"
            class="status-chip"
            :class="{ active: internalCategory === c.label }"
            role="tab"
            @click="internalCategory = c.label"
          >
            <span v-if="c.dot" class="dot" :style="{ background: c.dot }" />
            {{ c.label }}
          </button>
        </div>
      </div>

      <!-- Row 2: Search + Sort + Filters -->
      <div class="cust-toolbar__controls">
        <div class="cust-toolbar__search">
          <AppIcon name="search" :size="15" class="cust-toolbar__search-icon" />
          <input
            v-model="internalSearch"
            type="search"
            class="cust-toolbar__search-input"
            placeholder="Search name, email, phone…"
            autocomplete="off"
            spellcheck="false"
          />
        </div>

        <div v-if="sortOptions.length" class="cust-toolbar__sort">
          <select :value="sort" class="select" @change="emit('update:sort', $event.target.value)">
            <option v-for="o in sortOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <button
          v-if="canAddFilters"
          class="btn btn-ghost btn-sm-height"
          @click="$emit('open-filters')"
        >
          <AppIcon name="filter" :size="14" />
          <span class="filter-label">Filters</span>
        </button>
      </div>
    </div>

    <!-- Active filter chips -->
    <BaseFilterBar
      v-if="hasActiveFilters"
      v-model="internalFilters"
      :available-filters="availableFilters"
      :show-activator="false"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '../base/AppIcon.vue'
import BaseFilterBar from '../base/BaseFilterBar.vue'

const CATEGORY_GROUPS = [
  { label: 'All',  dot: null },
  { label: 'Hot',  dot: 'var(--hot)' },
  { label: 'Warm', dot: 'var(--warm)' },
  { label: 'Cold', dot: 'var(--cold)' },
]

const props = defineProps({
  supportingText:   { type: String, default: '' },
  search:           { type: String, default: '' },
  filters:          { type: Array,  default: () => [] },
  availableFilters: { type: Array,  default: () => [] },
  quickCategory:    { type: String, default: 'All' },
  sort:             { type: String, default: '' },
  sortOptions:      { type: Array,  default: () => [] },
})

const emit = defineEmits([
  'update:search', 'update:filters', 'update:quickCategory', 'update:sort',
  'add', 'open-filters',
])

const internalSearch = computed({
  get: () => props.search,
  set: (v) => emit('update:search', v ?? ''),
})
const internalFilters = computed({
  get: () => props.filters,
  set: (v) => emit('update:filters', v ?? []),
})
const internalCategory = computed({
  get: () => props.quickCategory,
  set: (v) => emit('update:quickCategory', v),
})

const hasActiveFilters = computed(() => props.filters.length > 0)
const canAddFilters    = computed(() => props.availableFilters.length > 0)
</script>

<style scoped>
.cust-toolbar { display: flex; flex-direction: column; gap: 14px; }

.cust-toolbar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.cust-toolbar__title h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text);
}
.cust-toolbar__title p {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: var(--text-muted);
}

.cust-toolbar__strip {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.cust-toolbar__chips-row {
  padding: 8px 8px 6px;
}
.cust-toolbar__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 8px;
  border-top: 1px solid var(--border);
}

.cust-toolbar__search {
  position: relative;
  flex: 1;
  min-width: 0;
}
.cust-toolbar__search-icon {
  position: absolute;
  left: 10px; top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}
.cust-toolbar__search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px 0 34px;
  border-radius: var(--r-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text);
  font-size: 13.5px;
  font-family: inherit;
  outline: none;
  transition: border-color .12s, background .12s;
}
.cust-toolbar__search-input::placeholder { color: var(--text-faint); }
.cust-toolbar__search-input:hover { border-color: var(--border); }
.cust-toolbar__search-input:focus { border-color: var(--accent); background: var(--surface-2); }
.cust-toolbar__search-input::-webkit-search-cancel-button { display: none; }

.btn-sm-height { height: 36px; }

.cust-toolbar__sort { flex-shrink: 0; }
.cust-toolbar__sort .select {
  width: auto;
  min-width: 170px;
  height: 36px;
  padding: 0 32px 0 12px;
  font-size: 13.5px;
  background-color: transparent;
  border-color: transparent;
}
.cust-toolbar__sort .select:hover { background-color: var(--surface-2); border-color: var(--border); }
.cust-toolbar__sort .select:focus { background-color: var(--surface); border-color: var(--accent); }

@media (max-width: 600px) {
  .cust-toolbar__title h1 { font-size: 20px; }
  .filter-label { display: none; }
  .cust-toolbar__controls { gap: 6px; padding: 6px; }
  .cust-add-btn { width: 36px; padding: 0; }
  .cust-add-label { display: none; }
  .cust-toolbar__sort .select { min-width: 0; max-width: 150px; font-size: 12.5px; padding-left: 10px; }
}
</style>
