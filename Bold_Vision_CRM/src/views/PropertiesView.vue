<template>
  <div class="properties-view">
    <PropertiesToolbar
      class="mb-6"
      title="Properties"
      :supporting-text="supportingText"
      v-model:search="searchQuery"
      v-model:filters="toolbarFilters"
      :available-filters="propertyFilterDefinitions"
      @open-filters="openFilterDialog"
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

          <div
            v-if="property.statusBadge"
            class="status-pill"
            :class="`status-${property.statusBadge.type}`"
          >
            <span class="status-dot" />
            {{ property.statusBadge.label }}
          </div>

          <div class="photo-meta">
            <span class="price">{{ property.priceGuide }}</span>
          </div>
        </div>

        <div class="card-body">
          <div class="address">{{ property.address }}</div>
          <div class="suburb">
            {{ property.suburb }}, {{ property.state }} {{ property.postcode }}
          </div>

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

            <v-btn
              :to="`/properties/${property.id}`"
              variant="tonal"
              color="primary"
              class="text-capitalize"
            >
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

    <AddPropertyDialog
      v-model="showAddProperty"
      :model="newProperty"
      @confirm="handleAddProperty"
    />

    <PropertyFilterDialog
      v-model="showFilterDialog"
      :criteria="filterCriteria"
      :type-options="typeOptions"
      @apply="handleFilterApply"
      @clear="handleFilterClear"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { usePropertyStore } from '../stores/propertyStore'
import AddPropertyDialog from '../components/properties/AddPropertyDialog.vue'
import BasePaginationFooter from '../components/base/BasePaginationFooter.vue'
import PropertiesToolbar from '../components/properties/PropertiesToolbar.vue'
import { propertyFilterDefinitions } from '../config/filterDefinitions'
import { usePropertyFilters } from '../composables/usePropertyFilters'
import { useResponsivePageSize } from '../composables/useResponsivePageSize'
import PropertyFilterDialog from '../components/properties/PropertyFilterDialog.vue'
import { useFilterChips } from '../composables/useFilterChips'
import { createEmptyPropertyDraft } from '../constants/propertyDefaults'

const propertyStore = usePropertyStore()
const properties = computed(() => propertyStore.properties)

const searchQuery = ref('')
const activeFilters = ref([])
const advancedCriteria = ref(createDefaultAdvancedCriteria())

const { toolbarFilters } = useFilterChips({
  manualFilters: activeFilters,
  buildAdvancedChips: () => buildAdvancedFilterChips(advancedCriteria.value),
  clearAdvancedChip: clearAdvancedField,
})

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

const { currentPage, pageCount, filteredProperties, paginatedProperties, paginationLabel } =
  usePropertyFilters({
    properties,
    searchQuery,
    activeFilters,
    filterPredicates,
    itemsPerPage,
    criteria: advancedCriteria,
    criteriaPredicate: matchesAdvancedCriteria,
    criteriaIsActive: isAdvancedCriteriaActive,
  })

const supportingText = computed(() => {
  const total = filteredProperties.value.length
  const suffix = total === 1 ? '' : 's'
  return `${total} active listing${suffix}`
})

const showAddProperty = ref(false)
const showFilterDialog = ref(false)

const newProperty = ref(createEmptyPropertyDraft())

const resetNewProperty = () => {
  newProperty.value = createEmptyPropertyDraft()
}

function openAddProperty() {
  resetNewProperty()
  showAddProperty.value = true
}

const filterDefinitionMap = computed(() => {
  return propertyFilterDefinitions.reduce((map, definition) => {
    map[definition.key] = definition
    return map
  }, {})
})

const filterCriteria = computed(() => {
  const typeFilters = activeFilters.value.filter((filter) => filter.key === 'type')
  return {
    ...advancedCriteria.value,
    types: typeFilters.map((filter) => filter.value),
  }
})
const typeOptions = computed(() => filterDefinitionMap.value.type?.options ?? [])

function openFilterDialog() {
  showFilterDialog.value = true
}

function buildFilterFromValue(key, value) {
  const definition = filterDefinitionMap.value[key]
  if (!definition || !value) return null

  const operatorValue = definition.operators?.[0]?.value ?? 'is'
  const operatorLabel =
    definition.operators?.find((op) => op.value === operatorValue)?.label ?? operatorValue
  const optionLabel = definition.options?.find((option) => option.value === value)?.title ?? value

  return {
    id: `${key}-${operatorValue}-${value}-${Date.now()}`,
    key,
    operator: operatorValue,
    value,
    label: `${definition.label} ${operatorLabel} ${optionLabel}`,
    labelParts: {
      field: definition.label,
      operator: operatorLabel,
      value: optionLabel,
    },
  }
}

