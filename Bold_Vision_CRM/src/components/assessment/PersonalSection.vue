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
             :value="c1.fullName"
             @input="patch('client1', { fullName: $event.target.value })" />
      <input v-if="showC2" class="input" type="text" placeholder="Full name"
             :value="c2.fullName"
             @input="patch('client2', { fullName: $event.target.value })" />

      <!-- DOB · age -->
      <div class="row-label">Date of birth · age</div>
      <div v-if="showC1" class="input-affix">
        <span class="prefix"><AppIcon name="calendar" :size="14" /></span>
        <input class="input has-prefix" type="text" placeholder="DD/MM/YYYY · Age"
               :value="c1.dob"
               @input="patch('client1', { dob: $event.target.value })" />
      </div>
      <div v-if="showC2" class="input-affix">
        <span class="prefix"><AppIcon name="calendar" :size="14" /></span>
        <input class="input has-prefix" type="text" placeholder="DD/MM/YYYY · Age"
               :value="c2.dob"
               @input="patch('client2', { dob: $event.target.value })" />
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
      <input v-if="showC1" class="input" type="text" placeholder="No. &amp; ages (e.g. 2 · 6, 8)"
             :value="c1.dependants"
             @input="patch('client1', { dependants: $event.target.value })" />
      <input v-if="showC2" class="input" type="text" placeholder="No. &amp; ages"
             :value="c2.dependants"
             @input="patch('client2', { dependants: $event.target.value })" />

      <!-- Residency -->
      <div class="row-label">Residency</div>
      <div v-if="showC1" class="seg-control">
        <button v-for="opt in RESIDENCY_OPTIONS" :key="opt"
                type="button"
                :aria-pressed="(c1.residency || 'Citizen') === opt"
                @click="patch('client1', { residency: opt })">{{ opt }}</button>
      </div>
      <div v-if="showC2" class="seg-control">
        <button v-for="opt in RESIDENCY_OPTIONS" :key="opt"
                type="button"
                :aria-pressed="(c2.residency || 'Citizen') === opt"
                @click="patch('client2', { residency: opt })">{{ opt }}</button>
      </div>

      <!-- Phone -->
      <div class="row-label">Phone</div>
      <div v-if="showC1" class="input-affix">
        <span class="prefix"><AppIcon name="phone" :size="14" /></span>
        <input class="input has-prefix" type="tel" placeholder="04xx xxx xxx"
               :value="c1.phone"
               @input="patch('client1', { phone: $event.target.value })" />
      </div>
      <div v-if="showC2" class="input-affix">
        <span class="prefix"><AppIcon name="phone" :size="14" /></span>
        <input class="input has-prefix" type="tel" placeholder="04xx xxx xxx"
               :value="c2.phone"
               @input="patch('client2', { phone: $event.target.value })" />
      </div>

      <!-- Home address -->
      <div class="row-label">Home address</div>
      <div v-if="showC1" class="input-affix">
        <span class="prefix"><AppIcon name="pin" :size="14" /></span>
        <input class="input has-prefix" type="text" placeholder="Street, suburb, state, postcode"
               :value="c1.address"
               @input="patch('client1', { address: $event.target.value })" />
      </div>
      <div v-if="showC2" class="input-affix">
        <span class="prefix"><AppIcon name="pin" :size="14" /></span>
        <input class="input has-prefix" type="text" placeholder="Same as Client 1"
               :value="c2.address"
               @input="patch('client2', { address: $event.target.value })" />
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
      <div v-if="showC1" class="afm-rent-row">
        <div class="input-affix">
          <span class="prefix">$</span>
          <input class="input has-prefix" type="text" placeholder="0"
                 :value="c1.rentAmount"
                 @input="patch('client1', { rentAmount: $event.target.value })" />
        </div>
        <div class="seg-control">
          <button v-for="opt in FREQ_OPTIONS" :key="opt"
                  type="button"
                  :aria-pressed="(c1.rentFreq || 'pw') === opt"
                  @click="patch('client1', { rentFreq: opt })">/{{ opt }}</button>
        </div>
      </div>
      <div v-if="showC2" class="afm-rent-row">
        <div class="input-affix">
          <span class="prefix">$</span>
          <input class="input has-prefix" type="text" placeholder="0"
                 :value="c2.rentAmount"
                 @input="patch('client2', { rentAmount: $event.target.value })" />
        </div>
        <div class="seg-control">
          <button v-for="opt in FREQ_OPTIONS" :key="opt"
                  type="button"
                  :aria-pressed="(c2.rentFreq || 'pw') === opt"
                  @click="patch('client2', { rentFreq: opt })">/{{ opt }}</button>
        </div>
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
import { useActiveClient, setActiveClient, useIsPhoneView } from '../../composables/useAssessmentClient'

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
</script>

<style scoped>
.afm-rent-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
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
