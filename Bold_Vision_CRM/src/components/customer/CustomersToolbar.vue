<template>
  <div class="customers-toolbar">
    <div class="header-row">
      <div class="heading">
        <v-icon :size="iconSize" :color="iconColor" class="heading-icon">{{ icon }}</v-icon>
        <div>
          <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
          <h1 class="title-text">{{ title }}</h1>
        </div>
      </div>

      <slot name="actions">
        <v-btn
          color="primary"
          variant="elevated"
          class="text-capitalize"
          :prepend-icon="actionIcon"
          @click="$emit('add')"
        >
          {{ actionLabel }}
        </v-btn>
      </slot>
    </div>

    <BaseSearchBar
      v-model="internalSearch"
      class="mt-6"
      :label="searchLabel"
      :placeholder="searchPlaceholder"
    />

    <BaseFilterBar
      v-if="showFilters"
      v-model="internalFilters"
      :available-filters="availableFilters"
      class="mt-4"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseSearchBar from '../base/BaseSearchBar.vue'
import BaseFilterBar from '../base/BaseFilterBar.vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Customers',
  },
  eyebrow: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'mdi-account',
  },
  iconSize: {
    type: [Number, String],
    default: 38,
  },
  iconColor: {
    type: String,
    default: 'black',
  },
  actionLabel: {
    type: String,
    default: 'Add New Customer',
  },
  actionIcon: {
    type: String,
    default: 'mdi-account-plus',
  },
  search: {
    type: String,
    default: '',
  },
  searchLabel: {
    type: String,
    default: 'Search customers',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search name, email, phone...',
  },
  filters: {
    type: Array,
    default: () => [],
  },
  availableFilters: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:search', 'update:filters', 'add'])

const internalSearch = computed({
  get: () => props.search,
  set: (value) => emit('update:search', value ?? ''),
})

const internalFilters = computed({
  get: () => props.filters,
  set: (value) => emit('update:filters', value ?? []),
})

const showFilters = computed(
  () => props.availableFilters.length > 0 || (props.filters?.length ?? 0) > 0,
)
</script>

<style scoped>
.customers-toolbar {
  width: 100%;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.heading-icon {
  line-height: 1;
}

.title-text {
  margin: 0;
  font-size: clamp(1.5rem, 2vw, 2rem);
  font-weight: 600;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.8rem;
  margin-bottom: 4px;
  color: #7c7c7c;
}
</style>