function handleFilterApply(criteria) {
  const typeValues = Array.isArray(criteria?.types) ? criteria.types : []
  const uniqueTypes = [...new Set(typeValues.filter(Boolean))]
  const typeFilters = uniqueTypes
    .map((typeValue) => buildFilterFromValue('type', typeValue))
    .filter(Boolean)

  const preservedFilters = activeFilters.value.filter(
    (filter) => filter.key !== 'type' && filter.meta?.source !== 'advanced',
  )
  activeFilters.value = [...preservedFilters, ...typeFilters]

  const {
    priceMin = null,
    priceMax = null,
    priceHasValue = false,
    bedroomsMin = null,
    bedroomsMax = null,
    bathroomsMin = null,
    bathroomsMax = null,
    carSpacesMin = null,
    landSizeMin = null,
    landSizeMax = null,
    propertyAge = 'all',
  } = criteria || {}

  advancedCriteria.value = {
    priceMin,
    priceMax,
    priceHasValue,
    bedroomsMin,
    bedroomsMax,
    bathroomsMin,
    bathroomsMax,
    carSpacesMin,
    landSizeMin,
    landSizeMax,
    propertyAge,
  }

  showFilterDialog.value = false
}

function handleFilterClear() {
  advancedCriteria.value = createDefaultAdvancedCriteria()
  activeFilters.value = []
}

function handleAddProperty(payload) {
  const propertyData = payload || newProperty.value

  if (!propertyData.address || !propertyData.type || !propertyData.status) {
    alert('Please fill in at least address, type, and status.')
    return
  }

  propertyStore.addProperty({ ...propertyData })
  resetNewProperty()
  showAddProperty.value = false
}

function createDefaultAdvancedCriteria() {
  return {
    priceMin: null,
    priceMax: null,
    priceHasValue: false,
    bedroomsMin: null,
    bedroomsMax: null,
    bathroomsMin: null,
    bathroomsMax: null,
    carSpacesMin: null,
    landSizeMin: null,
    landSizeMax: null,
    propertyAge: 'all',
  }
}

function matchesAdvancedCriteria(property, criteria) {
  if (!criteria) {
    return true
  }

  const price = parsePriceGuide(property.priceGuide)
  if (criteria.priceHasValue && !price.hasValue) {
    return false
  }
  if (criteria.priceMin != null) {
    const comparableMin = price.min ?? price.max
    if (comparableMin == null || comparableMin < criteria.priceMin) {
      return false
    }
  }
  if (criteria.priceMax != null) {
    const comparableMax = price.max ?? price.min
    if (comparableMax == null || comparableMax > criteria.priceMax) {
      return false
    }
  }

  if (!matchesRange(property.bedrooms, criteria.bedroomsMin, criteria.bedroomsMax)) {
    return false
  }
  if (!matchesRange(property.bathrooms, criteria.bathroomsMin, criteria.bathroomsMax)) {
    return false
  }
  if (!matchesRange(property.carSpaces, criteria.carSpacesMin, null)) {
    return false
  }

  const landSize = getLandSizeSqm(property)
  if (!matchesRange(landSize, criteria.landSizeMin, criteria.landSizeMax)) {
    return false
  }

  if (criteria.propertyAge === 'new' && !isNewProperty(property)) {
    return false
  }
  if (criteria.propertyAge === 'established' && isNewProperty(property)) {
    return false
  }

  return true
}

function isAdvancedCriteriaActive(criteria) {
  if (!criteria) {
    return false
  }

  if (criteria.priceHasValue) {
    return true
  }

  if (criteria.propertyAge && criteria.propertyAge !== 'all') {
    return true
  }

  const rangeFields = [
    'priceMin',
    'priceMax',
    'bedroomsMin',
    'bedroomsMax',
    'bathroomsMin',
    'bathroomsMax',
    'carSpacesMin',
    'landSizeMin',
    'landSizeMax',
  ]

  return rangeFields.some((field) => criteria[field] != null)
}

function matchesRange(value, min, max) {
  if (value == null) {
    return min == null && max == null
  }
  if (min != null && value < min) {
    return false
  }
  if (max != null && value > max) {
    return false
  }
  return true
}

function parsePriceGuide(priceGuide) {
  if (!priceGuide) {
    return { min: null, max: null, hasValue: false }
  }

  const matches = [...String(priceGuide).matchAll(/(\d+(?:\.\d+)?)([mk]?)/gi)]
  if (!matches.length) {
    return { min: null, max: null, hasValue: false }
  }

  const values = matches
    .map(([, rawValue, unit]) => {
      const parsed = Number(rawValue)
      if (Number.isNaN(parsed)) {
        return null
      }
      const normalizedUnit = unit?.toLowerCase()
      const multiplier = normalizedUnit === 'm' ? 1_000_000 : normalizedUnit === 'k' ? 1_000 : 1
      return parsed * multiplier
    })
    .filter((value) => value != null)

  if (!values.length) {
    return { min: null, max: null, hasValue: false }
  }

  const [minValue, maxValue] = values
  return {
    min: minValue ?? null,
    max: maxValue ?? minValue ?? null,
    hasValue: true,
  }
}

function getLandSizeSqm(property) {
  if (typeof property?.landSizeSqm === 'number') {
    return property.landSizeSqm
  }

  const match = String(property?.landSize ?? '')
    .replace(/,/g, '')
    .match(/\d+(?:\.\d+)?/)

  return match ? Number(match[0]) : null
}

function isNewProperty(property) {
  return property?.statusBadge?.type === 'new'
}

