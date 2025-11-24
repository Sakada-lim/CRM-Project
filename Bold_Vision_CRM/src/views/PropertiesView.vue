<template>
  <div class="properties-view">
    <PropertiesToolbar
      class="mb-6"
      title="Properties"
      :supporting-text="supportingText"
      v-model:search="searchQuery"
      v-model:filters="activeFilters"
      :available-filters="propertyFilterDefinitions"
      @add="openAddProperty"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-home-plus"
          class="text-capitalize"
          @click="openAddProperty"
        >
          Add New Property
        </v-btn>
      </template>
    </PropertiesToolbar>

    <div class="properties-grid" v-if="paginatedProperties.length">
      <article v-for="property in paginatedProperties" :key="property.id" class="property-card">
        <div class="card-photo">
          <img :src="property.mainPhoto" :alt="property.address" loading="lazy" />

          <div v-if="property.statusBadge" class="status-pill" :class="`status-${property.statusBadge.type}`">
            <span class="status-dot" />
            {{ property.statusBadge.label }}
          </div>

          <div class="photo-meta">
            <span class="price">{{ property.priceGuide }}</span>
          </div>
        </div>

        <div class="card-body">
          <div class="address">{{ property.address }}</div>
          <div class="suburb">{{ property.suburb }}, {{ property.state }} {{ property.postcode }}</div>

          <div class="property-stats">
            <div class="stat">
              <v-icon icon="mdi-bed-outline" size="18" />
              <span>{{ property.bedrooms }}</span>
            </div>
            <div class="stat">
              <v-icon icon="mdi-shower" size="18" />
              <span>{{ property.bathrooms }}</span>
            </div>
            <div class="stat">
              <v-icon icon="mdi-car-outline" size="18" />
              <span>{{ property.carSpaces }}</span>
            </div>
            <div class="size-group">
              <div class="stat">
                <v-icon icon="mdi-ruler-square" size="18" />
                <span>{{ property.landSize }}</span>
              </div>
              <div class="stat">
                <v-icon icon="mdi-home-floor-1" size="18" />
                <span>{{ property.houseSize }}</span>
              </div>
            </div>
          </div>

          <div class="property-footer">
            <div class="meta">
              <span class="type">{{ property.type }}</span>
            </div>

            <v-btn :to="`/properties/${property.id}`" variant="tonal" color="primary" class="text-capitalize">
              View details
            </v-btn>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="properties-empty">
      {{ paginationLabel }}
    </div>

    <BasePaginationFooter
      v-if="filteredProperties.length"
      v-model="currentPage"
      class="properties-pagination"
      :length="pageCount"
      :total-visible="4"
      :label="paginationLabel"
    />

    <BaseDialog
      v-model="showAddProperty"
      title="Add new property"
      confirm-text="Add property"
      @confirm="handleAddProperty"
      @cancel="resetNewProperty"
    >
      <PropertyForm v-model="newProperty" />
    </BaseDialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { usePropertyStore } from '../stores/propertyStore'
import BaseDialog from '../components/base/BaseDialog.vue'
import BasePaginationFooter from '../components/base/BasePaginationFooter.vue'
import PropertyForm from '../components/properties/PropertiesForm.vue'
import PropertiesToolbar from '../components/properties/PropertiesToolbar.vue'
import { propertyFilterDefinitions } from '../config/filterDefinitions'
import { usePropertyFilters } from '../composables/usePropertyFilters'
import { useResponsivePageSize } from '../composables/useResponsivePageSize'

const propertyStore = usePropertyStore()
const properties = computed(() => propertyStore.properties)

const searchQuery = ref('')
const activeFilters = ref([])

const filterPredicates = {
  status: (property, filter) => {
    const current = (property.status || '').toLowerCase()
    const target = String(filter?.value ?? '').toLowerCase()
    if (!target) return true
    return filter?.operator === 'is_not' ? current !== target : current === target
  },
  type: (property, filter) => {
    const current = (property.type || '').toLowerCase()
    const target = String(filter?.value ?? '').toLowerCase()
    if (!target) return true
    return filter?.operator === 'is_not' ? current !== target : current === target
  },
}

const { pageSize: itemsPerPage } = useResponsivePageSize({
  breakpoints: [
    { minWidth: 1600, size: 12 },
    { minWidth: 1200, size: 9 },
    { minWidth: 900, size: 6 },
    { minWidth: 0, size: 4 },
  ],
  fallbackSize: 4,
})

const {
  currentPage,
  pageCount,
  filteredProperties,
  paginatedProperties,
  paginationLabel,
} = usePropertyFilters({
  properties,
  searchQuery,
  activeFilters,
  filterPredicates,
  itemsPerPage,
})

const supportingText = computed(() => {
  const total = filteredProperties.value.length
  const suffix = total === 1 ? '' : 's'
  return `${total} active listing${suffix}`
})

const showAddProperty = ref(false)

const newProperty = ref({
  address: '',
  type: 'House',
  status: 'On Market',
  priceGuide: '',
  description: '',
  notes: '',
})

const resetNewProperty = () => {
  newProperty.value = {
    address: '',
    type: 'House',
    status: 'On Market',
    priceGuide: '',
    description: '',
    notes: '',
  }
}

function openAddProperty() {
  resetNewProperty()
  showAddProperty.value = true
}

function handleAddProperty() {
  if (!newProperty.value.address || !newProperty.value.type || !newProperty.value.status) {
    alert('Please fill in at least address, type, and status.')
    return
  }

  propertyStore.addProperty({ ...newProperty.value })
  resetNewProperty()
  showAddProperty.value = false
}
</script>

<style scoped>
.properties-view {
  width: 100%;
  max-width: none;
  margin: 0;
  padding-right: 0;
  padding-top: 0;
  padding-bottom: clamp(16px, 2vw, 32px);
}

.properties-empty {
  padding: 32px 0;
  text-align: center;
  color: var(--bv-text-secondary, #64748b);
  font-size: 1rem;
}

.properties-pagination {
  margin-top: 32px;
}
</style>
