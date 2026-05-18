<template>
  <div class="prop-shell">
    <PropertiesToolbar
      :supporting-text="supportingText"
      v-model:search="searchQuery"
      v-model:filters="toolbarFilters"
      v-model:quick-status-filter="quickStatusFilter"
      v-model:sort-key="sortKey"
      :available-filters="propertyFilterDefinitions"
      @open-filters="openFilterDialog"
      @add="openAddProperty"
    >
      <template #actions>
        <button class="btn btn-primary prop-add-btn" @click="openAddProperty">
          <AppIcon name="plus" :size="14" />
          <span class="prop-add-label">Add new property</span>
        </button>
      </template>
    </PropertiesToolbar>

    <!-- Card grid -->
    <div v-if="paginatedProperties.length" class="prop-grid">
      <router-link
        v-for="property in paginatedProperties"
        :key="property.id"
        :to="`/properties/${property.id}`"
        class="prop-card"
      >
        <!-- Media -->
        <div class="media">
          <PropCardPhoto :storage-path="property.mainPhoto" :alt="property.address" />

          <div class="badges">
            <span class="status-badge" :class="statusToClass(property.status)">
              <span class="dot" />
              {{ property.status }}
            </span>
            <span
              v-if="isNewListing(property)"
              class="status-badge"
              style="background: var(--accent); color: var(--text-on-accent); border: none; box-shadow: none;"
            >
              <AppIcon name="sparkle" :size="11" />
              New
            </span>
          </div>

          <span v-if="property.priceGuide" class="price-tag">{{ property.priceGuide }}</span>
        </div>

        <!-- Body -->
        <div class="body">
          <div class="addr">{{ property.address }}</div>
          <div class="suburb">{{ property.suburb }}, {{ property.state }} {{ property.postcode }}</div>

          <div class="specs">
            <span v-if="property.bedrooms"  class="s"><AppIcon name="bed"  :size="13" /> {{ property.bedrooms }}</span>
            <span v-if="property.bathrooms" class="s"><AppIcon name="bath" :size="13" /> {{ property.bathrooms }}</span>
            <span v-if="property.carSpaces" class="s"><AppIcon name="car"  :size="13" /> {{ property.carSpaces }}</span>
            <span v-if="property.landSizeSqm" class="s"><AppIcon name="pin"   :size="13" /> {{ formatSqm(property.landSizeSqm) }}</span>
            <span v-if="property.houseSizeSqm" class="s"><AppIcon name="house" :size="13" /> {{ formatSqm(property.houseSizeSqm) }}</span>
          </div>

          <div class="meta-row">
            <span>{{ property.type }}</span>
            <span style="display:inline-flex;align-items:center;gap:4px;">
              <AppIcon name="users" :size="11" />
              {{ property.interestedCustomers?.length ?? 0 }}
              {{ property.interestedCustomers?.length === 1 ? 'lead' : 'leads' }}
            </span>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Empty state -->
    <div v-else class="prop-empty">
      No properties match your filter.
    </div>

    <!-- Pagination -->
    <BasePaginationFooter
      v-if="filteredProperties.length"
      v-model="currentPage"
      :length="pageCount"
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
import AppIcon from '../components/base/AppIcon.vue'
import PropCardPhoto from '../components/base/PropCardPhoto.vue'
import { propertyFilterDefinitions } from '../config/filterDefinitions'
import { usePropertyFilters } from '../composables/usePropertyFilters'
import { useResponsivePageSize } from '../composables/useResponsivePageSize'
import PropertyFilterDialog from '../components/properties/PropertyFilterDialog.vue'
import { useFilterChips } from '../composables/useFilterChips'
import { createEmptyPropertyDraft } from '../constants/propertyDefaults'
import { statusToClass } from '../utils/property'
import { formatSqm } from '../utils/formatters'
import { useFeedback } from '../composables/useFeedback'

const { notifySuccess, notifyFromError } = useFeedback()

const propertyStore = usePropertyStore()
const properties = computed(() => propertyStore.properties)

