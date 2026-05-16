<template>
  <div class="followups">
    <div class="followups-header mb-4">
      <div class="d-flex align-center justify-space-between flex-wrap gap-2">
        <div>
          <h2>Follow-ups</h2>
          <p class="text-body-2 text-medium-emphasis mt-1">{{ weekRangeLabel }}</p>
        </div>
        <div class="d-flex gap-2">
          <v-chip v-if="overdueCount" color="error" size="small" prepend-icon="mdi-alert-circle-outline">
            {{ overdueCount }} overdue
          </v-chip>
          <v-chip v-if="unscheduledCount" color="warning" size="small" prepend-icon="mdi-calendar-remove-outline">
            {{ unscheduledCount }} unscheduled
          </v-chip>
          <v-chip v-if="!overdueCount && !unscheduledCount" color="success" size="small" prepend-icon="mdi-check-circle-outline">
            All caught up
          </v-chip>
        </div>
      </div>
    </div>

    <!-- Kanban board -->
    <div class="kanban-board">
      <!-- Overdue column -->
      <div
        class="kanban-column kanban-column--overdue"
        :class="{ 'kanban-column--over': dragOverColumn === 'overdue' }"
        @dragover.prevent="dragOverColumn = 'overdue'"
        @dragleave="dragOverColumn = null"
        @drop.prevent="onDrop('overdue')"
      >
        <div class="kanban-column__header">
          <span class="kanban-column__title">Overdue</span>
          <v-chip size="x-small" color="error" variant="flat" class="ml-1">{{ overdue.length }}</v-chip>
        </div>
        <div class="kanban-column__cards">
          <KanbanCard
            v-for="c in overdue"
            :key="c.id"
            :customer="c"
            @dragstart="onDragStart(c)"
            @dragend="dragOverColumn = null"
            @mark-contacted="openMarkContacted(c)"
            @clear-schedule="clearSchedule(c)"
          />
          <div v-if="!overdue.length" class="kanban-empty-state">
            <v-icon size="18" color="success">mdi-check-circle-outline</v-icon>
            <span>All clear</span>
          </div>
        </div>
      </div>

      <!-- No schedule column -->
      <div
        class="kanban-column kanban-column--unscheduled"
        :class="{ 'kanban-column--over': dragOverColumn === 'unscheduled' }"
        @dragover.prevent="dragOverColumn = 'unscheduled'"
        @dragleave="dragOverColumn = null"
        @drop.prevent="onDrop('unscheduled')"
      >
        <div class="kanban-column__header">
          <span class="kanban-column__title">No schedule</span>
          <v-chip v-if="unscheduled.length" size="x-small" color="warning" variant="flat" class="ml-1">{{ unscheduled.length }}</v-chip>
        </div>
        <div class="kanban-column__cards">
          <KanbanCard
            v-for="c in unscheduled"
            :key="c.id"
            :customer="c"
            :show-status="true"
            @dragstart="onDragStart(c)"
            @dragend="dragOverColumn = null"
            @mark-contacted="openMarkContacted(c)"
            @clear-schedule="clearSchedule(c)"
          />
          <div v-if="!unscheduled.length" class="kanban-empty-state">
            <v-icon size="18" color="success">mdi-check-circle-outline</v-icon>
            <span>All scheduled</span>
          </div>
        </div>
      </div>

        <!-- Visual divider between special columns and day columns -->
      <div class="kanban-divider" />

      <!-- Day columns (today → today+6) -->
      <div
        v-for="bucket in days"
        :key="bucket.date.toISOString()"
        class="kanban-column"
        :class="[
          isToday(bucket.date) && 'kanban-column--today',
          dragOverColumn === bucket.date.toDateString() && 'kanban-column--over'
        ]"
        @dragover.prevent="dragOverColumn = bucket.date.toDateString()"
        @dragleave="dragOverColumn = null"
        @drop.prevent="onDrop(bucket.date)"
      >
        <div class="kanban-column__header">
          <span class="kanban-column__title">{{ formatDayLabel(bucket.date) }}</span>
          <v-chip v-if="bucket.customers.length" size="x-small" color="primary" variant="flat" class="ml-1">{{ bucket.customers.length }}</v-chip>
        </div>
        <div class="kanban-column__cards">
          <KanbanCard
            v-for="c in bucket.customers"
            :key="c.id"
            :customer="c"
            @dragstart="onDragStart(c)"
            @dragend="dragOverColumn = null"
            @mark-contacted="openMarkContacted(c)"
            @clear-schedule="clearSchedule(c)"
          />
          <p v-if="!bucket.customers.length" class="kanban-empty">—</p>
          <!-- drop zone visual when empty and dragging -->

        </div>
      </div>
    </div>

    <!-- Reschedule dialog -->
    <v-dialog v-model="rescheduleDialog.open" max-width="380">
      <v-card>
        <v-card-title>Reschedule {{ rescheduleDialog.customer?.name }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="rescheduleDialog.date"
            label="Date"
            type="date"
            class="mb-2"
          />
          <v-text-field
            v-model="rescheduleDialog.time"
            label="Time"
            type="time"
          />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="rescheduleDialog.open = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="confirmReschedule">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Mark contacted dialog -->
    <v-dialog v-model="markContactedDialog.open" max-width="400">
      <v-card>
        <v-card-title>Mark as contacted</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">
            Last contacted will be set to now for <strong>{{ markContactedDialog.customer?.name }}</strong>.
          </p>
          <p class="text-body-2 font-weight-medium mb-2">When should we contact next?</p>
          <v-text-field v-model="markContactedDialog.date" label="Date" type="date" class="mb-2" />
          <v-text-field v-model="markContactedDialog.time" label="Time" type="time" class="mb-2" />
          <v-btn
            variant="tonal"
            size="small"
            class="mb-3"
            @click="applyDefaultCadence"
          >
            {{ cadenceButtonLabel }}
          </v-btn>
          <v-checkbox v-model="markContactedDialog.skip" label="Skip — don't schedule next contact" density="compact" hide-details />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="markContactedDialog.open = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="confirmMarkContacted">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCustomerStore } from '../stores/customerStore'
import { useCustomerFollowups } from '../composables/useCustomerFollowups'
import { cadenceMonths, cadenceLabel } from '../utils/followUp'
import KanbanCard from '../components/followups/KanbanCard.vue'

const store = useCustomerStore()
const customers = computed(() => store.customers)

const { overdue, unscheduled, days, overdueCount, unscheduledCount } =
  useCustomerFollowups(customers)

// ── Drag state ──────────────────────────────────────────────────────────────
const dragCustomer = ref(null)
const dragOverColumn = ref(null)

function onDragStart(customer) {
  dragCustomer.value = customer
}

function onDrop(target) {
  dragOverColumn.value = null
  if (!dragCustomer.value) return

  if (target === 'overdue' || target === 'unscheduled') {
    if (target === 'unscheduled') {
      openRescheduleFor(dragCustomer.value, null)
    }
    dragCustomer.value = null
    return
  }

  // target is a Date — open reschedule dialog with that date pre-filled
  const c = dragCustomer.value
  dragCustomer.value = null
  openRescheduleFor(c, target)
}

// ── Reschedule dialog ───────────────────────────────────────────────────────
const rescheduleDialog = ref({ open: false, customer: null, date: '', time: '' })

function openRescheduleFor(customer, date) {
  const existing = customer.nextContactAt ? new Date(customer.nextContactAt) : null
  const targetDate = date ?? new Date()

  rescheduleDialog.value = {
    open: true,
    customer,
    date: toDateInput(targetDate),
    time: existing ? toTimeInput(existing) : '09:00',
  }
}

async function confirmReschedule() {
  const { customer, date, time } = rescheduleDialog.value
  if (!date) { rescheduleDialog.value.open = false; return }
  const iso = new Date(`${date}T${time || '09:00'}`).toISOString()
  await store.setNextContactAt(customer.id, iso)
  rescheduleDialog.value.open = false
}

async function clearSchedule(customer) {
  await store.setNextContactAt(customer.id, null)
}

// ── Mark contacted dialog ───────────────────────────────────────────────────
const markContactedDialog = ref({ open: false, customer: null, date: '', time: '', skip: false })

function openMarkContacted(customer) {
  markContactedDialog.value = { open: true, customer, date: '', time: '', skip: false }
}

const cadenceButtonLabel = computed(() => {
  const c = markContactedDialog.value.customer
  if (!c) return ''
  return `${cadenceLabel(c.category)} (${c.category} default)`
})

function applyDefaultCadence() {
  const c = markContactedDialog.value.customer
  if (!c) return
  const next = new Date()
  next.setMonth(next.getMonth() + cadenceMonths(c.category))
  markContactedDialog.value.date = toDateInput(next)
  markContactedDialog.value.time = '09:00'
  markContactedDialog.value.skip = false
}

async function confirmMarkContacted() {
  const { customer, date, time, skip } = markContactedDialog.value
  const now = new Date().toISOString()
  const nextIso = skip || !date ? null : new Date(`${date}T${time || '09:00'}`).toISOString()
  await store.logContact(customer.id, now, nextIso)
  markContactedDialog.value.open = false
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const weekRangeLabel = computed(() => {
  const d = days.value
  if (!d.length) return ''
  const first = d[0].date
  const last = d[d.length - 1].date
  const fmt = (date) => date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  return `${fmt(first)} – ${fmt(last)}, ${first.getFullYear()}`
})

function toDateInput(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toTimeInput(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isToday(date) {
  const t = new Date()
  return date.getFullYear() === t.getFullYear() && date.getMonth() === t.getMonth() && date.getDate() === t.getDate()
}

function formatDayLabel(date) {
  if (isToday(date)) return 'Today'
  return date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.followups-header h2 {
  font-size: 1.6rem;
  font-weight: 700;
}

.kanban-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  align-items: stretch;
  padding-bottom: 16px;
  min-height: calc(100vh - 220px);
}

.kanban-divider {
  flex: 0 0 1px;
  background: #e2e8f0;
  align-self: stretch;
  margin: 0 4px;
}

.kanban-column {
  flex: 0 0 200px;
  min-height: 240px;
  background: #f8fafc;
  border-radius: 10px;
  border: 2px solid transparent;
  transition: border-color 0.15s, background 0.15s;
}

.kanban-column--today {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.kanban-column--today .kanban-column__title {
  color: #0284c7;
}

.kanban-column--over {
  border-color: #6366f1 !important;
  background: #eef2ff;
}

.kanban-column--overdue {
  background: #fef2f2;
}

.kanban-column--unscheduled {
  background: #fffbeb;
}

.kanban-column__header {
  display: flex;
  align-items: center;
  padding: 10px 12px 8px;
  border-bottom: 1px solid #e2e8f0;
}

.kanban-column__title {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
  flex: 1;
}

.kanban-column__cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 8px;
}

.kanban-empty {
  font-size: 0.75rem;
  color: #cbd5e1;
  text-align: center;
  padding: 16px 0;
  margin: 0;
}

.kanban-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 0;
  font-size: 0.75rem;
  color: #64748b;
}
</style>
