<template>
  <section id="personal" class="afm-section">
    <div class="head">
      <span class="num">1</span>
      <div style="flex:1;min-width:0">
        <h2>Personal information</h2>
        <div class="desc">Identity, residency, and primary contact details.</div>
      </div>
    </div>

    <!-- Phone-only client toggle -->
    <div v-if="isPhone" class="seg-control afm-client-toggle">
      <button type="button" :aria-pressed="activeClient === 'client1'"
              @click="setActiveClient('client1')">Client 1</button>
      <button type="button" :aria-pressed="activeClient === 'client2'"
              @click="setActiveClient('client2')">Client 2 (optional)</button>
    </div>

    <div class="afm-twocol">
      <div></div>
      <div class="col-head">Client 1</div>
      <div class="col-head">Client 2 (optional)</div>

      <!-- Full name -->
      <div class="row-label">Full name</div>
      <input v-if="showC1" class="input" type="text" placeholder="Full name"
             :maxlength="LIMITS.assessmentText.max"
             :value="c1.fullName"
             @input="patch('client1', { fullName: $event.target.value })" />
      <input v-if="showC2" class="input" type="text" placeholder="Full name"
             :maxlength="LIMITS.assessmentText.max"
             :value="c2.fullName"
             @input="patch('client2', { fullName: $event.target.value })" />

      <!-- DOB · age -->
      <div class="row-label">Date of birth · age</div>
      <div v-if="showC1" :class="['afm-field-with-na', { 'afm-na-on': !!c1.na?.dobDate }]">
        <div class="afm-dob-row">
          <input class="input" type="date"
                 :max="todayIso"
                 :value="c1.dobDate"
                 @input="onDobChange('client1', $event.target.value)" />
          <div class="input-affix afm-dob-age">
            <input class="input has-suffix" type="number" placeholder="Age"
                   min="0" max="120"
                   :value="c1.age"
                   @input="patch('client1', { age: clampInt($event.target.value, 0, 120) })" />
            <span class="suffix">yrs</span>
          </div>
        </div>
        <NAButton :active="!!c1.na?.dobDate" @toggle="toggleNA('client1', 'dobDate', { dobDate: '', age: '', dob: '' })" />
      </div>
      <div v-if="showC2" :class="['afm-field-with-na', { 'afm-na-on': !!c2.na?.dobDate }]">
        <div class="afm-dob-row">
          <input class="input" type="date"
                 :max="todayIso"
                 :value="c2.dobDate"
                 @input="onDobChange('client2', $event.target.value)" />
          <div class="input-affix afm-dob-age">
            <input class="input has-suffix" type="number" placeholder="Age"
                   min="0" max="120"
                   :value="c2.age"
                   @input="patch('client2', { age: clampInt($event.target.value, 0, 120) })" />
            <span class="suffix">yrs</span>
          </div>
        </div>
        <NAButton :active="!!c2.na?.dobDate" @toggle="toggleNA('client2', 'dobDate', { dobDate: '', age: '', dob: '' })" />
      </div>

      <!-- Marital status -->
      <div class="row-label">Marital status</div>
      <select v-if="showC1" class="select"
              :value="c1.maritalStatus || 'Married'"
              @change="patch('client1', { maritalStatus: $event.target.value })">
        <option v-for="o in MARITAL_OPTIONS" :key="o">{{ o }}</option>
      </select>
      <select v-if="showC2" class="select"
              :value="c2.maritalStatus || 'Married'"
              @change="patch('client2', { maritalStatus: $event.target.value })">
        <option v-for="o in MARITAL_OPTIONS" :key="o">{{ o }}</option>
      </select>

      <!-- Dependants -->
      <div class="row-label">Dependants</div>
      <div v-if="showC1" :class="['afm-field-with-na', { 'afm-na-on': !!c1.na?.dependants }]">
        <input class="input" type="text"
               :placeholder="c1.na?.dependants ? 'N/A' : 'No. & ages (e.g. 2 · 6, 8)'"
               :maxlength="LIMITS.assessmentText.max"
               :value="c1.dependants"
               @input="patch('client1', { dependants: $event.target.value })" />
        <NAButton :active="!!c1.na?.dependants" @toggle="toggleNA('client1', 'dependants', { dependants: '' })" />
      </div>
      <div v-if="showC2" :class="['afm-field-with-na', { 'afm-na-on': !!c2.na?.dependants }]">
        <input class="input" type="text"
               :placeholder="c2.na?.dependants ? 'N/A' : 'No. & ages'"
               :maxlength="LIMITS.assessmentText.max"
               :value="c2.dependants"
               @input="patch('client2', { dependants: $event.target.value })" />
        <NAButton :active="!!c2.na?.dependants" @toggle="toggleNA('client2', 'dependants', { dependants: '' })" />
      </div>

      <!-- Residency -->
      <div class="row-label">Residency</div>
      <div v-if="showC1" class="afm-residency-cell">
        <div class="seg-control">
          <button v-for="opt in RESIDENCY_OPTIONS" :key="opt"
                  type="button"
                  :aria-pressed="(c1.residency || 'Citizen') === opt"
                  @click="patch('client1', { residency: opt })">{{ opt }}</button>
        </div>
        <input v-if="c1.residency === 'Other'"
               class="input afm-residency-other" type="text"
               placeholder="Specify (e.g. Work visa, 491)"
               maxlength="100"
               :value="c1.residencyOther"
               @input="patch('client1', { residencyOther: $event.target.value })" />
      </div>
      <div v-if="showC2" class="afm-residency-cell">
        <div class="seg-control">
          <button v-for="opt in RESIDENCY_OPTIONS" :key="opt"
                  type="button"
                  :aria-pressed="(c2.residency || 'Citizen') === opt"
                  @click="patch('client2', { residency: opt })">{{ opt }}</button>
        </div>
        <input v-if="c2.residency === 'Other'"
               class="input afm-residency-other" type="text"
               placeholder="Specify (e.g. Work visa, 491)"
               maxlength="100"
               :value="c2.residencyOther"
               @input="patch('client2', { residencyOther: $event.target.value })" />
      </div>

      <!-- Phone -->
      <div class="row-label">Phone</div>
      <div v-if="showC1" class="input-affix">
        <span class="prefix"><AppIcon name="phone" :size="14" /></span>
        <input class="input has-prefix" type="tel" placeholder="04xx xxx xxx"
               :maxlength="LIMITS.phone.max"
               :value="c1.phone"
               @input="patch('client1', { phone: $event.target.value })" />
      </div>
      <div v-if="showC2" class="input-affix">
        <span class="prefix"><AppIcon name="phone" :size="14" /></span>
        <input class="input has-prefix" type="tel" placeholder="04xx xxx xxx"
               :maxlength="LIMITS.phone.max"
               :value="c2.phone"
               @input="patch('client2', { phone: $event.target.value })" />
      </div>

      <!-- Home address -->
      <div class="row-label">Home address</div>
      <div v-if="showC1" :class="['afm-field-with-na', { 'afm-na-on': !!c1.na?.address }]">
        <div class="input-affix">
          <span class="prefix"><AppIcon name="pin" :size="14" /></span>
          <input class="input has-prefix" type="text"
                 :placeholder="c1.na?.address ? 'N/A' : 'Street, suburb, state, postcode'"
                 :maxlength="LIMITS.address.max"
                 :value="c1.address"
                 @input="patch('client1', { address: $event.target.value })" />
        </div>
        <NAButton :active="!!c1.na?.address" @toggle="toggleNA('client1', 'address', { address: '' })" />
      </div>
      <div v-if="showC2" :class="['afm-field-with-na', { 'afm-na-on': !!c2.na?.address }]">
        <div class="input-affix">
          <span class="prefix"><AppIcon name="pin" :size="14" /></span>
          <input class="input has-prefix" type="text"
                 :placeholder="c2.na?.address ? 'N/A' : 'Same as Client 1'"
                 :maxlength="LIMITS.address.max"
                 :value="c2.address"
                 @input="patch('client2', { address: $event.target.value })" />
        </div>
        <NAButton :active="!!c2.na?.address" @toggle="toggleNA('client2', 'address', { address: '' })" />
      </div>

      <!-- Housing status -->
      <div class="row-label">Housing status</div>
      <div v-if="showC1" class="seg-control">
        <button v-for="opt in HOUSING_OPTIONS" :key="opt"
                type="button"
                :aria-pressed="(c1.housingStatus || 'Owner') === opt"
                @click="patch('client1', { housingStatus: opt })">{{ opt }}</button>
      </div>
      <div v-if="showC2" class="seg-control">
        <button v-for="opt in HOUSING_OPTIONS" :key="opt"
                type="button"
                :aria-pressed="(c2.housingStatus || 'Owner') === opt"
                @click="patch('client2', { housingStatus: opt })">{{ opt }}</button>
      </div>

      <!-- Rent -->
      <div class="row-label">Rent</div>
      <div v-if="showC1" :class="['afm-field-with-na', { 'afm-na-on': !!c1.na?.rentAmount }]">
        <div class="afm-rent-row">
          <div class="input-affix">
            <span class="prefix">$</span>
            <input class="input has-prefix" type="text"
                   :placeholder="c1.na?.rentAmount ? 'N/A' : '0'"
                   inputmode="decimal"
                   maxlength="15"
                   :value="c1.rentAmount"
                   @keydown="currencyKeydown"
                   @input="patch('client1', { rentAmount: currencySanitize($event.target.value) })" />
          </div>
          <div class="seg-control">
            <button v-for="opt in FREQ_OPTIONS" :key="opt"
                    type="button"
                    :aria-pressed="(c1.rentFreq || 'pw') === opt"
                    @click="patch('client1', { rentFreq: opt })">/{{ opt }}</button>
          </div>
        </div>
        <NAButton :active="!!c1.na?.rentAmount" @toggle="toggleNA('client1', 'rentAmount', { rentAmount: '' })" />
      </div>
      <div v-if="showC2" :class="['afm-field-with-na', { 'afm-na-on': !!c2.na?.rentAmount }]">
        <div class="afm-rent-row">
          <div class="input-affix">
            <span class="prefix">$</span>
            <input class="input has-prefix" type="text"
                   :placeholder="c2.na?.rentAmount ? 'N/A' : '0'"
                   inputmode="decimal"
                   maxlength="15"
                   :value="c2.rentAmount"
                   @keydown="currencyKeydown"
                   @input="patch('client2', { rentAmount: currencySanitize($event.target.value) })" />
          </div>
          <div class="seg-control">
            <button v-for="opt in FREQ_OPTIONS" :key="opt"
                    type="button"
                    :aria-pressed="(c2.rentFreq || 'pw') === opt"
                    @click="patch('client2', { rentFreq: opt })">/{{ opt }}</button>
          </div>
        </div>
        <NAButton :active="!!c2.na?.rentAmount" @toggle="toggleNA('client2', 'rentAmount', { rentAmount: '' })" />
      </div>

      <!-- Purpose of enquiry -->
      <div class="row-label">Purpose of enquiry</div>
      <div v-if="showC1" class="afm-purpose">
        <div class="seg-control">
          <button v-for="opt in PURPOSE_OPTIONS" :key="opt.value"
                  type="button"
                  :aria-pressed="(c1.purpose || 'OwnerOcc') === opt.value"
                  @click="patch('client1', { purpose: opt.value })">{{ opt.label }}</button>
        </div>
        <label class="afm-checkbox">
          <input type="checkbox" :checked="!!c1.isFhb"
                 @change="patch('client1', { isFhb: $event.target.checked })" />
          First home buyer (FHB)
        </label>
      </div>
      <div v-if="showC2" class="afm-purpose">
        <div class="seg-control">
          <button v-for="opt in PURPOSE_OPTIONS" :key="opt.value"
                  type="button"
                  :aria-pressed="(c2.purpose || 'OwnerOcc') === opt.value"
                  @click="patch('client2', { purpose: opt.value })">{{ opt.label }}</button>
        </div>
        <label class="afm-checkbox">
          <input type="checkbox" :checked="!!c2.isFhb"
                 @change="patch('client2', { isFhb: $event.target.checked })" />
          First home buyer (FHB)
        </label>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '../base/AppIcon.vue'
