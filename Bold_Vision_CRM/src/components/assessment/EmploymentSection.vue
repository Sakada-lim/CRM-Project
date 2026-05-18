<template>
  <section id="employment" class="afm-section">
    <div class="head">
      <span class="num">2</span>
      <div style="flex:1;min-width:0">
        <h2>Employment</h2>
        <div class="desc">Work status, occupation, and tenure.</div>
      </div>
    </div>

    <!-- Phone-only client toggle -->
    <div v-if="isPhone" class="seg-control afm-client-toggle">
      <button type="button" :aria-pressed="activeClient === 'client1'"
              @click="setActiveClient('client1')">Client 1</button>
      <button type="button" :aria-pressed="activeClient === 'client2'"
              @click="setActiveClient('client2')">Client 2</button>
    </div>

    <div class="afm-twocol">
      <div></div>
      <div class="col-head">Client 1</div>
      <div class="col-head">Client 2</div>

      <!-- Occupation -->
      <div class="row-label">Occupation</div>
      <div v-if="showC1" :class="['afm-field-with-na', { 'afm-na-on': !!c1.na?.occupation }]">
        <input class="input" type="text"
               :placeholder="c1.na?.occupation ? 'N/A' : 'e.g. Software engineer'"
               :maxlength="LIMITS.assessmentText.max"
               :value="c1.occupation"
               @input="patch('client1', { occupation: $event.target.value })" />
        <NAButton :active="!!c1.na?.occupation" @toggle="toggleNA('client1', 'occupation', { occupation: '' })" />
      </div>
      <div v-if="showC2" :class="['afm-field-with-na', { 'afm-na-on': !!c2.na?.occupation }]">
        <input class="input" type="text"
               :placeholder="c2.na?.occupation ? 'N/A' : 'Occupation'"
               :maxlength="LIMITS.assessmentText.max"
               :value="c2.occupation"
               @input="patch('client2', { occupation: $event.target.value })" />
        <NAButton :active="!!c2.na?.occupation" @toggle="toggleNA('client2', 'occupation', { occupation: '' })" />
      </div>

      <!-- Employer -->
      <div class="row-label">Employer</div>
      <div v-if="showC1" :class="['afm-field-with-na', { 'afm-na-on': !!c1.na?.employer }]">
        <input class="input" type="text"
               :placeholder="c1.na?.employer ? 'N/A' : 'Employer name'"
               :maxlength="LIMITS.assessmentText.max"
               :value="c1.employer"
               @input="patch('client1', { employer: $event.target.value })" />
        <NAButton :active="!!c1.na?.employer" @toggle="toggleNA('client1', 'employer', { employer: '' })" />
      </div>
      <div v-if="showC2" :class="['afm-field-with-na', { 'afm-na-on': !!c2.na?.employer }]">
        <input class="input" type="text"
               :placeholder="c2.na?.employer ? 'N/A' : 'Employer name'"
               :maxlength="LIMITS.assessmentText.max"
               :value="c2.employer"
               @input="patch('client2', { employer: $event.target.value })" />
        <NAButton :active="!!c2.na?.employer" @toggle="toggleNA('client2', 'employer', { employer: '' })" />
      </div>

      <!-- Work status -->
      <div class="row-label">Work status</div>
      <div v-if="showC1" class="seg-control">
        <button v-for="opt in WORK_STATUS_OPTIONS" :key="opt.value"
                type="button"
                :aria-pressed="(c1.workStatus || 'Employee') === opt.value"
                @click="patch('client1', { workStatus: opt.value })">{{ opt.label }}</button>
      </div>
      <div v-if="showC2" class="seg-control">
        <button v-for="opt in WORK_STATUS_OPTIONS" :key="opt.value"
                type="button"
                :aria-pressed="(c2.workStatus || 'Employee') === opt.value"
                @click="patch('client2', { workStatus: opt.value })">{{ opt.label }}</button>
      </div>

      <!-- Hours -->
      <div class="row-label">Hours</div>
      <div v-if="showC1" class="seg-control">
        <button v-for="opt in HOURS_OPTIONS" :key="opt.value"
                type="button"
                :aria-pressed="(c1.hours || 'FullTime') === opt.value"
                @click="patch('client1', { hours: opt.value })">{{ opt.label }}</button>
      </div>
      <div v-if="showC2" class="seg-control">
        <button v-for="opt in HOURS_OPTIONS" :key="opt.value"
                type="button"
                :aria-pressed="(c2.hours || 'FullTime') === opt.value"
                @click="patch('client2', { hours: opt.value })">{{ opt.label }}</button>
      </div>

      <!-- Years in role -->
      <div class="row-label">Years in role</div>
      <div v-if="showC1" :class="['afm-field-with-na', { 'afm-na-on': !!c1.na?.yearsInRole }]">
        <div class="input-affix afm-years">
          <input class="input" type="number"
                 :placeholder="c1.na?.yearsInRole ? 'N/A' : '0'"
                 min="0" max="99" step="0.5"
                 :value="c1.yearsInRole"
                 @input="patch('client1', { yearsInRole: $event.target.value })" />
          <span class="suffix">yrs</span>
        </div>
        <NAButton :active="!!c1.na?.yearsInRole" @toggle="toggleNA('client1', 'yearsInRole', { yearsInRole: '' })" />
      </div>
      <div v-if="showC2" :class="['afm-field-with-na', { 'afm-na-on': !!c2.na?.yearsInRole }]">
        <div class="input-affix afm-years">
          <input class="input" type="number"
                 :placeholder="c2.na?.yearsInRole ? 'N/A' : '0'"
                 min="0" max="99" step="0.5"
                 :value="c2.yearsInRole"
                 @input="patch('client2', { yearsInRole: $event.target.value })" />
          <span class="suffix">yrs</span>
        </div>
        <NAButton :active="!!c2.na?.yearsInRole" @toggle="toggleNA('client2', 'yearsInRole', { yearsInRole: '' })" />
      </div>

      <!-- Probation -->
      <div class="row-label">Probation</div>
      <div v-if="showC1" class="seg-control">
        <button type="button"
                :aria-pressed="!c1.probation"
                @click="patch('client1', { probation: false })">No</button>
        <button type="button"
                :aria-pressed="!!c1.probation"
                @click="patch('client1', { probation: true })">Yes</button>
      </div>
      <div v-if="showC2" class="seg-control">
        <button type="button"
                :aria-pressed="!c2.probation"
                @click="patch('client2', { probation: false })">No</button>
        <button type="button"
                :aria-pressed="!!c2.probation"
                @click="patch('client2', { probation: true })">Yes</button>
      </div>

      <!-- Previous job (if < 1 yr) -->
      <div class="row-label">Previous job (if &lt; 1 yr)</div>
      <div v-if="showC1" :class="['afm-field-with-na', { 'afm-na-on': !!c1.na?.previousJobNote }]">
        <textarea class="textarea" style="min-height:60px"
                  :placeholder="c1.na?.previousJobNote ? 'N/A' : 'Commentary on previous job…'"
                  :maxlength="LIMITS.assessmentLongText.max"
                  :value="c1.previousJobNote"
                  @input="patch('client1', { previousJobNote: $event.target.value })"></textarea>
        <NAButton :active="!!c1.na?.previousJobNote" @toggle="toggleNA('client1', 'previousJobNote', { previousJobNote: '' })" />
      </div>
      <div v-if="showC2" :class="['afm-field-with-na', { 'afm-na-on': !!c2.na?.previousJobNote }]">
        <textarea class="textarea" style="min-height:60px"
                  :placeholder="c2.na?.previousJobNote ? 'N/A' : 'Commentary on previous job…'"
                  :maxlength="LIMITS.assessmentLongText.max"
                  :value="c2.previousJobNote"
                  @input="patch('client2', { previousJobNote: $event.target.value })"></textarea>
        <NAButton :active="!!c2.na?.previousJobNote" @toggle="toggleNA('client2', 'previousJobNote', { previousJobNote: '' })" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import NAButton from './NAButton.vue'