const searchQuery = ref('')
const activeFilters = ref([])
const advancedCriteria = ref(createDefaultAdvancedCriteria())
const quickStatusFilter = ref('All')
const sortKey = ref('recent')

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
    { minWidth: 900,  size: 6 },
    { minWidth: 0,    size: 4 },
  ],
  fallbackSize: 4,
})

// Sort properties before filtering
const sortedProperties = computed(() => {
  const list = [...properties.value]
  if (sortKey.value === 'price-high') {
    return list.sort((a, b) => parsePriceNum(b.priceGuide) - parsePriceNum(a.priceGuide))
  }
  if (sortKey.value === 'price-low') {
    return list.sort((a, b) => parsePriceNum(a.priceGuide) - parsePriceNum(b.priceGuide))
  }
  if (sortKey.value === 'alpha') {
    return list.sort((a, b) => (a.address ?? '').localeCompare(b.address ?? ''))
  }
  // recent — by listedAt desc
  return list.sort((a, b) => new Date(b.listedAt ?? 0) - new Date(a.listedAt ?? 0))
})

// Merge quick status chip into active filters
const effectiveFilters = computed(() => {
  if (quickStatusFilter.value === 'All') return activeFilters.value
  const statusFilter = {
    id: 'quick-status',
    key: 'status',
    operator: 'is',
    value: quickStatusFilter.value,
    label: `Status is ${quickStatusFilter.value}`,
  }
  return [statusFilter, ...activeFilters.value.filter((f) => f.key !== 'status')]
})

const { currentPage, pageCount, filteredProperties, paginatedProperties, paginationLabel } =
  usePropertyFilters({
    properties: sortedProperties,
    searchQuery,
    activeFilters: effectiveFilters,
    filterPredicates,
    itemsPerPage,
    criteria: advancedCriteria,
    criteriaPredicate: matchesAdvancedCriteria,
    criteriaIsActive: isAdvancedCriteriaActive,
  })

const supportingText = computed(() => {
  const total = filteredProperties.value.length
  return `${total} active listing${total === 1 ? '' : 's'}`
})

const showAddProperty  = ref(false)
const showFilterDialog = ref(false)
const newProperty      = ref(createEmptyPropertyDraft())

function openAddProperty() {
  newProperty.value = createEmptyPropertyDraft()
  showAddProperty.value = true
}

const filterDefinitionMap = computed(() =>
  propertyFilterDefinitions.reduce((map, def) => { map[def.key] = def; return map }, {}),
)

const filterCriteria = computed(() => {
  const typeFilters = activeFilters.value.filter((f) => f.key === 'type')
  return { ...advancedCriteria.value, types: typeFilters.map((f) => f.value) }
})
const typeOptions = computed(() => filterDefinitionMap.value.type?.options ?? [])

function openFilterDialog() { showFilterDialog.value = true }

function isNewListing(property) {
  return property.statusBadge?.type === 'new'
}

function parsePriceNum(priceGuide) {
  if (!priceGuide) return 0
  const m = String(priceGuide).match(/(\d+(?:\.\d+)?)([mk]?)/i)
  if (!m) return 0
  const v = parseFloat(m[1])
  const u = m[2].toLowerCase()
  return u === 'm' ? v * 1_000_000 : u === 'k' ? v * 1_000 : v
}

function buildFilterFromValue(key, value) {
  const definition = filterDefinitionMap.value[key]
  if (!definition || !value) return null
  const operatorValue = definition.operators?.[0]?.value ?? 'is'
  const operatorLabel = definition.operators?.find((op) => op.value === operatorValue)?.label ?? operatorValue
  const optionLabel   = definition.options?.find((option) => option.value === value)?.title ?? value
  return {
    id: `${key}-${operatorValue}-${value}-${Date.now()}`,
    key, operator: operatorValue, value,
    label: `${definition.label} ${operatorLabel} ${optionLabel}`,
    labelParts: { field: definition.label, operator: operatorLabel, value: optionLabel },
  }
}

