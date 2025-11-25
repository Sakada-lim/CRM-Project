<template>
  <v-dialog
    v-model="isOpen"
    :max-width="640"
    transition="dialog-transition"
    :scrim="'rgba(15,23,42,0.65)'"
  >
    <v-card class="filter-dialog-card">
      <header class="dialog-header">
        <h2 class="dialog-title">Filter</h2>
        <v-btn icon variant="text" density="comfortable" class="dialog-close" @click="close">
          <v-icon icon="mdi-close" size="20" />
        </v-btn>
      </header>

      <div class="dialog-body" tabindex="-1">
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
        <section class="filter-section">
          <div class="section-header">
            <p class="section-title">Price</p>
            <v-btn variant="text" size="small" class="text-capitalize" @click="clearPriceRange">
              Clear
            </v-btn>
          </div>
          <div class="range-grid">
            <div class="range-field">
              <p class="field-label">Min</p>
              <v-select
                v-model="draft.priceMin"
                :items="priceOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </div>
            <div class="range-field">
              <p class="field-label">Max</p>
              <v-select
                v-model="draft.priceMax"
                :items="priceOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </div>
          </div>
          <v-checkbox
            v-model="draft.priceHasValue"
            label="Only show properties with a price"
            color="primary"
            density="comfortable"
            hide-details
          />
        </section>

        <section class="filter-section">
          <div class="section-header">
            <p class="section-title">Bedrooms</p>
            <v-btn variant="text" size="small" class="text-capitalize" @click="clearBedrooms">
              Clear
            </v-btn>
          </div>
          <div class="range-grid">
            <div class="range-field">
              <p class="field-label">Min</p>
              <v-select
                v-model="draft.bedroomsMin"
                :items="bedroomOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </div>
            <div class="range-field">
              <p class="field-label">Max</p>
              <v-select
                v-model="draft.bedroomsMax"
                :items="bedroomOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </div>
          </div>
        </section>

        <section class="filter-section">
          <div class="section-header">
            <p class="section-title">Bathrooms</p>
            <v-btn variant="text" size="small" class="text-capitalize" @click="clearBathrooms">
              Clear
            </v-btn>
          </div>
          <div class="range-grid">
            <div class="range-field">
              <p class="field-label">Min</p>
              <v-select
                v-model="draft.bathroomsMin"
                :items="bathroomOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </div>
            <div class="range-field">
              <p class="field-label">Max</p>
              <v-select
                v-model="draft.bathroomsMax"
                :items="bathroomOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </div>
          </div>
        </section>

        <section class="filter-section">
          <div class="section-header">
            <p class="section-title">Car spaces</p>
            <v-btn variant="text" size="small" class="text-capitalize" @click="clearCarSpaces">
              Clear
            </v-btn>
          </div>
          <div class="single-field">
            <p class="field-label">Minimum</p>
            <v-select
              v-model="draft.carSpacesMin"
              :items="carSpaceOptions"
              item-title="label"
              item-value="value"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </div>
        </section>

        <section class="filter-section">
          <div class="section-header">
            <p class="section-title">Land size</p>
            <v-btn variant="text" size="small" class="text-capitalize" @click="clearLandSize">
              Clear
            </v-btn>
          </div>
          <div class="range-grid">
            <div class="range-field">
              <p class="field-label">Min</p>
              <v-select
                v-model="draft.landSizeMin"
                :items="landSizeOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </div>
            <div class="range-field">
              <p class="field-label">Max</p>
              <v-select
                v-model="draft.landSizeMax"
                :items="landSizeOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </div>
          </div>
        </section>

        <section class="filter-section">
          <div class="section-header">
            <p class="section-title">New or established property</p>
            <v-btn variant="text" size="small" class="text-capitalize" @click="clearPropertyAge">
              Clear
            </v-btn>
          </div>
          <v-radio-group v-model="draft.propertyAge" inline class="age-radios">
            <v-radio
              v-for="option in propertyAgeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
              color="primary"
              density="comfortable"
              hide-details
            />
          </v-radio-group>
        </section>
      </div>

      <footer class="dialog-footer">
        <v-btn variant="text" class="text-capitalize" @click="handleClear"> Clear all </v-btn>
        <v-spacer />
        <v-btn variant="text" class="text-capitalize" @click="close">Cancel</v-btn>
        <v-btn color="primary" class="text-capitalize" @click="handleApply">Apply</v-btn>
      </footer>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useFilterDialogState } from '../../composables/useFilterDialogState'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  criteria: {
    type: Object,
    default: () => ({
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
      types: [],
    }),
  },
  typeOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'apply', 'clear'])

