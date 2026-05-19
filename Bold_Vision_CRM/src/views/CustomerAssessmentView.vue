<template>
  <div class="afm-shell">
    <!-- ─── Sticky nav rail ─────────────────────────── -->
    <aside class="afm-nav">
      <div class="head">
        <div class="who">{{ customer?.name || 'Customer' }}</div>
        <div class="what">Financial assessment</div>
      </div>
      <a
        v-for="s in SECTIONS"
        :key="s.id"
        :href="`#${s.id}`"
        :aria-current="active === s.id ? 'page' : undefined"
        :class="{
          'is-complete': sectionStatus(s.id) === 'complete',
          'is-progress': sectionStatus(s.id) === 'in-progress',
        }"
        @click.prevent="scrollTo(s.id)"
      >
        <span class="step">
          <AppIcon v-if="sectionStatus(s.id) === 'complete'" name="check" :size="10" />
          <span v-else-if="sectionStatus(s.id) === 'in-progress'" class="afm-nav-dot"></span>
          <template v-else>{{ s.num }}</template>
        </span>
        <span>{{ s.title }}</span>
      </a>
      <div class="afm-progress">
        <div style="display:flex;justify-content:space-between">
          <span>Progress</span>
          <span style="font-variant-numeric:tabular-nums">{{ completeCount }}/{{ SECTIONS.length }}</span>
        </div>
        <div class="bar"><i :style="{ width: progressPct + '%' }"></i></div>
      </div>
    </aside>

    <!-- ─── Main column ─────────────────────────────── -->
    <div class="afm-main">
      <div class="afm-pageheader">
        <div style="min-width:0">
          <h1>Assessment form</h1>
          <div class="sub">
            For <strong style="color:var(--text)">{{ customer?.name || '…' }}</strong>
            · Started {{ startedAtRelative }}
          </div>
        </div>
        <div class="afm-pageheader__actions">
          <button type="button" class="btn btn-ghost" @click="printForm">
            <AppIcon name="document" :size="13" />
            Print / Save as PDF
          </button>
          <RouterLink :to="`/customers/${id}`" class="btn btn-ghost">
            <AppIcon name="x" :size="13" />
            Back to profile
          </RouterLink>
        </div>
      </div>

      <!-- 1. Personal information -->
      <PersonalSection
        :model-value="personalForView"
        @update:modelValue="handlePersonalUpdate"
      />

      <!-- 2. Employment -->
      <EmploymentSection
        :model-value="assessment?.employment ?? {}"
        @update:modelValue="(v) => updateSection('employment', v)"
      />

      <!-- 3. Income -->
      <IncomeSection
        :model-value="assessment?.income ?? {}"
        @update:modelValue="(v) => updateSection('income', v)"
      />

      <!-- 4. Assets -->
      <AssetsSection
        :model-value="assessment?.assets ?? {}"
        @update:modelValue="(v) => updateSection('assets', v)"
      />

      <!-- 5. Liabilities -->
      <LiabilitiesSection
        :model-value="assessment?.liabilities ?? {}"
        @update:modelValue="(v) => updateSection('liabilities', v)"
      />

      <!-- 6. Discovery -->
      <DiscoverySection
        :model-value="assessment?.discovery ?? {}"
        @update:modelValue="(v) => updateSection('discovery', v)"
      />

      <!-- 7. Notes & next steps -->
      <NotesSection
        :notes="assessment?.notes ?? {}"
        :meta="metaForView"
        @update:notes="(v) => updateSection('notes', v)"
        @update:meta="handleMetaUpdate"
      />

      <!-- Sticky action bar -->
      <div class="afm-actionbar">
        <span class="save-meta">
          <AppIcon name="clock" :size="12" />
          {{ autosaveLabel }}
        </span>
        <RouterLink :to="`/customers/${id}`" class="btn btn-ghost">Save &amp; exit</RouterLink>
        <button
          class="btn btn-primary"
          :disabled="!assessment || submitting"
          @click="submit"
        >
          <AppIcon name="check" :size="14" />
          {{ submitting ? 'Submitting…' : 'Submit assessment' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCustomerStore } from '../stores/customerStore'
import { useAssessmentStore } from '../stores/assessmentStore'
import { useFeedback } from '../composables/useFeedback'
import { computeSectionStatus } from '../utils/validators'
import AppIcon from '../components/base/AppIcon.vue'
import PersonalSection from '../components/assessment/PersonalSection.vue'
import EmploymentSection from '../components/assessment/EmploymentSection.vue'
import IncomeSection from '../components/assessment/IncomeSection.vue'
import AssetsSection from '../components/assessment/AssetsSection.vue'
import LiabilitiesSection from '../components/assessment/LiabilitiesSection.vue'
import DiscoverySection from '../components/assessment/DiscoverySection.vue'
import NotesSection from '../components/assessment/NotesSection.vue'

const SECTIONS = [
  { id: 'personal',    num: 1, title: 'Personal information', desc: 'Identity, residency, and primary contact details.' },
  { id: 'employment',  num: 2, title: 'Employment',           desc: 'Work status, occupation, and tenure.' },
  { id: 'income',      num: 3, title: 'Income',               desc: 'All sources — gross, then frequency.' },
  { id: 'assets',      num: 4, title: 'Assets',               desc: 'Combined household total.' },
  { id: 'liabilities', num: 5, title: 'Liabilities',          desc: 'Loans, cards, and other obligations.' },
  { id: 'discovery',   num: 6, title: 'Discovery',            desc: 'Buying goals, concerns, and timing.' },
  { id: 'notes',       num: 7, title: 'Notes & next steps',   desc: 'Capture the takeaways and book the next chat.' },
]
// (all 7 sections are now real components; no placeholders left)

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)

