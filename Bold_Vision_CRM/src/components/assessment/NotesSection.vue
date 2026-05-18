<template>
  <section id="notes" class="afm-section">
    <div class="head">
      <span class="num">7</span>
      <div style="flex:1;min-width:0">
        <h2>Notes &amp; next steps</h2>
        <div class="desc">Capture the takeaways and book the next chat.</div>
      </div>
    </div>

    <div class="afm-notes-meta-grid">
      <div class="field">
        <label for="afm-consultant">Consultant</label>
        <div class="input-affix">
          <span class="prefix"><AppIcon name="user" :size="14" /></span>
          <input id="afm-consultant" class="input has-prefix" type="text"
                 placeholder="Consultant name"
                 :maxlength="LIMITS.assessmentText.max"
                 :value="meta.consultantName"
                 @input="updateMeta({ consultantName: $event.target.value })" />
        </div>
      </div>
      <div class="field">
        <label for="afm-broker">Broker</label>
        <div :class="['afm-field-with-na', { 'afm-na-on': isNA('brokerName') }]">
          <div class="input-affix">
            <span class="prefix"><AppIcon name="user" :size="14" /></span>
            <input id="afm-broker" class="input has-prefix" type="text"
                   :placeholder="isNA('brokerName') ? 'N/A' : 'Broker name'"
                   :maxlength="LIMITS.assessmentText.max"
                   :value="meta.brokerName"
                   @input="updateMeta({ brokerName: $event.target.value })" />
          </div>
          <NAButton :active="isNA('brokerName')"
                    @toggle="toggleNA('brokerName', { clearMeta: { brokerName: '' } })" />
        </div>
      </div>
    </div>

    <div class="afm-notes-block">
      <div class="afm-notes-meta-grid">
        <div class="field">
          <label for="afm-preapproval-amount">Pre-approval amount</label>
          <div :class="['afm-field-with-na', { 'afm-na-on': isNA('preApprovalAmount') }]">
            <div class="input-affix">
              <span class="prefix">$</span>
              <input id="afm-preapproval-amount" class="input has-prefix" type="text"
                     :placeholder="isNA('preApprovalAmount') ? 'N/A' : '0'"
                     inputmode="decimal"
                     maxlength="15"
                     :value="notes.preApprovalAmount"
                     @keydown="currencyKeydown"
                     @input="updateNotes({ preApprovalAmount: currencySanitize($event.target.value) })" />
            </div>
            <NAButton :active="isNA('preApprovalAmount')"
                      @toggle="toggleNA('preApprovalAmount', { clearNotes: { preApprovalAmount: '' } })" />
          </div>
        </div>
        <div class="field">
          <label for="afm-preapproval-lender">Pre-approval lender</label>
          <div :class="['afm-field-with-na', { 'afm-na-on': isNA('preApprovalLender') }]">
            <input id="afm-preapproval-lender" class="input" type="text"
                   :placeholder="isNA('preApprovalLender') ? 'N/A' : 'e.g. Westpac'"
                   :maxlength="LIMITS.assessmentText.max"
                   :value="notes.preApprovalLender"
                   @input="updateNotes({ preApprovalLender: $event.target.value })" />
            <NAButton :active="isNA('preApprovalLender')"
                      @toggle="toggleNA('preApprovalLender', { clearNotes: { preApprovalLender: '' } })" />
          </div>
        </div>
      </div>
      <div class="field">
        <label for="afm-cnotes">Consultant notes</label>
        <textarea id="afm-cnotes" class="textarea" style="min-height:100px"
                  placeholder="What stood out? Decisions, blockers, follow-ups…"
                  :maxlength="LIMITS.assessmentNote.max"
                  :value="notes.consultantNotes"
                  @input="updateNotes({ consultantNotes: $event.target.value })"></textarea>
      </div>
      <div class="field">
        <label for="afm-bnotes">Broker notes (borrowing capacity)</label>
        <div :class="['afm-field-with-na', { 'afm-na-on': isNA('brokerNotes') }]">
          <textarea id="afm-bnotes" class="textarea" style="min-height:80px"
                    :placeholder="isNA('brokerNotes') ? 'N/A' : 'Borrowing capacity estimate, pre-approval status, conditions…'"
                    :maxlength="LIMITS.assessmentNote.max"
                    :value="notes.brokerNotes"
                    @input="updateNotes({ brokerNotes: $event.target.value })"></textarea>
          <NAButton :active="isNA('brokerNotes')"
                    @toggle="toggleNA('brokerNotes', { clearNotes: { brokerNotes: '' } })" />
        </div>
      </div>
      <div class="afm-notes-meta-grid">
        <div class="field">
          <label for="afm-date">Date completed</label>
          <input id="afm-date" class="input" type="date"
                 :value="meta.dateCompleted"
                 @input="updateMeta({ dateCompleted: $event.target.value || null })" />
        </div>
        <div class="field">
          <label for="afm-next">Next appointment date</label>
          <div :class="['afm-field-with-na', { 'afm-na-on': isNA('nextAppointmentAt') }]">
            <input id="afm-next" class="input" type="datetime-local"
                   :value="datetimeLocalValue"
                   @input="updateMeta({ nextAppointmentAt: toIso($event.target.value) })" />
            <NAButton :active="isNA('nextAppointmentAt')"
                      @toggle="toggleNA('nextAppointmentAt', { clearMeta: { nextAppointmentAt: null } })" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '../base/AppIcon.vue'
import NAButton from './NAButton.vue'
import { LIMITS } from '../../utils/validators'
import { currencyKeydown, currencySanitize } from '../../utils/inputFilters'

const props = defineProps({
  notes: { type: Object, default: () => ({}) },
  meta:  { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:notes', 'update:meta'])

function updateNotes(partial) {
  emit('update:notes', { ...props.notes, ...partial })
}

function updateMeta(partial) {
  emit('update:meta', partial)
}

// N/A flags for all Notes section optional fields live in `notes.na`, even
// when the underlying value is on a top-level meta column (brokerName,
// nextAppointmentAt). Toggling clears the value in whichever store owns it
// AND flips the flag in `notes.na` in a single payload.
function isNA(key) {
  return props.notes?.na?.[key] === true
}

function toggleNA(key, { clearNotes = null, clearMeta = null } = {}) {
  const na = { ...(props.notes?.na ?? {}) }
  const nextActive = !na[key]
  if (nextActive) na[key] = true
  else delete na[key]

  // Always emit the new notes payload (with na + any clearNotes patches)
  emit('update:notes', {
    ...props.notes,
    ...(nextActive && clearNotes ? clearNotes : {}),
    na,
  })
  // And if the value lives on the meta side, clear it there too on activate
  if (nextActive && clearMeta) {
    emit('update:meta', clearMeta)
  }
}

// <input type="datetime-local"> needs `YYYY-MM-DDTHH:MM`; we store ISO strings.
const datetimeLocalValue = computed(() => {
  const iso = props.meta?.nextAppointmentAt
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
})

function toIso(local) {
  if (!local) return null
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
</script>

<style scoped>
.afm-notes-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 14px;
}
.afm-notes-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.afm-notes-block .afm-notes-meta-grid { margin-bottom: 0; }

@media (max-width: 720px) {
  .afm-notes-meta-grid { grid-template-columns: 1fr; gap: 12px; }
}
</style>
