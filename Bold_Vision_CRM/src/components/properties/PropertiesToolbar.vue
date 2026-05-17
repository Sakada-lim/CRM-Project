<template>
  <div class="prop-toolbar">
    <!-- Title row -->
    <div class="prop-toolbar__header">
      <div class="prop-toolbar__title">
        <h1>Properties</h1>
        <p v-if="supportingText">{{ supportingText }}</p>
      </div>
      <slot name="actions">
        <button class="btn btn-primary" @click="$emit('add')">
          <AppIcon name="plus" :size="14" />
          Add new property
        </button>
      </slot>
    </div>

    <!-- Filter strip -->
    <div class="prop-toolbar__strip">
      <!-- Row 1: Status chips (horizontally scrollable) -->
      <div class="prop-toolbar__chips-row">
        <div class="status-chips" role="tablist">
          <button
            v-for="s in statusGroups"
            :key="s.label"
            class="status-chip"
            :class="{ active: internalStatus === s.label }"
            role="tab"
            @click="internalStatus = s.label"
          >
            <span v-if="s.dot" class="dot" :style="{ background: s.dot }" />
            {{ s.label }}
          </button>
        </div>
      </div>

      <!-- Row 2: Search + Sort + Filters -->
      <div class="prop-toolbar__controls">
        <div class="prop-toolbar__search">
          <AppIcon name="search" :size="15" class="prop-toolbar__search-icon" />
          <input
            v-model="internalSearch"
            type="search"
            class="prop-toolbar__search-input"
            placeholder="Search address, suburb…"
            autocomplete="off"
            spellcheck="false"
          />
        </div>

        <div class="prop-toolbar__sort-wrap">
          <select v-model="internalSort" class="prop-toolbar__sort">
            <option value="recent">Most recent</option>
            <option value="price-high">Price (high→low)</option>
            <option value="price-low">Price (low→high)</option>
            <option value="alpha">Address (A–Z)</option>
          </select>
          <svg class="prop-toolbar__sort-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
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

    <!-- Active advanced filter chips -->
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

const STATUS_GROUPS = [
  { label: 'All',            dot: null },
  { label: 'On Market',      dot: 'var(--success)' },
  { label: 'Coming Soon',    dot: 'var(--warm)' },
  { label: 'Under Contract', dot: 'var(--accent)' },
  { label: 'Sold',           dot: 'var(--cold)' },
  { label: 'Off Market',     dot: 'var(--text-muted)' },
  { label: 'Withdrawn',      dot: 'var(--hot)' },
]

const props = defineProps({
  title:             { type: String,  default: 'Properties' },
  supportingText:    { type: String,  default: '' },
  search:            { type: String,  default: '' },
  filters:           { type: Array,   default: () => [] },
  availableFilters:  { type: Array,   default: () => [] },
  quickStatusFilter: { type: String,  default: 'All' },
  sortKey:           { type: String,  default: 'recent' },
})

const emit = defineEmits([
  'update:search', 'update:filters', 'update:quickStatusFilter', 'update:sortKey',
  'add', 'open-filters',
])

const statusGroups = STATUS_GROUPS

const internalSearch = computed({
  get: () => props.search,
  set: (v) => emit('update:search', v ?? ''),
})
const internalFilters = computed({
  get: () => props.filters,
  set: (v) => emit('update:filters', v ?? []),
})
const internalStatus = computed({
  get: () => props.quickStatusFilter,
  set: (v) => emit('update:quickStatusFilter', v),
})
const internalSort = computed({
  get: () => props.sortKey,
  set: (v) => emit('update:sortKey', v),
})

const hasActiveFilters = computed(() => props.filters.length > 0)
const canAddFilters    = computed(() => props.availableFilters.length > 0)
</script>

<style scoped>
.prop-toolbar { display: flex; flex-direction: column; gap: 14px; }

.prop-toolbar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.prop-toolbar__title h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text);
}
.prop-toolbar__title p {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: var(--text-muted);
}

.prop-toolbar__strip {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.prop-toolbar__chips-row {
  padding: 8px 8px 6px;
}

.prop-toolbar__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 8px;
  border-top: 1px solid var(--border);
}

.prop-toolbar__search {
  position: relative;
  flex: 1;
  min-width: 0;
}
.prop-toolbar__search-icon {
  position: absolute;
  left: 10px; top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}
.prop-toolbar__search-input {
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
.prop-toolbar__search-input::placeholder { color: var(--text-faint); }
.prop-toolbar__search-input:hover { border-color: var(--border); }
.prop-toolbar__search-input:focus { border-color: var(--accent); background: var(--surface-2); }
/* hide browser's native clear button */
.prop-toolbar__search-input::-webkit-search-cancel-button { display: none; }

.prop-toolbar__sort-wrap {
  position: relative;
  flex-shrink: 0;
}
.prop-toolbar__sort {
  height: 36px;
  padding: 0 30px 0 10px;
  border-radius: var(--r-md);
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}
.prop-toolbar__sort-chevron {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.btn-sm-height { height: 36px; }

@media (max-width: 600px) {
  .prop-toolbar__title h1 { font-size: 20px; }
  .filter-label { display: none; }
  .prop-toolbar__sort-wrap { max-width: 120px; }
  .prop-toolbar__sort { font-size: 12px; width: 100%; }
  .prop-toolbar__controls { gap: 6px; padding: 6px; }
}
</style>
