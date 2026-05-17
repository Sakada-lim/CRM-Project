<template>
  <section class="cd-card cd-card--pad-sm bp-card">
    <div class="cd-sec-title">
      <h3>Buying profile</h3>
      <RouterLink :to="`/customers/${customerId}/assessment`" class="bp-edit-link">
        <AppIcon name="edit" :size="12" />
        {{ isComplete ? 'Edit' : 'Add details' }}
      </RouterLink>
    </div>

    <div class="bp-rows">
      <div class="bp-row">
        <span class="bp-label">Budget</span>
        <span class="bp-value" :class="{ 'bp-value--empty': !budget }">
          {{ budget || '—' }}
        </span>
      </div>
      <div class="bp-row">
        <span class="bp-label">Pre-approval</span>
        <span class="bp-value" :class="{ 'bp-value--empty': !preApproval }">
          <AppIcon v-if="preApproval" name="check" :size="13" class="bp-check" />
          <span>{{ preApproval || '—' }}</span>
        </span>
      </div>
      <div class="bp-row">
        <span class="bp-label">Timeline</span>
        <span class="bp-value" :class="{ 'bp-value--empty': !timeline }">
          {{ timeline || '—' }}
        </span>
      </div>
      <div class="bp-row">
        <span class="bp-label">Property types</span>
        <span class="bp-value" :class="{ 'bp-value--empty': !propertyTypes }">
          {{ propertyTypes || '—' }}
        </span>
      </div>
      <div class="bp-row">
        <span class="bp-label">Min bedrooms</span>
        <span class="bp-value" :class="{ 'bp-value--empty': !minBedrooms }">
          {{ minBedrooms || '—' }}
        </span>
      </div>
      <div class="bp-row">
        <span class="bp-label">Suburbs</span>
        <span class="bp-value" :class="{ 'bp-value--empty': !suburbs }">
          {{ suburbs || '—' }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useAssessmentStore } from '../../stores/assessmentStore'
import AppIcon from '../base/AppIcon.vue'

const props = defineProps({
  customerId: { type: String, required: true },
})

const assessmentStore = useAssessmentStore()
const assessment = computed(() => assessmentStore.forCustomer(props.customerId))

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseNum(v) {
  if (v == null || v === '') return null
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : null
}

function formatK(n) {
  if (n == null) return null
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1_000)     return `$${Math.round(n / 1000)}k`
  return `$${n}`
}

// ── Derived fields ───────────────────────────────────────────────────────────
const d = computed(() => assessment.value?.discovery ?? {})
const n = computed(() => assessment.value?.notes ?? {})

const budget = computed(() => {
  const min = parseNum(d.value.q7_budgetMin)
  const max = parseNum(d.value.q7_budgetMax)
  if (min && max) return `${formatK(min)} – ${formatK(max)}`
  if (min)        return `From ${formatK(min)}`
  if (max)        return `Up to ${formatK(max)}`
  return null
})

const preApproval = computed(() => {
  const amount = parseNum(n.value.preApprovalAmount)
  const lender = (n.value.preApprovalLender ?? '').trim()
  if (amount && lender) return `${formatK(amount)} · ${lender}`
  if (amount)           return formatK(amount)
  if (lender)           return lender
  return null
})

const timeline       = computed(() => (d.value.q3_buyTimeline    ?? '').trim() || null)
const propertyTypes  = computed(() => (d.value.q8_propertyType   ?? '').trim() || null)
const minBedrooms    = computed(() => (d.value.q8b_minBedrooms   ?? '').toString().trim() || null)
const suburbs        = computed(() => (d.value.q6_areaOfInterest ?? '').trim() || null)

const isComplete = computed(() =>
  !!(budget.value && preApproval.value && timeline.value &&
     propertyTypes.value && minBedrooms.value && suburbs.value),
)
</script>

<style scoped>
.bp-card { /* uses .cd-card chrome from CustomerDetailView's scope; nothing extra needed */ }

.bp-rows { margin-top: 4px; }

.bp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  font-size: 13.5px;
  border-bottom: 1px solid var(--border);
}
.bp-row:last-child { border-bottom: none; }

.bp-label {
  color: var(--text-muted);
  font-weight: 500;
}

.bp-value {
  font-weight: 600;
  color: var(--text);
  text-align: right;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bp-value--empty {
  color: var(--text-faint);
  font-weight: 500;
  font-style: italic;
}

.bp-check {
  color: var(--success, var(--accent));
  flex-shrink: 0;
}

.bp-edit-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-ink);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background .12s;
}
.bp-edit-link:hover { background: var(--accent-soft); }
</style>
