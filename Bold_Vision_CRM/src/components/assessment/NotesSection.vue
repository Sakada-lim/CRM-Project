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
                 :value="meta.consultantName"
                 @input="updateMeta({ consultantName: $event.target.value })" />
        </div>
      </div>
      <div class="field">
        <label for="afm-broker">Broker</label>
        <div class="input-affix">
          <span class="prefix"><AppIcon name="user" :size="14" /></span>
          <input id="afm-broker" class="input has-prefix" type="text"
                 placeholder="Broker name"
                 :value="meta.brokerName"
                 @input="updateMeta({ brokerName: $event.target.value })" />
        </div>
      </div>
    </div>

    <div class="afm-notes-block">
      <div class="afm-notes-meta-grid">
        <div class="field">
          <label for="afm-preapproval-amount">Pre-approval amount</label>
          <div class="input-affix">
            <span class="prefix">$</span>
            <input id="afm-preapproval-amount" class="input has-prefix" type="text"
                   placeholder="0"
                   :value="notes.preApprovalAmount"
                   @input="updateNotes({ preApprovalAmount: $event.target.value })" />
          </div>
        </div>
        <div class="field">
          <label for="afm-preapproval-lender">Pre-approval lender</label>
          <input id="afm-preapproval-lender" class="input" type="text"
                 placeholder="e.g. Westpac"
                 :value="notes.preApprovalLender"
                 @input="updateNotes({ preApprovalLender: $event.target.value })" />
        </div>
      </div>
      <div class="field">
        <label for="afm-cnotes">Consultant notes</label>
        <textarea id="afm-cnotes" class="textarea" style="min-height:100px"
                  placeholder="What stood out? Decisions, blockers, follow-ups…"
                  :value="notes.consultantNotes"
                  @input="updateNotes({ consultantNotes: $event.target.value })"></textarea>
      </div>
      <div class="field">
        <label for="afm-bnotes">Broker notes (borrowing capacity)</label>
        <textarea id="afm-bnotes" class="textarea" style="min-height:80px"
                  placeholder="Borrowing capacity estimate, pre-approval status, conditions…"
                  :value="notes.brokerNotes"
                  @input="updateNotes({ brokerNotes: $event.target.value })"></textarea>
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
          <input id="afm-next" class="input" type="datetime-local"
                 :value="datetimeLocalValue"
                 @input="updateMeta({ nextAppointmentAt: toIso($event.target.value) })" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '../base/AppIcon.vue'

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