const customerStore = useCustomerStore()
const assessmentStore = useAssessmentStore()
const { saving } = storeToRefs(assessmentStore)
const { notifyFromError } = useFeedback()

const customer = computed(() =>
  customerStore.customers.find((c) => c.id === id.value) || null,
)
const assessment = computed(() => assessmentStore.forCustomer(id.value))

// ─── Touched tracking + completion ───
// Three-state nav (Slice 1b):
//   'untouched'   → section not yet in touched_sections
//   'in-progress' → touched but at least one optional field blank-without-NA
//   'complete'    → every optional field is filled or explicitly N/A'd
// Progress bar denominator counts only `complete` sections.
const touched = computed(() => new Set(assessment.value?.touchedSections ?? []))

// `mergedForCompletion` overlays pending mirrored fields (name, agent,
// nextContactAt) onto the assessment so completion picks them up immediately
// without waiting for the 2.5s customer-store flush. Reads the latest pending
// values where present, otherwise the canonical customer.
const mergedForCompletion = computed(() => {
  const a = assessment.value
  if (!a) return null
  return {
    ...a,
    consultantName: mirroredValue('agent', customer.value?.agent),
    nextAppointmentAt: ('nextContactAt' in pendingMirrored.value)
      ? pendingMirrored.value.nextContactAt
      : (customer.value?.nextContactAt ?? null),
  }
})

function sectionStatus(id) {
  if (!touched.value.has(id)) return 'untouched'
  return computeSectionStatus(id, mergedForCompletion.value)
}

const completeCount = computed(() =>
  SECTIONS.filter((s) => sectionStatus(s.id) === 'complete').length,
)
const progressPct = computed(() => Math.round((completeCount.value / SECTIONS.length) * 100))

// ─── Scroll spy (query sections by DOM id; works regardless of whether
// the section is a placeholder or a real component) ───
const active = ref('personal')
let observer = null

function scrollTo(id) {
  const el = document.getElementById(id)
  if (!el) return
  window.scrollTo({ top: el.offsetTop - 72, behavior: 'smooth' })
  active.value = id
}

function installObserver() {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
      if (visible.length === 0) return
      visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      active.value = visible[0].target.id
    },
    { rootMargin: '-100px 0px -60% 0px', threshold: 0 },
  )
  for (const s of SECTIONS) {
    const el = document.getElementById(s.id)
    if (el) observer.observe(el)
  }
}

// ─── Lifecycle ───
onMounted(async () => {
  // 1) Make sure we have the customer (we read mirrored fields live from it).
  if (!customerStore.loaded) {
    await customerStore.fetchCustomers()
  }
  // 2) Ensure a draft assessment exists.
  if (id.value) {
    await assessmentStore.ensureDraft(id.value)
  }
  // 3) Wire up scroll spy after sections are in the DOM.
  await nextTick()
  installObserver()
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
  observer = null
})

// ─── Autosave indicator ───
const autosaveLabel = computed(() => {
  if (!assessment.value) return 'Loading…'
  if (saving.value) return 'Saving…'
  return `Autosaved · ${completeCount.value}/${SECTIONS.length} sections complete`
})

