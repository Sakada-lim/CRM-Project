<template>
  <section id="income" class="afm-section">
    <div class="head">
      <span class="num">3</span>
      <div style="flex:1;min-width:0">
        <h2>Income</h2>
        <div class="desc">All sources — gross, then frequency.</div>
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
      <div class="col-head">Client 1 (gross)</div>
      <div class="col-head">Client 2 (gross)</div>

      <template v-for="row in INCOME_ROWS" :key="row.key">
        <div class="row-label">{{ row.label }}</div>
        <div v-if="showC1" class="afm-income-cell">
          <div class="input-affix">
            <span class="prefix">$</span>
            <input class="input has-prefix" type="text"
                   :placeholder="row.placeholder"
                   :value="(c1[row.key] ?? {}).amount"
                   @input="patch('client1', row.key, { amount: $event.target.value })" />
          </div>
          <select class="select"
                  :value="(c1[row.key] ?? {}).freq || 'pw'"
                  @change="patch('client1', row.key, { freq: $event.target.value })">
            <option v-for="f in FREQS" :key="f" :value="f">p/{{ f }}</option>
          </select>
        </div>
        <div v-if="showC2" class="afm-income-cell">
          <div class="input-affix">
            <span class="prefix">$</span>
            <input class="input has-prefix" type="text"
                   :placeholder="row.placeholder"
                   :value="(c2[row.key] ?? {}).amount"
                   @input="patch('client2', row.key, { amount: $event.target.value })" />
          </div>
          <select class="select"
                  :value="(c2[row.key] ?? {}).freq || 'pw'"
                  @change="patch('client2', row.key, { freq: $event.target.value })">
            <option v-for="f in FREQS" :key="f" :value="f">p/{{ f }}</option>
          </select>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useActiveClient, setActiveClient, useIsPhoneView } from '../../composables/useAssessmentClient'

const FREQS = ['w', 'f', 'm', 'a']
const INCOME_ROWS = [
  { key: 'salaryWages',    label: 'Salary/Wages (ex. super)',    placeholder: '0' },
  { key: 'bonus',          label: 'Bonus & commissions',          placeholder: '0' },
  { key: 'afterTax',       label: 'After-tax current pay',        placeholder: '0' },
  { key: 'centrelink',     label: 'Centrelink / DVA',             placeholder: '0' },
  { key: 'investmentRent', label: 'Rent for investment properties', placeholder: '0' },
  { key: 'other',          label: 'Other (specify)',              placeholder: '' },
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

function patch(which, rowKey, partial) {
  const clientObj = props.modelValue?.[which] ?? {}
  const rowObj = clientObj[rowKey] ?? {}
  emit('update:modelValue', {
    ...props.modelValue,
    [which]: {
      ...clientObj,
      [rowKey]: { ...rowObj, ...partial },
    },
  })
}
</script>

<style scoped>
.afm-income-cell {
  display: grid;
  grid-template-columns: 1fr 90px;
  gap: 8px;
  align-items: center;
}
.afm-income-cell .select { width: 100%; padding: 10px 8px; }
</style>
