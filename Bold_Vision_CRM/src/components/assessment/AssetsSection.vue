<template>
  <section id="assets" class="afm-section">
    <div class="head">
      <span class="num">4</span>
      <div style="flex:1;min-width:0">
        <h2>Assets</h2>
        <div class="desc">Combined household total.</div>
      </div>
    </div>

    <div class="afm-assets">
      <div v-for="row in ASSET_ROWS" :key="row.key" class="afm-asset">
        <span class="lbl">{{ row.label }}</span>
        <div :class="['afm-field-with-na', { 'afm-na-on': !!na[row.key] }]">
          <div class="input-affix">
            <span class="prefix">$</span>
            <input class="input has-prefix" type="text"
                   :placeholder="na[row.key] ? 'N/A' : '0'"
                   inputmode="decimal"
                   maxlength="15"
                   :value="modelValue[row.key]"
                   @keydown="currencyKeydown"
                   @input="patch(row.key, currencySanitize($event.target.value))" />
          </div>
          <NAButton :active="!!na[row.key]" @toggle="toggleNA(row.key)" />
        </div>
      </div>
    </div>

    <div class="afm-asset-total">
      <span class="lbl">Total asset value</span>
      <span class="val">{{ formattedTotal }}</span>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import NAButton from './NAButton.vue'
import { currencyKeydown, currencySanitize } from '../../utils/inputFilters'

const ASSET_ROWS = [
  { key: 'principalResidence',  label: 'Principal residence' },
  { key: 'homeContents',        label: 'Home contents' },
  { key: 'vehicle1',            label: 'Vehicle 1' },
  { key: 'vehicle2',            label: 'Vehicle 2' },
  { key: 'cashBankAccounts',    label: 'Cash / bank accounts' },
  { key: 'futureSavings',       label: 'Future savings' },
  { key: 'investmentProperty1', label: 'Investment property 1' },
  { key: 'investmentProperty2', label: 'Investment property 2' },
  { key: 'investmentProperty3', label: 'Investment property 3' },
  { key: 'otherLifestyle',      label: 'Other lifestyle' },
  { key: 'directShares',        label: 'Direct shares' },
  { key: 'managedFunds1',       label: 'Managed funds 1' },
  { key: 'managedFunds2',       label: 'Managed funds 2' },
  { key: 'superannuation1',     label: 'Superannuation 1' },
  { key: 'superannuation2',     label: 'Superannuation 2' },
  { key: 'otherAsset',          label: 'Other asset' },
]

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

function patch(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const na = computed(() => props.modelValue?.na ?? {})

function toggleNA(key) {
  const naMap = { ...(props.modelValue?.na ?? {}) }
  const nextActive = !naMap[key]
  if (nextActive) naMap[key] = true
  else delete naMap[key]
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: nextActive ? '' : props.modelValue?.[key],
    na: naMap,
  })
}

function parseNum(v) {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const total = computed(() =>
  ASSET_ROWS.reduce((sum, row) => sum + parseNum(props.modelValue?.[row.key]), 0),
)

const formattedTotal = computed(() =>
  '$' + total.value.toLocaleString('en-AU', { maximumFractionDigits: 0 }),
)
</script>
