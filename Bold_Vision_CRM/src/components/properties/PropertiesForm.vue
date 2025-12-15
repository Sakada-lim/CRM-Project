<template>
  <div class="property-form">
    <section class="filter-section">
      <div class="section-header">
        <p class="section-title">Basic details</p>
      </div>
      <div class="input-grid">
        <v-text-field
          v-model="form.address"
          label="Street address"
          variant="outlined"
          density="comfortable"
          hide-details
          required
          class="wide"
          name="street-address"
          autocomplete="street-address"
        />
        <v-text-field
          v-model="form.suburb"
          label="Suburb"
          variant="outlined"
          density="comfortable"
          hide-details
          name="address-level2"
          autocomplete="address-level2"
        />
        <v-select
          v-model="form.state"
          :items="stateOptions"
          label="State"
          variant="outlined"
          density="comfortable"
          hide-details
          name="address-level1"
          autocomplete="address-level1"
        />
        <v-text-field
          v-model="form.postcode"
          label="Postcode"
          variant="outlined"
          density="comfortable"
          hide-details
          name="postal-code"
          autocomplete="postal-code"
        />
        <v-text-field
          v-model="form.code"
          label="Internal code"
          hint="e.g. PROP-001"
          persistent-hint
          variant="outlined"
          density="comfortable"
          hide-details
          autocomplete="off"
          name="internal-code"
        />
      </div>
    </section>

    <section class="filter-section">
      <div class="section-header">
        <p class="section-title">Status & pricing</p>
      </div>
      <div class="input-grid">
        <v-select
          v-model="form.type"
          :items="typeOptions"
          label="Property type"
          variant="outlined"
          density="comfortable"
          hide-details
          required
        />
        <v-select
          v-model="form.status"
          :items="statusOptions"
          label="Status"
          variant="outlined"
          density="comfortable"
          hide-details
          required
        />
        <v-text-field
          v-model="form.priceGuide"
          label="Price guide"
          hint="e.g. $850k–$900k"
          persistent-hint
          variant="outlined"
          density="comfortable"
          hide-details
        />
        <v-text-field
          v-model="form.listedAt"
          type="date"
          label="Listed date"
          variant="outlined"
          density="comfortable"
          hide-details
          autocomplete="off"
        />
      </div>
    </section>

    <section class="filter-section">
      <div class="section-header">
        <p class="section-title">Layout & dimensions</p>
      </div>
      <div class="input-grid">
        <v-text-field
          :model-value="form.bedrooms"
          type="number"
          min="0"
          label="Bedrooms"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="(val) => updateNumberField('bedrooms', val)"
        />
        <v-text-field
          :model-value="form.bathrooms"
          type="number"
          min="0"
          label="Bathrooms"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="(val) => updateNumberField('bathrooms', val)"
        />
        <v-text-field
          :model-value="form.carSpaces"
          type="number"
          min="0"
          label="Car spaces"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="(val) => updateNumberField('carSpaces', val, { mirrorField: 'carparkSpaces' })"
        />
        <v-text-field
          :model-value="form.landSizeSqm"
          type="number"
          min="0"
          label="Land size (sqm)"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="(val) => updateNumberField('landSizeSqm', val, { labelField: 'landSize' })"
        />
        <v-text-field
          :model-value="form.houseSizeSqm"
          type="number"
          min="0"
          label="House size (sqm)"
          variant="outlined"
          density="comfortable"
          hide-details
          @update:model-value="(val) => updateNumberField('houseSizeSqm', val, { labelField: 'houseSize' })"
        />
      </div>
    </section>

    <section class="filter-section">
      <div class="section-header">
        <p class="section-title">Notes & description</p>
      </div>
      <div class="input-grid">
        <v-textarea
          v-model="form.description"
          label="Public description"
          rows="4"
          variant="outlined"
          density="comfortable"
          hide-details
          class="wide"
        />
        <v-textarea
          v-model="form.notes"
          label="Internal notes"
          rows="4"
          variant="outlined"
          density="comfortable"
          hide-details
          class="wide"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const typeOptions = ['House', 'Townhouse', 'Villa', 'Apartment']
const statusOptions = ['On Market', 'Under Offer', 'Sold']
const stateOptions = ['VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const form = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

function updateNumberField(field, value, options = {}) {
  const numericValue = value === '' || value == null ? null : Number(value)
  form.value[field] = Number.isNaN(numericValue) ? null : numericValue

  if (options.mirrorField) {
    form.value[options.mirrorField] = form.value[field]
  }

  if (options.labelField) {
    form.value[options.labelField] =
      form.value[field] == null ? '' : `${form.value[field]} m²`
  }
}
</script>

<style scoped src="../../assets/styles/components/filterDialog.css"></style>

<style scoped>
.property-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.input-grid .wide {
  grid-column: 1 / -1;
}
</style>
