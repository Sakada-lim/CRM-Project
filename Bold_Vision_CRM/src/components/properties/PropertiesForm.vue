<template>
  <div class="property-form">

    <!-- ── Basic details ─────────────────────────────────────── -->
    <section class="pd-section">
      <h4 class="pd-section-head">Basic details</h4>

      <div class="field-stack">
        <div class="field" :class="{ 'is-error': errors.address }">
          <label for="pf-address">Street address</label>
          <input
            id="pf-address"
            v-model="form.address"
            class="input"
            type="text"
            name="street-address"
            autocomplete="street-address"
            placeholder="e.g. 12 Main Street"
            required
            :maxlength="LIMITS.address.max"
            @input="clearError('address')"
            @blur="validateFieldNamed('address')"
          />
          <p v-if="errors.address" class="field-error">{{ errors.address }}</p>
        </div>

        <div class="grid-2-1-1">
          <div class="field" :class="{ 'is-error': errors.suburb }">
            <label for="pf-suburb">Suburb</label>
            <input
              id="pf-suburb"
              v-model="form.suburb"
              class="input"
              type="text"
              name="address-level2"
              autocomplete="address-level2"
              :maxlength="LIMITS.suburb.max"
              @input="clearError('suburb')"
              @blur="validateFieldNamed('suburb')"
            />
            <p v-if="errors.suburb" class="field-error">{{ errors.suburb }}</p>
          </div>
          <div class="field">
            <label for="pf-state">State</label>
            <select
              id="pf-state"
              v-model="form.state"
              class="select"
              name="address-level1"
              autocomplete="address-level1"
            >
              <option v-for="s in stateOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="field" :class="{ 'is-error': errors.postcode }">
            <label for="pf-postcode">Postcode</label>
            <input
              id="pf-postcode"
              v-model="form.postcode"
              class="input"
              type="text"
              inputmode="numeric"
              name="postal-code"
              autocomplete="postal-code"
              maxlength="4"
              @input="clearError('postcode')"
              @blur="validateFieldNamed('postcode')"
            />
            <p v-if="errors.postcode" class="field-error">{{ errors.postcode }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Status & pricing ──────────────────────────────────── -->
    <section class="pd-section">
      <div class="pd-section-row">
        <h4 class="pd-section-head">Status &amp; pricing</h4>
        <span v-if="priceDisplay" class="pd-section-chip">
          <span class="dot" />{{ priceDisplay }}
        </span>
      </div>

      <div class="field-stack">
        <div class="grid-4">
          <div class="field">
            <label for="pf-type">Property type</label>
            <select id="pf-type" v-model="form.type" class="select" required>
              <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="field">
            <label for="pf-status">Status</label>
            <select id="pf-status" v-model="form.status" class="select" required>
              <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="field" :class="{ 'is-error': errors.priceMin }">
            <label for="pf-price-min">Price (min)</label>
            <div class="input-affix">
              <span class="prefix">$</span>
              <input
                id="pf-price-min"
                v-model="priceMinInput"
                class="input has-prefix"
                type="text"
                placeholder="e.g. 850k or 1.2m"
                autocomplete="off"
                @input="clearError('priceMin'); clearError('priceMax')"
                @blur="normalizePriceInput('min'); validateFieldNamed('priceMin'); validateFieldNamed('priceMax')"
              />
            </div>
            <p v-if="errors.priceMin" class="field-error">{{ errors.priceMin }}</p>
          </div>
          <div class="field" :class="{ 'is-error': errors.priceMax }">
            <label for="pf-price-max">Price (max)</label>
            <div class="input-affix">
              <span class="prefix">$</span>
              <input
                id="pf-price-max"
                v-model="priceMaxInput"
                class="input has-prefix"
                type="text"
                placeholder="optional"
                autocomplete="off"
                @input="clearError('priceMax')"
                @blur="normalizePriceInput('max'); validateFieldNamed('priceMax')"
              />
            </div>
            <p v-if="errors.priceMax" class="field-error">{{ errors.priceMax }}</p>
          </div>
        </div>

        <div class="narrow-field">
          <div class="field">
            <label for="pf-listed">Listed date</label>
            <input
              id="pf-listed"
              v-model="listedAtInput"
              class="input"
              type="date"
              autocomplete="off"
            />
          </div>
        </div>
      </div>

    </section>

    <!-- ── Layout & dimensions ───────────────────────────────── -->
    <section class="pd-section">
      <div class="pd-section-row">
        <h4 class="pd-section-head">Layout &amp; dimensions</h4>
        <span v-if="sizeSummary" class="pd-section-chip">
          <span class="dot" />{{ sizeSummary }}
        </span>
      </div>

      <div class="grid-5">
        <div class="field" :class="{ 'is-error': errors.bedrooms }">
          <label for="pf-bedrooms">Bedrooms</label>
          <input
            id="pf-bedrooms"
            :value="form.bedrooms"
            class="input"
            type="number"
            min="0"
            :max="LIMITS.bedrooms.max"
            @input="(e) => { updateNumberField('bedrooms', e.target.value); clearError('bedrooms') }"
            @blur="validateFieldNamed('bedrooms')"
          />
          <p v-if="errors.bedrooms" class="field-error">{{ errors.bedrooms }}</p>
        </div>
        <div class="field" :class="{ 'is-error': errors.bathrooms }">
          <label for="pf-bathrooms">Bathrooms</label>
          <input
            id="pf-bathrooms"
            :value="form.bathrooms"
            class="input"
            type="number"
            min="0"
            :max="LIMITS.bathrooms.max"
            @input="(e) => { updateNumberField('bathrooms', e.target.value); clearError('bathrooms') }"
            @blur="validateFieldNamed('bathrooms')"
          />
          <p v-if="errors.bathrooms" class="field-error">{{ errors.bathrooms }}</p>
        </div>
        <div class="field" :class="{ 'is-error': errors.carSpaces }">
          <label for="pf-cars">Car spaces</label>
          <input
            id="pf-cars"
            :value="form.carSpaces"
            class="input"
            type="number"
            min="0"
            :max="LIMITS.carSpaces.max"
            @input="(e) => { updateNumberField('carSpaces', e.target.value, { mirrorField: 'carparkSpaces' }); clearError('carSpaces') }"
            @blur="validateFieldNamed('carSpaces')"
          />
          <p v-if="errors.carSpaces" class="field-error">{{ errors.carSpaces }}</p>
        </div>
        <div class="field" :class="{ 'is-error': errors.landSizeSqm }">
          <label for="pf-land">Land size</label>
          <div class="input-affix">
            <input
              id="pf-land"
              v-model="landSizeInput"
              class="input has-suffix"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              @input="clearError('landSizeSqm')"
              @blur="normalizeSqmInput('land'); validateFieldNamed('landSizeSqm')"
            />
            <span class="suffix">m²</span>
          </div>
          <p v-if="errors.landSizeSqm" class="field-error">{{ errors.landSizeSqm }}</p>
        </div>
        <div class="field" :class="{ 'is-error': errors.houseSizeSqm }">
          <label for="pf-house">House size</label>
          <div class="input-affix">
            <input
              id="pf-house"
              v-model="houseSizeInput"
              class="input has-suffix"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              @input="clearError('houseSizeSqm')"
              @blur="normalizeSqmInput('house'); validateFieldNamed('houseSizeSqm')"
            />
            <span class="suffix">m²</span>
          </div>
          <p v-if="errors.houseSizeSqm" class="field-error">{{ errors.houseSizeSqm }}</p>
        </div>
      </div>

    </section>

    <!-- ── Notes & description ───────────────────────────────── -->
    <section class="pd-section">
      <h4 class="pd-section-head">Notes &amp; description</h4>

      <div class="field-stack">
        <div class="field" :class="{ 'is-error': errors.description }">
          <label for="pf-description">Public description</label>
          <textarea
            id="pf-description"
            v-model="form.description"
            class="textarea"
            rows="4"
            placeholder="Shown on the listing"
            :maxlength="LIMITS.description.max"
            @input="clearError('description')"
            @blur="validateFieldNamed('description')"
          />
          <p v-if="errors.description" class="field-error">{{ errors.description }}</p>
        </div>
        <div class="field" :class="{ 'is-error': errors.notes }">
          <label for="pf-notes">Internal notes</label>
          <textarea
            id="pf-notes"
            v-model="form.notes"
            class="textarea"
            rows="3"
            placeholder="Only visible to your team"
            :maxlength="LIMITS.notes.max"
            @input="clearError('notes')"
            @blur="validateFieldNamed('notes')"
          />
          <p v-if="errors.notes" class="field-error">{{ errors.notes }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { formatPrice, formatPriceSingle, parsePriceInput, formatSqm } from '../../utils/formatters'
import { validatePropertyForm, LIMITS } from '../../utils/validators'
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '../../constants/enums'

const typeOptions = PROPERTY_TYPES
const statusOptions = PROPERTY_STATUSES
const stateOptions = ['VIC', 'NSW', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const form = computed({
  get() { return props.modelValue },
  set(val) { emit('update:modelValue', val) },
})

// Price inputs are kept as local strings so the user can type freely ("1m",
// "850k", "1,500,000"); we parse them into form.priceMin / form.priceMax and
// only normalize the visible string on blur.
const priceMinInput = ref(form.value.priceMin != null ? formatPriceSingle(form.value.priceMin) : '')
const priceMaxInput = ref(form.value.priceMax != null ? formatPriceSingle(form.value.priceMax) : '')

watch(() => form.value.priceMin, (val) => {
  const parsed = parsePriceInput(priceMinInput.value)
  if (parsed !== val) priceMinInput.value = val != null ? formatPriceSingle(val) : ''
})
watch(() => form.value.priceMax, (val) => {
  const parsed = parsePriceInput(priceMaxInput.value)
  if (parsed !== val) priceMaxInput.value = val != null ? formatPriceSingle(val) : ''
})

watch(priceMinInput, (val) => { form.value.priceMin = parsePriceInput(val) })
watch(priceMaxInput, (val) => { form.value.priceMax = parsePriceInput(val) })

const priceDisplay = computed(() => formatPrice(form.value.priceMin, form.value.priceMax))

// Mirror display string back to priceGuide so downstream code (broadcasts,
// sorting, card display) keeps working without further changes.
watch(priceDisplay, (val) => { form.value.priceGuide = val }, { immediate: true })

function normalizePriceInput(which) {
  if (which === 'min' && form.value.priceMin != null) {
    priceMinInput.value = formatPriceSingle(form.value.priceMin)
  }
  if (which === 'max' && form.value.priceMax != null) {
    priceMaxInput.value = formatPriceSingle(form.value.priceMax)
  }
}

// Land / house size — text inputs with thousands-separator formatting on blur.
function parseSqmInput(str) {
  if (str == null || str === '') return null
  const cleaned = String(str).replace(/[,\s]/g, '').replace(/m²?$/i, '')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
}
function formatSqmInputValue(n) {
  return n == null ? '' : n.toLocaleString('en-AU')
}

const landSizeInput  = ref(formatSqmInputValue(form.value.landSizeSqm))
const houseSizeInput = ref(formatSqmInputValue(form.value.houseSizeSqm))

watch(landSizeInput, (val) => {
  const n = parseSqmInput(val)
  form.value.landSizeSqm = n
  form.value.landSize = formatSqm(n)
})
watch(houseSizeInput, (val) => {
  const n = parseSqmInput(val)
  form.value.houseSizeSqm = n
  form.value.houseSize = formatSqm(n)
})
watch(() => form.value.landSizeSqm, (val) => {
  if (parseSqmInput(landSizeInput.value) !== val) {
    landSizeInput.value = formatSqmInputValue(val)
  }
})
watch(() => form.value.houseSizeSqm, (val) => {
  if (parseSqmInput(houseSizeInput.value) !== val) {
    houseSizeInput.value = formatSqmInputValue(val)
  }
})

function normalizeSqmInput(which) {
  if (which === 'land' && form.value.landSizeSqm != null) {
    landSizeInput.value = formatSqmInputValue(form.value.landSizeSqm)
  }
  if (which === 'house' && form.value.houseSizeSqm != null) {
    houseSizeInput.value = formatSqmInputValue(form.value.houseSizeSqm)
  }
}

const sizeSummary = computed(() => {
  const parts = []
  if (form.value.landSizeSqm)  parts.push(`Land ${formatSqm(form.value.landSizeSqm)}`)
  if (form.value.houseSizeSqm) parts.push(`House ${formatSqm(form.value.houseSizeSqm)}`)
  return parts.join(' · ')
})

// listed_at may arrive as an ISO datetime ("2026-05-18T00:00:00+00:00") or
// a plain date string. <input type="date"> only displays "YYYY-MM-DD", so
// strip to the date portion on get and pass the date string through on set.
const listedAtInput = computed({
  get() {
    const v = form.value.listedAt
    return v ? String(v).slice(0, 10) : ''
  },
  set(v) {
    form.value.listedAt = v || null
  },
})

function updateNumberField(field, value, options = {}) {
  const numericValue = value === '' || value == null ? null : Number(value)
  form.value[field] = Number.isNaN(numericValue) ? null : numericValue

  if (options.mirrorField) {
    form.value[options.mirrorField] = form.value[field]
  }
}

// ── Validation ────────────────────────────────────────────────────────────
const errors = ref({})

function clearError(field) {
  if (errors.value[field]) {
    const { [field]: _, ...rest } = errors.value
    errors.value = rest
  }
}

// Run the full composite validator but surface only the requested field's
// error. Keeps the priceMin/priceMax cross-check live across both blur events.
function validateFieldNamed(field) {
  const all = validatePropertyForm(form.value) ?? {}
  if (all[field]) errors.value = { ...errors.value, [field]: all[field] }
  else clearError(field)
}

// Called from the parent before save. Populates `errors` and returns the
// errors object (or null if clean).
function validate() {
  const result = validatePropertyForm(form.value)
  errors.value = result ?? {}
  return result
}

defineExpose({ validate })
</script>

<style scoped>
.property-form { display: flex; flex-direction: column; }

/* Inner stacks within a section */
.field-stack { display: flex; flex-direction: column; gap: 16px; }

/* Section-specific grids — match the reference */
.grid-2-1-1 {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 12px;
}
.grid-4 {
  display: grid;
  /* Type + status carry the long enum values (e.g. "10/90 One-Part Contract",
     "Under Construction") so they get double the share of the row. */
  grid-template-columns: 2fr 2fr 1fr 1fr;
  gap: 12px;
}
.grid-5 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

/* Listed date — narrow standalone field */
.narrow-field { max-width: 240px; }

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 900px) {
  .grid-4 { grid-template-columns: 1fr 1fr; }
  .grid-5 { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 600px) {
  .grid-2-1-1 { grid-template-columns: 1fr; }
  .grid-4     { grid-template-columns: 1fr 1fr; }
  .grid-5     { grid-template-columns: 1fr 1fr; }
  .narrow-field { max-width: none; }
}
</style>