function handleFilterApply(criteria) {
  const uniqueTypes = [...new Set((criteria?.types ?? []).filter(Boolean))]
  const typeFilters = uniqueTypes.map((v) => buildFilterFromValue('type', v)).filter(Boolean)
  const preservedFilters = activeFilters.value.filter(
    (f) => f.key !== 'type' && f.meta?.source !== 'advanced',
  )
  activeFilters.value = [...preservedFilters, ...typeFilters]

  const {
    priceMin = null, priceMax = null, priceHasValue = false,
    bedroomsMin = null, bedroomsMax = null,
    bathroomsMin = null, bathroomsMax = null,
    carSpacesMin = null, landSizeMin = null, landSizeMax = null,
    propertyAge = 'all',
  } = criteria || {}

  advancedCriteria.value = {
    priceMin, priceMax, priceHasValue,
    bedroomsMin, bedroomsMax, bathroomsMin, bathroomsMax,
    carSpacesMin, landSizeMin, landSizeMax, propertyAge,
  }
  showFilterDialog.value = false
}

function handleFilterClear() {
  advancedCriteria.value = createDefaultAdvancedCriteria()
  activeFilters.value = []
}

async function handleAddProperty(payload) {
  const propertyData = payload || newProperty.value
  try {
    await propertyStore.addProperty({ ...propertyData })
    newProperty.value = createEmptyPropertyDraft()
    showAddProperty.value = false
    notifySuccess('Property added')
  } catch (e) {
    notifyFromError(e, 'Failed to save property')
  }
}

function createDefaultAdvancedCriteria() {
  return {
    priceMin: null, priceMax: null, priceHasValue: false,
    bedroomsMin: null, bedroomsMax: null,
    bathroomsMin: null, bathroomsMax: null,
    carSpacesMin: null, landSizeMin: null, landSizeMax: null,
    propertyAge: 'all',
  }
}

function matchesAdvancedCriteria(property, criteria) {
  if (!criteria) return true
  const price = parsePriceGuide(property.priceGuide)
  if (criteria.priceHasValue && !price.hasValue) return false
  if (criteria.priceMin != null) {
    const v = price.min ?? price.max
    if (v == null || v < criteria.priceMin) return false
  }
  if (criteria.priceMax != null) {
    const v = price.max ?? price.min
    if (v == null || v > criteria.priceMax) return false
  }
  if (!matchesRange(property.bedrooms,   criteria.bedroomsMin,  criteria.bedroomsMax))  return false
  if (!matchesRange(property.bathrooms,  criteria.bathroomsMin, criteria.bathroomsMax)) return false
  if (!matchesRange(property.carSpaces,  criteria.carSpacesMin, null))                  return false
  const landSize = getLandSizeSqm(property)
  if (!matchesRange(landSize, criteria.landSizeMin, criteria.landSizeMax)) return false
  if (criteria.propertyAge === 'new'         && !isNewProperty(property)) return false
  if (criteria.propertyAge === 'established' &&  isNewProperty(property)) return false
  return true
}

function isAdvancedCriteriaActive(criteria) {
  if (!criteria) return false
  if (criteria.priceHasValue) return true
  if (criteria.propertyAge && criteria.propertyAge !== 'all') return true
  return ['priceMin','priceMax','bedroomsMin','bedroomsMax','bathroomsMin','bathroomsMax',
          'carSpacesMin','landSizeMin','landSizeMax'].some((f) => criteria[f] != null)
}

function matchesRange(value, min, max) {
  if (value == null) return min == null && max == null
  if (min != null && value < min) return false
  if (max != null && value > max) return false
  return true
}

function parsePriceGuide(priceGuide) {
  if (!priceGuide) return { min: null, max: null, hasValue: false }
  const matches = [...String(priceGuide).matchAll(/(\d+(?:\.\d+)?)([mk]?)/gi)]
  if (!matches.length) return { min: null, max: null, hasValue: false }
  const values = matches.map(([, rawValue, unit]) => {
    const parsed = Number(rawValue)
    if (Number.isNaN(parsed)) return null
    const u = unit?.toLowerCase()
    return parsed * (u === 'm' ? 1_000_000 : u === 'k' ? 1_000 : 1)
  }).filter((v) => v != null)
  if (!values.length) return { min: null, max: null, hasValue: false }
  const [minValue, maxValue] = values
  return { min: minValue ?? null, max: maxValue ?? minValue ?? null, hasValue: true }
}