function buildAdvancedFilterChips(criteria) {
  if (!criteria) {
    return []
  }

  const chips = []

  if (criteria.priceMin != null || criteria.priceMax != null) {
    const chip = createAdvancedChip({
      id: 'price-range',
      field: 'priceRange',
      fieldLabel: 'Price',
      valueLabel: formatRangeLabel(criteria.priceMin, criteria.priceMax, formatCurrencyShort),
    })
    if (chip) {
      chips.push(chip)
    }
  }

  if (criteria.priceHasValue) {
    const chip = createAdvancedChip({
      id: 'price-has-value',
      field: 'priceHasValue',
      fieldLabel: 'Price',
      valueLabel: 'Has price',
    })
    if (chip) {
      chips.push(chip)
    }
  }

  if (criteria.bedroomsMin != null || criteria.bedroomsMax != null) {
    const chip = createAdvancedChip({
      id: 'bedrooms',
      field: 'bedrooms',
      fieldLabel: 'Bedrooms',
      valueLabel: formatCountRange(criteria.bedroomsMin, criteria.bedroomsMax),
    })
    if (chip) {
      chips.push(chip)
    }
  }

  if (criteria.bathroomsMin != null || criteria.bathroomsMax != null) {
    const chip = createAdvancedChip({
      id: 'bathrooms',
      field: 'bathrooms',
      fieldLabel: 'Bathrooms',
      valueLabel: formatCountRange(criteria.bathroomsMin, criteria.bathroomsMax),
    })
    if (chip) {
      chips.push(chip)
    }
  }

  if (criteria.carSpacesMin != null) {
    const chip = createAdvancedChip({
      id: 'car-spaces',
      field: 'carSpaces',
      fieldLabel: 'Car spaces',
      valueLabel: `${criteria.carSpacesMin}+`,
    })
    if (chip) {
      chips.push(chip)
    }
  }

  if (criteria.landSizeMin != null || criteria.landSizeMax != null) {
    const chip = createAdvancedChip({
      id: 'land-size',
      field: 'landSize',
      fieldLabel: 'Land size',
      valueLabel: formatRangeLabel(criteria.landSizeMin, criteria.landSizeMax, formatAreaLabel),
    })
    if (chip) {
      chips.push(chip)
    }
  }

  if (criteria.propertyAge && criteria.propertyAge !== 'all') {
    const valueLabel = criteria.propertyAge === 'new' ? 'New' : 'Established'
    const chip = createAdvancedChip({
      id: 'property-age',
      field: 'propertyAge',
      fieldLabel: 'Property age',
      valueLabel,
    })
    if (chip) {
      chips.push(chip)
    }
  }

  return chips
}

function createAdvancedChip({ id, field, fieldLabel, valueLabel }) {
  if (!valueLabel) {
    return null
  }

  return {
    id: `advanced-${id}`,
    key: `advanced-${id}`,
    label: `${fieldLabel}: ${valueLabel}`,
    labelParts: {
      field: fieldLabel,
      operator: '',
      value: valueLabel,
    },
    meta: {
      source: 'advanced',
      field,
    },
  }
}

function clearAdvancedField(field) {
  switch (field) {
    case 'priceRange':
      updateAdvancedCriteria({ priceMin: null, priceMax: null })
      break
    case 'priceHasValue':
      updateAdvancedCriteria({ priceHasValue: false })
      break
    case 'bedrooms':
      updateAdvancedCriteria({ bedroomsMin: null, bedroomsMax: null })
      break
    case 'bathrooms':
      updateAdvancedCriteria({ bathroomsMin: null, bathroomsMax: null })
      break
    case 'carSpaces':
      updateAdvancedCriteria({ carSpacesMin: null })
      break
    case 'landSize':
      updateAdvancedCriteria({ landSizeMin: null, landSizeMax: null })
      break
    case 'propertyAge':
      updateAdvancedCriteria({ propertyAge: 'all' })
      break
    default:
      break
  }
}

function updateAdvancedCriteria(patch) {
  advancedCriteria.value = { ...advancedCriteria.value, ...patch }
}

function formatRangeLabel(min, max, formatter) {
  if (min != null && max != null) {
    return `${formatter(min)} - ${formatter(max)}`
  }
  if (min != null) {
    return `${formatter(min)}+`
  }
  if (max != null) {
    return `≤ ${formatter(max)}`
  }
  return ''
}

function formatCountRange(min, max) {
  if (min != null && max != null) {
    return `${min}-${max}`
  }
  if (min != null) {
    return `${min}+`
  }
  if (max != null) {
    return `≤ ${max}`
  }
  return ''
}

function formatCurrencyShort(value) {
  if (value == null) {
    return ''
  }

  if (value >= 1_000_000) {
    const formatted =
      value % 1_000_000 === 0 ? (value / 1_000_000).toFixed(0) : (value / 1_000_000).toFixed(1)
    return `$${formatted}m`
  }

  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}k`
  }

  return `$${value}`
}

function formatAreaLabel(value) {
  if (value == null) {
    return ''
  }
  return `${value} m²`
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