import { useActiveClient, setActiveClient, useIsPhoneView } from '../../composables/useAssessmentClient'
import { LIMITS } from '../../utils/validators'

const WORK_STATUS_OPTIONS = [
  { value: 'Employee',     label: 'Employee' },
  { value: 'Contract',     label: 'Contract' },
  { value: 'SelfEmployed', label: 'Self-employed' },
]
const HOURS_OPTIONS = [
  { value: 'FullTime', label: 'Full Time' },
  { value: 'PartTime', label: 'Part Time' },
  { value: 'Casual',   label: 'Casual' },
]

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

const c1 = computed(() => props.modelValue?.client1 ?? {})
const c2 = computed(() => props.modelValue?.client2 ?? {})

const isPhone = useIsPhoneView()
const activeClient = useActiveClient()
const showC1 = computed(() => !isPhone.value || activeClient.value === 'client1')
const showC2 = computed(() => !isPhone.value || activeClient.value === 'client2')

function patch(which, fieldPatch) {
  const current = props.modelValue?.[which] ?? {}
  emit('update:modelValue', {
    ...props.modelValue,
    [which]: { ...current, ...fieldPatch },
  })
}

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
.afm-years {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 6px;
}
.afm-years .suffix {
  font-size: 12px;
  color: var(--text-faint);
}
</style>