function getLandSizeSqm(property) {
  if (typeof property?.landSizeSqm === 'number') return property.landSizeSqm
  const match = String(property?.landSize ?? '').replace(/,/g, '').match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

function isNewProperty(property) { return property?.statusBadge?.type === 'new' }

function buildAdvancedFilterChips(criteria) {
  if (!criteria) return []
  const chips = []
  const push = (id, field, fieldLabel, valueLabel) => {
    if (valueLabel) chips.push({
      id: `advanced-${id}`, key: `advanced-${id}`,
      label: `${fieldLabel}: ${valueLabel}`,
      labelParts: { field: fieldLabel, operator: '', value: valueLabel },
      meta: { source: 'advanced', field },
    })
  }
  if (criteria.priceMin != null || criteria.priceMax != null)
    push('price-range', 'priceRange', 'Price', formatRangeLabel(criteria.priceMin, criteria.priceMax, formatCurrencyShort))
  if (criteria.priceHasValue)
    push('price-has-value', 'priceHasValue', 'Price', 'Has price')
  if (criteria.bedroomsMin != null || criteria.bedroomsMax != null)
    push('bedrooms', 'bedrooms', 'Bedrooms', formatCountRange(criteria.bedroomsMin, criteria.bedroomsMax))
  if (criteria.bathroomsMin != null || criteria.bathroomsMax != null)
    push('bathrooms', 'bathrooms', 'Bathrooms', formatCountRange(criteria.bathroomsMin, criteria.bathroomsMax))
  if (criteria.carSpacesMin != null)
    push('car-spaces', 'carSpaces', 'Car spaces', `${criteria.carSpacesMin}+`)
  if (criteria.landSizeMin != null || criteria.landSizeMax != null)
    push('land-size', 'landSize', 'Land size', formatRangeLabel(criteria.landSizeMin, criteria.landSizeMax, (v) => `${v} m²`))
  if (criteria.propertyAge && criteria.propertyAge !== 'all')
    push('property-age', 'propertyAge', 'Property age', criteria.propertyAge === 'new' ? 'New' : 'Established')
  return chips
}

function clearAdvancedField(field) {
  const patch = {
    priceRange:    { priceMin: null, priceMax: null },
    priceHasValue: { priceHasValue: false },
    bedrooms:      { bedroomsMin: null, bedroomsMax: null },
    bathrooms:     { bathroomsMin: null, bathroomsMax: null },
    carSpaces:     { carSpacesMin: null },
    landSize:      { landSizeMin: null, landSizeMax: null },
    propertyAge:   { propertyAge: 'all' },
  }[field]
  if (patch) advancedCriteria.value = { ...advancedCriteria.value, ...patch }
}

function formatRangeLabel(min, max, fmt) {
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`
  if (min != null) return `${fmt(min)}+`
  if (max != null) return `≤ ${fmt(max)}`
  return ''
}

function formatCountRange(min, max) {
  if (min != null && max != null) return `${min}-${max}`
  if (min != null) return `${min}+`
  if (max != null) return `≤ ${max}`
  return ''
}

function formatCurrencyShort(value) {
  if (value == null) return ''
  if (value >= 1_000_000) return `$${value % 1_000_000 === 0 ? (value / 1_000_000).toFixed(0) : (value / 1_000_000).toFixed(1)}m`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value}`
}
</script>

<style scoped>
.prop-shell {
  padding: 24px 28px 40px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.prop-empty {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 1100px) { .prop-shell { padding: 20px 20px 32px; } }
@media (max-width: 720px)  { .prop-shell { padding: 14px 12px 24px; gap: 14px; } }

@media (max-width: 600px) {
  .prop-add-btn { width: 36px; padding: 0; }
  .prop-add-label { display: none; }
}
</style>
