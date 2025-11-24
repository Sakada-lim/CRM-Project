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
import { computed, ref, watch } from 'vue'
import { usePropertyStore } from '../stores/propertyStore'
import BaseDialog from '../components/base/BaseDialog.vue'
import BasePaginationFooter from '../components/base/BasePaginationFooter.vue'
import PropertyForm from '../components/properties/PropertiesForm.vue'
import PropertiesToolbar from '../components/properties/PropertiesToolbar.vue'

const propertyStore = usePropertyStore()
const properties = computed(() => propertyStore.properties)

const searchQuery = ref('')
const activeFilters = ref([])

const propertyFilterDefinitions = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    allowMultiple: false,
    operators: [
      { label: 'is', value: 'is' },
      { label: 'is not', value: 'is_not' },
    ],
    options: [
      { title: 'On Market', value: 'On Market' },
      { title: 'Under Offer', value: 'Under Offer' },
      { title: 'Sold', value: 'Sold' },
    ],
  },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    allowMultiple: true,
    operators: [
      { label: 'is', value: 'is' },
      { label: 'is not', value: 'is_not' },
    ],
    options: [
      { title: 'House', value: 'House' },
      { title: 'Townhouse', value: 'Townhouse' },
      { title: 'Apartment', value: 'Apartment' },
      { title: 'Villa', value: 'Villa' },
    ],
  },
]

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

const normalizeSearch = (value) => value?.trim().toLowerCase() ?? ''

const filteredProperties = computed(() => {
  const term = normalizeSearch(searchQuery.value)
  const filters = activeFilters.value ?? []
  return properties.value.filter((property) => {
    const haystack = `${property.address} ${property.suburb} ${property.state} ${property.type}`.toLowerCase()
    const matchesSearch = !term || haystack.includes(term)
    if (!matchesSearch) return false
    if (!filters.length) return true
    return filters.every((filter) => {
      const predicate = filterPredicates[filter.key]
      return predicate ? predicate(property, filter) : true
    })
  })
})

const ITEMS_PER_PAGE = 9
const currentPage = ref(1)

const pageCount = computed(() => {
  const total = filteredProperties.value.length
  return total ? Math.ceil(total / ITEMS_PER_PAGE) : 1
})

watch(filteredProperties, () => {
  currentPage.value = 1
})

watch(pageCount, (count) => {
  if (currentPage.value > count) {
    currentPage.value = count
  }
})

const paginatedProperties = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredProperties.value.slice(start, start + ITEMS_PER_PAGE)
})

const paginationLabel = computed(() => {
  const total = filteredProperties.value.length
  if (!total) {
    return 'No properties found'
  }
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE + 1
  const end = Math.min(start + ITEMS_PER_PAGE - 1, total)
  return `Showing ${start}-${end} of ${total}`
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