import NAButton from './NAButton.vue'
import { useActiveClient, setActiveClient, useIsPhoneView } from '../../composables/useAssessmentClient'
import { LIMITS } from '../../utils/validators'
import { currencyKeydown, currencySanitize } from '../../utils/inputFilters'

// ISO date for `<input type="date" :max>` — prevents picking a DOB in the future.
const todayIso = new Date().toISOString().slice(0, 10)

function clampInt(value, min, max) {
  if (value === '' || value == null) return ''
  const n = parseInt(value, 10)
  if (!Number.isFinite(n)) return ''
  return Math.min(Math.max(n, min), max)
}

function computeAge(dobIso) {
  if (!dobIso) return null
  const dob = new Date(dobIso)
  if (Number.isNaN(dob.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age >= 0 && age <= 150 ? age : null
}

const MARITAL_OPTIONS = ['Single', 'Married', 'De facto', 'Separated', 'Other']
const RESIDENCY_OPTIONS = ['Citizen', 'PR', 'Other']
const HOUSING_OPTIONS = ['Owner', 'Renting']
const FREQ_OPTIONS = ['wk', 'mo']
const PURPOSE_OPTIONS = [
  { value: 'OwnerOcc',  label: 'Owner Occ' },
  { value: 'Investment', label: 'Investment' },
]

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

const c1 = computed(() => props.modelValue?.client1 ?? {})
const c2 = computed(() => props.modelValue?.client2 ?? {})

const isPhone = useIsPhoneView()
const activeClient = useActiveClient()
// On non-phone: render both clients side-by-side (existing layout).
// On phone: only render the active client's fields (tabbed).
const showC1 = computed(() => !isPhone.value || activeClient.value === 'client1')
const showC2 = computed(() => !isPhone.value || activeClient.value === 'client2')

function patch(which, fieldPatch) {
  const current = props.modelValue?.[which] ?? {}
  emit('update:modelValue', {
    ...props.modelValue,
    [which]: { ...current, ...fieldPatch },
  })
}

// When the agent picks a date, auto-fill the age field from it. They can still
// override the age manually afterwards (rare — when DOB is approximate).
// Also clears the legacy `dob` text field so the JSONB doesn't keep stale
// "DD/MM/YYYY · Age" strings around alongside the new split fields.
function onDobChange(which, dobIso) {
  const age = computeAge(dobIso)
  patch(which, { dobDate: dobIso || '', age: age ?? '', dob: '' })
}

// N/A toggle for client-split sections. When activating, also clears the
// underlying value(s) so the JSONB doesn't carry stale "$1500 + na=true" state.
// `cleared` lists the field name(s) to reset (most fields are simple — just
// the same key — but compound rows like DOB clear dobDate+age+dob together).
function toggleNA(which, fieldKey, cleared) {
  const current = props.modelValue?.[which] ?? {}
  const na = { ...(current.na ?? {}) }
  const nextActive = !na[fieldKey]
  const nextClient = nextActive
    ? { ...current, ...cleared, na: { ...na, [fieldKey]: true } }
    : (() => { const n = { ...na }; delete n[fieldKey]; return { ...current, na: n } })()
  emit('update:modelValue', {
    ...props.modelValue,
    [which]: nextClient,
  })
}
</script>

<style scoped>
.afm-rent-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}
.afm-dob-row {
  display: grid;
  grid-template-columns: 1fr 110px;
  gap: 8px;
  align-items: center;
}
.afm-residency-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.afm-residency-other {
  font-size: 13px;
}
.afm-dob-age .suffix {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--text-faint);
  pointer-events: none;
}
@media (max-width: 600px) {
  .afm-dob-row { grid-template-columns: 1fr; }
}
.afm-purpose {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.afm-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-muted);
  cursor: pointer;
}
.afm-checkbox input[type="checkbox"] { cursor: pointer; }
</style>
