<template>
  <div class="properties-toolbar">
    <div class="header-row">
      <div class="heading">
        <v-icon :size="iconSize" :color="iconColor" class="heading-icon">{{ icon }}</v-icon>
        <div>
          <h1 class="title-text">{{ title }}</h1>
          <p v-if="supportingText" class="supporting">{{ supportingText }}</p>
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
    default: 'Properties',
  },
  supportingText: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'mdi-home-city',
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
    default: 'Add New Property',
  },
  actionIcon: {
    type: String,
    default: 'mdi-home-plus',
  },
  search: {
    type: String,
    default: '',
  },
  searchLabel: {
    type: String,
    default: 'Search properties',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search address, suburb, status…',
  },
  filters: {
    type: Array,
    default: () => [],
  },
  availableFilters: {
    type: Array,
    default: () => [],
  }
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
