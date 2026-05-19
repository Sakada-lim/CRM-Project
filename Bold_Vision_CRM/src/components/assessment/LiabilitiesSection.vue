<template>
  <section id="liabilities" class="afm-section">
    <div class="head">
      <span class="num">5</span>
      <div style="flex:1;min-width:0">
        <h2>Liabilities</h2>
        <div class="desc">Loans, cards, and other obligations.</div>
      </div>
      <label :class="['afm-section-na', { 'is-active': naSection }]">
        <input type="checkbox" :checked="naSection" @change="toggleSectionNA($event.target.checked)" />
        No liabilities to record
      </label>
    </div>

    <template v-if="!naSection">
    <div v-if="rows.length === 0" class="afm-liab-empty">
      No liabilities yet. Pick a type below to add one.
    </div>

    <div v-else class="afm-liab">
      <div class="h">Type</div>
      <div class="h">Details</div>
      <div class="h">Outstanding</div>
      <div class="h">Lender</div>
      <div class="h">Remaining term</div>
      <div class="h">Rate</div>
      <div class="h">Repayment</div>
      <div></div>

      <template v-for="(row, i) in rows" :key="row.id">
        <div class="type-badge">
          <span class="dot" :style="{ background: liabilityTone(row.type) }"></span>
          {{ row.type }}
        </div>
        <input class="input" type="text" placeholder="Notes"
               :maxlength="LIMITS.assessmentText.max"
               :value="row.details"
               @input="updateRow(i, { details: $event.target.value })" />
        <div class="input-affix">
          <span class="prefix">$</span>
          <input class="input has-prefix" type="text" placeholder="0"
                 inputmode="decimal"
                 maxlength="15"
                 :value="row.value"
                 @keydown="currencyKeydown"
                 @input="updateRow(i, { value: currencySanitize($event.target.value) })" />
        </div>
        <input class="input" type="text" placeholder="Lender"
               :maxlength="LIMITS.assessmentText.max"
               :value="row.lender"
               @input="updateRow(i, { lender: $event.target.value })" />
        <input class="input" type="number" placeholder="0"
               min="0" max="99" step="1"
               :value="row.remainingTerm"
               @input="updateRow(i, { remainingTerm: $event.target.value })" />
        <div class="input-affix">
          <input class="input" type="number" placeholder="0"
                 min="0" max="30" step="0.01"
                 :value="row.interestRate"
                 @input="updateRow(i, { interestRate: $event.target.value })" />
          <span class="suffix">%</span>
        </div>
        <div class="input-affix">
          <span class="prefix">$</span>
          <input class="input has-prefix" type="text" placeholder="0"
                 inputmode="decimal"
                 maxlength="15"
                 :value="row.repayment"
                 @keydown="currencyKeydown"
                 @input="updateRow(i, { repayment: currencySanitize($event.target.value) })" />
        </div>
        <button class="row-del" type="button" aria-label="Remove liability"
                @click="removeRow(i)">
          <AppIcon name="x" :size="12" />
        </button>
      </template>
    </div>

    <div class="afm-liab-presets">
      <button v-for="t in PRESET_TYPES" :key="t" type="button"
              class="btn btn-ghost sm"
              :disabled="rowCapReached"
              @click="addRow(t)">
        <AppIcon name="plus" :size="11" />
        {{ t }}
      </button>
      <span v-if="rowCapReached" class="afm-liab-cap">
        Max {{ LIMITS.liabilityRowCap.max }} rows
      </span>
    </div>

    <div class="afm-total-row">
      <span class="lbl">Total debt value</span>
      <span class="val">{{ formattedTotal }}</span>
    </div>
    </template>

    <div v-else class="afm-liab-empty">
      Marked as Not Applicable — no liabilities recorded for this customer.
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '../base/AppIcon.vue'
import { LIMITS } from '../../utils/validators'
import { useFeedback } from '../../composables/useFeedback'
import { currencyKeydown, currencySanitize } from '../../utils/inputFilters'

const { notifyError } = useFeedback()

const PRESET_TYPES = [
  'Home Loan',
  'Car Loan',
  'Credit Card',
  'Inv. Property Loan',
  'Margin Loan',
  'Other Secured',
  'Unsecured',
]

function liabilityTone(type) {
  if (/Home Loan/i.test(type))      return 'var(--accent)'
  if (/Inv\./i.test(type))          return 'var(--cold)'
  if (/Credit Card/i.test(type))    return 'var(--hot)'
  if (/Car Loan/i.test(type))       return 'var(--warm)'
  return 'var(--text-muted)'
}

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

const rows = computed(() => props.modelValue?.rows ?? [])
const naSection = computed(() => props.modelValue?.naSection === true)

function emitRows(nextRows) {
  emit('update:modelValue', { ...props.modelValue, rows: nextRows })
}

// Whole-section N/A: marks the section as having no liabilities to record.
// Clears the rows array on activate (so we don't keep stale data + flag).
function toggleSectionNA(checked) {
  if (checked) {
    emit('update:modelValue', { ...props.modelValue, rows: [], naSection: true })
  } else {
    const next = { ...props.modelValue }
    delete next.naSection
    emit('update:modelValue', next)
  }
}

function newId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'lia_' + Math.random().toString(36).slice(2, 11)
}

const rowCapReached = computed(() => rows.value.length >= LIMITS.liabilityRowCap.max)

function addRow(type) {
  if (rowCapReached.value) {
    notifyError(`Liabilities capped at ${LIMITS.liabilityRowCap.max} rows`)
    return
  }
  const next = [
    ...rows.value,
    { id: newId(), type, details: '', value: '', lender: '',
      remainingTerm: '', interestRate: '', repayment: '' },
  ]
  emitRows(next)
}

function updateRow(index, partial) {
  const next = rows.value.map((r, i) => (i === index ? { ...r, ...partial } : r))
  emitRows(next)
}

function removeRow(index) {
  emitRows(rows.value.filter((_, i) => i !== index))
}

function parseNum(v) {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const total = computed(() =>
  rows.value.reduce((sum, r) => sum + parseNum(r.value), 0),
)
const formattedTotal = computed(() =>
  '$' + total.value.toLocaleString('en-AU', { maximumFractionDigits: 0 }),
)
</script>

<style scoped>
.afm-liab-empty {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px dashed var(--border);
  border-radius: var(--r-md);
  margin-bottom: 14px;
}
.afm-liab .type-badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.afm-liab .input-affix .suffix {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--text-faint);
  pointer-events: none;
}
.afm-liab-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.afm-liab-presets .btn { text-decoration: none; }
.afm-liab-presets .btn:disabled { opacity: 0.45; cursor: not-allowed; }
.afm-liab-cap {
  align-self: center;
  font-size: 11.5px;
  font-style: italic;
  color: var(--text-faint);
}
</style>