const { draft, isOpen, close } = useFilterDialogState({
  props,
  emit,
  createEmptyDraft: () => ({
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
    types: [],
  }),
  mapCriteriaToDraft: (criteria = {}) => ({
    priceMin: criteria?.priceMin ?? null,
    priceMax: criteria?.priceMax ?? null,
    priceHasValue: Boolean(criteria?.priceHasValue),
    bedroomsMin: criteria?.bedroomsMin ?? null,
    bedroomsMax: criteria?.bedroomsMax ?? null,
    bathroomsMin: criteria?.bathroomsMin ?? null,
    bathroomsMax: criteria?.bathroomsMax ?? null,
    carSpacesMin: criteria?.carSpacesMin ?? null,
    landSizeMin: criteria?.landSizeMin ?? null,
    landSizeMax: criteria?.landSizeMax ?? null,
    propertyAge: criteria?.propertyAge ?? 'all',
    types: Array.isArray(criteria?.types) ? [...criteria.types] : [],
  }),
})

const priceStops = [
  200000, 300000, 400000, 500000, 600000, 800000, 1000000, 1200000, 1500000, 2000000,
]
const priceOptions = computed(() => [
  { label: 'Any', value: null },
  ...priceStops.map((value) => ({ label: formatCurrency(value), value })),
])

const bedroomOptions = computed(() => buildCountOptions(5))
const bathroomOptions = computed(() => buildCountOptions(4))
const carSpaceOptions = computed(() => buildCountOptions(4, 0))
const landSizeOptions = computed(() =>
  [{ label: 'Any', value: null }, 200, 300, 400, 600, 800, 1000, 1500, 2000].map((value) =>
    typeof value === 'number' ? { label: `${value} m²`, value } : value,
  ),
)
const propertyAgeOptions = [
  { label: 'All types', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Established', value: 'established' },
]

function formatCurrency(value) {
  if (!value) return 'Any'
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}m`
  }
  return `$${Math.round(value / 1000)}k`
}

function buildCountOptions(max, start = 1) {
  const items = [{ label: 'Any', value: null }]
  for (let i = start; i <= max; i += 1) {
    const label = i === max ? `${i}+` : `${i}`
    items.push({ label, value: i })
  }
  if (start === 0) {
    items[1] = { label: '0', value: 0 }
  }
  return items
}

function clearTypes() {
  draft.types = []
}

function clearPriceRange() {
  draft.priceMin = null
  draft.priceMax = null
  draft.priceHasValue = false
}

function clearBedrooms() {
  draft.bedroomsMin = null
  draft.bedroomsMax = null
}

function clearBathrooms() {
  draft.bathroomsMin = null
  draft.bathroomsMax = null
}

function clearCarSpaces() {
  draft.carSpacesMin = null
}

function clearLandSize() {
  draft.landSizeMin = null
  draft.landSizeMax = null
}

function clearPropertyAge() {
  draft.propertyAge = 'all'
}

function normalizeRange(min, max) {
  if (min != null && max != null && min > max) {
    return [max, min]
  }
  return [min ?? null, max ?? null]
}

function handleClear() {
  clearPriceRange()
  clearBedrooms()
  clearBathrooms()
  clearCarSpaces()
  clearLandSize()
  clearPropertyAge()
  draft.types = []
  emit('clear')
}

function handleApply() {
  const [priceMin, priceMax] = normalizeRange(draft.priceMin, draft.priceMax)
  const [bedroomsMin, bedroomsMax] = normalizeRange(draft.bedroomsMin, draft.bedroomsMax)
  const [bathroomsMin, bathroomsMax] = normalizeRange(draft.bathroomsMin, draft.bathroomsMax)
  const [landSizeMin, landSizeMax] = normalizeRange(draft.landSizeMin, draft.landSizeMax)

  emit('apply', {
    priceMin,
    priceMax,
    priceHasValue: draft.priceHasValue,
    bedroomsMin,
    bedroomsMax,
    bathroomsMin,
    bathroomsMax,
    carSpacesMin: draft.carSpacesMin,
    landSizeMin,
    landSizeMax,
    propertyAge: draft.propertyAge,
    types: [...draft.types],
  })
  close()
}
</script>

<style scoped src="../../assets/styles/components/filterDialog.css"></style>