// ─── Relative start date ───
const startedAtRelative = computed(() => {
  const iso = assessment.value?.startedAt
  if (!iso) return 'today'
  const d = new Date(iso)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  if (sameDay) return 'today'
  const dayMs = 24 * 60 * 60 * 1000
  const diff = Math.floor((today - d) / dayMs)
  if (diff === 1) return 'yesterday'
  if (diff < 7)  return `${diff} days ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})

// ─── Section update (called from each section's @update:modelValue) ───
function updateSection(sectionKey, payload) {
  if (!id.value) return
  assessmentStore.updateSection(id.value, sectionKey, payload)
}

// ─── Shared fields between customer and assessment ──────────────────────────
// Customer is the source of truth for: name, phone, agent, nextContactAt.
// The assessment's Personal Client 1 (fullName/phone), Notes Consultant, and
// Notes Next appointment all read LIVE from the customer and write back via
// the customer store. The assessment JSONB never stores the mirrored copies,
// so they can't drift apart.
//
// All other Personal fields (DOB, address, etc.), Client 2, Broker name,
// Date completed, Consultant/Broker notes, etc. stay on the assessment.

// Pending buffer for mirrored fields — updated SYNCHRONOUSLY on every
// keystroke so the input reflects what the user typed without waiting for
// the debounced customer-store PATCH. Cleared after the network round-trip
// confirms, so subsequent reads fall back to the canonical customer state.
const pendingMirrored = ref({})

function mirroredValue(field, customerValue) {
  return field in pendingMirrored.value
    ? pendingMirrored.value[field]
    : (customerValue ?? '')
}

const personalForView = computed(() => {
  const p = assessment.value?.personal ?? {}
  const c1 = { ...(p.client1 ?? {}) }
  c1.fullName = mirroredValue('name',  customer.value?.name)
  c1.phone    = mirroredValue('phone', customer.value?.phone)
  return { ...p, client1: c1 }
})

const metaForView = computed(() => ({
  consultantName:    mirroredValue('agent', customer.value?.agent),
  brokerName:        assessment.value?.brokerName    ?? '',
  dateCompleted:     assessment.value?.dateCompleted ?? '',
  nextAppointmentAt: ('nextContactAt' in pendingMirrored.value)
    ? pendingMirrored.value.nextContactAt
    : (customer.value?.nextContactAt ?? null),
}))

// Per-field debounce for customer-store writes — pending state updates
// immediately, network PATCH waits 2.5s. The window is generous so an agent
// who clears a field and retypes (clear → pause → type) doesn't trigger a
// premature validation failure mid-edit.
const MIRROR_DEBOUNCE_MS = 2500
const customerWriteTimers = new Map()
function debouncedCustomerWrite(field, value) {
  // 1) Instant display update
  pendingMirrored.value = { ...pendingMirrored.value, [field]: value }

  // 2) Debounced network write
  const existing = customerWriteTimers.get(field)
  if (existing) clearTimeout(existing)
  customerWriteTimers.set(field, setTimeout(async () => {
    customerWriteTimers.delete(field)
    const writeValue = value
    let didError = false
    try {
      if (field === 'nextContactAt') {
        await customerStore.setNextContactAt(id.value, writeValue)
      } else {
        await customerStore.updateCustomer(id.value, { [field]: writeValue })
      }
    } catch (e) {
      // Validation failed (or network blew up). Surface to the agent and
      // drop the pending value so the field snaps back to the canonical
      // customer state instead of showing the rejected value.
      didError = true
      notifyFromError(e, `Couldn't save ${field}`)
    } finally {
      // Clear pending if:
      //  - the write succeeded AND no newer keystroke arrived, OR
      //  - the write errored (always — show the canonical value)
      const stillCurrent = pendingMirrored.value[field] === writeValue
      if (didError || stillCurrent) {
        const next = { ...pendingMirrored.value }
        delete next[field]
        pendingMirrored.value = next
      }
    }
  }, MIRROR_DEBOUNCE_MS))
}

function handlePersonalUpdate(updated) {
  const newC1 = updated.client1 ?? {}
  // Route mirrored fields to the customer (pending buffer + debounced PATCH)
  if (newC1.fullName !== mirroredValue('name',  customer.value?.name)) {
    debouncedCustomerWrite('name', newC1.fullName ?? '')
  }
  if (newC1.phone    !== mirroredValue('phone', customer.value?.phone)) {
    debouncedCustomerWrite('phone', newC1.phone ?? '')
  }
  // Strip mirrored fields before writing the rest to the assessment JSONB
  const { fullName, phone, ...c1Rest } = newC1
  assessmentStore.updateSection(id.value, 'personal', {
    ...updated,
    client1: c1Rest,
  })
}

function handleMetaUpdate(partial) {
  const customerPatchKeys = ['consultantName', 'nextAppointmentAt']
  const assessmentMeta = { ...partial }

  if (partial.consultantName !== undefined &&
      partial.consultantName !== mirroredValue('agent', customer.value?.agent)) {
    debouncedCustomerWrite('agent', partial.consultantName)
  }
  if (partial.nextAppointmentAt !== undefined) {
    const current = ('nextContactAt' in pendingMirrored.value)
      ? pendingMirrored.value.nextContactAt
      : (customer.value?.nextContactAt ?? null)
    if (partial.nextAppointmentAt !== current) {
      debouncedCustomerWrite('nextContactAt', partial.nextAppointmentAt)
    }
  }

  // Forward non-mirrored fields (brokerName, dateCompleted) to assessment meta
  for (const key of customerPatchKeys) delete assessmentMeta[key]
  if (Object.keys(assessmentMeta).length) {
    assessmentStore.updateMeta(id.value, assessmentMeta)
  }
}

// ─── Print ───
// Calls the browser's print dialog. Print-specific layout lives in
// src/styles/print.css — hides the sidebar/nav rail/action bar and
// flattens form inputs so the printed (or PDF-exported) sheet reads
// like a paper assessment.
function printForm() {
  window.print()
}

// ─── Submit ───
const submitting = ref(false)
async function submit() {
  if (!id.value) return
  submitting.value = true
  try {
    await assessmentStore.submit(id.value)
    router.push(`/customers/${id.value}`)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.afm-placeholder {
  padding: 32px;
  text-align: center;
  font-size: 13.5px;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px dashed var(--border);
  border-radius: var(--r-md);
}
</style>
