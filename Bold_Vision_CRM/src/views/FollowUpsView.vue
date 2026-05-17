<template>
  <div class="fu-shell">
    <!-- Header -->
    <div class="fu-header">
      <div class="fu-title">
        <h1>Follow-ups</h1>
        <div class="range">
          <template v-if="totalTasks === 0">
            <AppIcon name="check" :size="13" class="fu-range-check" />
            All caught up — nothing scheduled in this view
          </template>
          <template v-else>
            {{ weekRangeLabel }} · {{ totalTasks }} task{{ totalTasks === 1 ? '' : 's' }}
          </template>
        </div>
      </div>

      <div class="fu-controls">
        <span v-if="overdueCount" class="pill hot" style="height: 28px; padding: 0 12px;">
          <span class="dot"></span>{{ overdueCount }} overdue
        </span>

        <div class="fu-weeknav" role="group" aria-label="Week navigation">
          <button type="button" aria-label="Previous week" @click="weekOffset--">
            <AppIcon name="arrow-left" :size="14" />
          </button>
          <button type="button" class="today-btn" @click="weekOffset = 0">Today</button>
          <button type="button" aria-label="Next week" @click="weekOffset++">
            <AppIcon name="arrow-right" :size="14" />
          </button>
        </div>

        <select v-model="sortMode" class="select fu-sort-select" aria-label="Sort follow-ups">
          <option value="time">Time</option>
          <option value="category">Hot first</option>
          <option value="name">Name (A–Z)</option>
        </select>

        <button type="button" class="btn btn-ghost" @click="showFilterDialog = true">
          <AppIcon name="filter" :size="14" />
          Filters
          <span v-if="filterCount" class="tab-ct">{{ filterCount }}</span>
        </button>
      </div>
    </div>

    <!-- Phone: smart inbox feed (no kanban — single vertical list) -->
    <div v-if="isPhone" class="fu-feed">
      <div class="fu-feed-chips" role="tablist" aria-label="Filter follow-ups">
        <button
          v-for="opt in phoneFilterOptions"
          :key="opt.value"
          type="button"
          :aria-pressed="phoneFilter === opt.value"
          @click="phoneFilter = opt.value"
        >
          {{ opt.label }}
          <span v-if="opt.count" class="ct">{{ opt.count }}</span>
        </button>
      </div>

      <div class="fu-feed-list">
        <KanbanCard
          v-for="c in feedCards"
          :key="c.id"
          :customer="c"
          :show-date="true"
          @mark-contacted="openMarkContacted(c)"
        />
        <div v-if="!feedCards.length" class="fu-feed-empty">
          <AppIcon name="check" :size="18" />
          <span>{{ phoneFilter === 'all' ? 'All caught up' : `No ${phoneFilterLabel} follow-ups` }}</span>
        </div>
      </div>
    </div>

    <!-- Desktop / tablet: kanban board -->
    <div v-else class="fu-board">
      <!-- Overdue (drop target disabled — read-only bucket) -->
      <div class="fu-col is-overdue">
        <div class="fu-col-head">
          <span class="lbl"><AppIcon name="bell" :size="12" /> Overdue</span>
          <span class="count">{{ overdueFiltered.length }}</span>
        </div>
        <div class="fu-col-body">
          <KanbanCard
            v-for="c in overdueFiltered"
            :key="c.id"
            :customer="c"
            @dragstart="onDragStart(c)"
            @dragend="dragOverColumn = null"
            @mark-contacted="openMarkContacted(c)"
          />
          <div v-if="!overdueFiltered.length" class="fu-empty">
            <AppIcon name="check" :size="16" />
            <span>Nothing overdue</span>
          </div>
        </div>
      </div>

      <!-- No schedule -->
      <div
        class="fu-col is-empty-set"
        :class="{ 'is-drop-target': dragOverColumn === 'unscheduled' }"
        @dragover.prevent="dragOverColumn = 'unscheduled'"
        @dragleave="dragOverColumn = null"
        @drop.prevent="onDrop('unscheduled')"
      >
        <div class="fu-col-head">
          <span class="lbl"><AppIcon name="calendar" :size="12" /> No schedule</span>
          <span class="count">{{ unscheduledFiltered.length }}</span>
        </div>
        <div class="fu-col-body">
          <KanbanCard
            v-for="c in unscheduledFiltered"
            :key="c.id"
            :customer="c"
            @dragstart="onDragStart(c)"
            @dragend="dragOverColumn = null"
            @mark-contacted="openMarkContacted(c)"
          />
          <div v-if="!unscheduledFiltered.length" class="fu-empty">
            <AppIcon name="check" :size="16" />
            <span>All scheduled</span>
          </div>
        </div>
      </div>

      <!-- Day columns -->
      <div
        v-for="(bucket, idx) in dayBucketsFiltered"
        :key="bucket.date.toISOString()"
        class="fu-col"
        :class="[
          isToday(bucket.date) && 'is-today',
          isWeekend(bucket.date) && !isToday(bucket.date) && 'is-weekend',
          dragOverColumn === bucket.date.toDateString() && 'is-drop-target',
        ]"
        @dragover.prevent="dragOverColumn = bucket.date.toDateString()"
        @dragleave="dragOverColumn = null"
        @drop.prevent="onDrop(bucket.date)"
      >
        <div class="fu-col-head">
          <span class="lbl">
            <template v-if="isToday(bucket.date)">Today</template>
            <template v-else>{{ weekdayLabel(bucket.date) }}</template>
            <span class="date">· {{ shortDateLabel(bucket.date) }}</span>
          </span>
          <span class="count">{{ bucket.customers.length }}</span>
        </div>
        <div class="fu-col-body">
          <KanbanCard
            v-for="c in bucket.customers"
            :key="c.id"
            :customer="c"
            @dragstart="onDragStart(c)"
            @dragend="dragOverColumn = null"
            @mark-contacted="openMarkContacted(c)"
          />
          <div v-if="!bucket.customers.length" class="fu-empty">
            <span>{{ isPast(bucket.date) ? '—' : 'Drop a card here' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter dialog -->
    <FollowUpsFilterDialog
      v-model="showFilterDialog"
      :selected="activeCategories"
      @apply="applyFilters"
      @clear="clearFilters"
    />

    <!-- Reschedule dialog -->
    <v-dialog v-model="rescheduleDialog.open" :max-width="420" :scrim="'rgba(15,23,42,0.65)'">
      <div class="modal-card">
        <header class="modal-head">
          <span class="ico"><AppIcon name="calendar" :size="18" /></span>
          <div class="modal-head__text">
            <h2>Reschedule</h2>
            <div class="sub">{{ rescheduleDialog.customer?.name }}</div>
          </div>
          <button class="close" aria-label="Close" @click="rescheduleDialog.open = false">
            <AppIcon name="x" :size="16" />
          </button>
        </header>
        <div class="modal-body">
          <div class="split-grid cols-2">
            <div class="field">
              <label for="fu-r-date">Date</label>
              <input id="fu-r-date" v-model="rescheduleDialog.date" type="date" class="input" />
            </div>
            <div class="field">
              <label for="fu-r-time">Time</label>
              <input id="fu-r-time" v-model="rescheduleDialog.time" type="time" class="input" />
            </div>
          </div>
        </div>
        <div class="modal-foot modal-foot--split">
          <button type="button" class="btn btn-ghost" @click="clearScheduleFromDialog">Clear schedule</button>
          <div class="actions">
            <button type="button" class="btn btn-ghost" @click="rescheduleDialog.open = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="confirmReschedule">
              <AppIcon name="check" :size="14" />
              Confirm
            </button>
          </div>
        </div>
      </div>
    </v-dialog>

    <!-- Mark contacted dialog -->
    <v-dialog v-model="markContactedDialog.open" :max-width="460" :scrim="'rgba(15,23,42,0.65)'">
      <div class="modal-card">
        <header class="modal-head">
          <span class="ico"><AppIcon name="check" :size="18" /></span>
          <div class="modal-head__text">
            <h2>Mark contacted</h2>
            <div class="sub">{{ markContactedDialog.customer?.name }}</div>
          </div>
          <button class="close" aria-label="Close" @click="markContactedDialog.open = false">
            <AppIcon name="x" :size="16" />
          </button>
        </header>
        <div class="modal-body">
          <div class="modal-section">
            <p class="fu-dialog-hint">Last contacted will be set to <strong>now</strong>.</p>
          </div>
          <div class="modal-section">
            <h4>Next contact</h4>
            <div class="split-grid cols-2">
              <div class="field">
                <label for="fu-mc-date">Date</label>
                <input id="fu-mc-date" v-model="markContactedDialog.date" type="date" class="input" :disabled="markContactedDialog.skip" />
              </div>
              <div class="field">
                <label for="fu-mc-time">Time</label>
                <input id="fu-mc-time" v-model="markContactedDialog.time" type="time" class="input" :disabled="markContactedDialog.skip" />
              </div>
            </div>
            <button type="button" class="btn btn-ghost sm" :disabled="markContactedDialog.skip" @click="applyDefaultCadence">
              <AppIcon name="sparkle" :size="13" />
              {{ cadenceButtonLabel }}
            </button>
            <label class="fu-dialog-skip">
              <input type="checkbox" v-model="markContactedDialog.skip" />
              Skip — don't schedule next contact
            </label>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" @click="markContactedDialog.open = false">Cancel</button>
          <button type="button" class="btn btn-primary" @click="confirmMarkContacted">
            <AppIcon name="check" :size="14" />
            Confirm
          </button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCustomerStore } from '../stores/customerStore'
import { useCustomerFollowups } from '../composables/useCustomerFollowups'
import { cadenceMonths, cadenceLabel } from '../utils/followUp'
import KanbanCard from '../components/followups/KanbanCard.vue'
import FollowUpsFilterDialog from '../components/followups/FollowUpsFilterDialog.vue'
import AppIcon from '../components/base/AppIcon.vue'

const store = useCustomerStore()
const customers = computed(() => store.customers)

// Phone viewport detection — swaps the desktop kanban for a vertical "smart
// inbox" feed (no columns, no horizontal scroll).
const isPhone = ref(false)
let mql = null
const updateMql = () => { isPhone.value = mql?.matches ?? false }
onMounted(() => {
  mql = window.matchMedia('(max-width: 720px)')
  isPhone.value = mql.matches
  mql.addEventListener('change', updateMql)
})
onUnmounted(() => mql?.removeEventListener('change', updateMql))

// ── Week navigation ─────────────────────────────────────────────────────────
const weekOffset = ref(0)

const { overdue, unscheduled, days, overdueCount } = useCustomerFollowups(customers, weekOffset)

// ── Filters (category only for now) ────────────────────────────────────────
const showFilterDialog = ref(false)
const activeCategories = ref([])  // e.g. ['Hot','Warm']
const filterCount = computed(() => activeCategories.value.length)

function matchesFilter(c) {
  if (!activeCategories.value.length) return true
  return activeCategories.value.includes(c.category)
}

// ── Sort within each column ─────────────────────────────────────────────────
const sortMode = ref('time')   // 'time' (default — earliest first) | 'category' (Hot→Warm→Cold) | 'name'
const STATUS_RANK = { Hot: 0, Warm: 1, Cold: 2 }
function applySort(list) {
  if (sortMode.value === 'category') {
    return [...list].sort((a, b) =>
      (STATUS_RANK[a.category] ?? 9) - (STATUS_RANK[b.category] ?? 9)
      || (a.name || '').localeCompare(b.name || ''),
    )
  }
  if (sortMode.value === 'name') {
    return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }
  return list  // 'time' — already sorted by next_contact_at in the bucket function
}

const overdueFiltered     = computed(() => applySort(overdue.value.filter(matchesFilter)))
const unscheduledFiltered = computed(() => applySort(unscheduled.value.filter(matchesFilter)))
const dayBucketsFiltered  = computed(() =>
  days.value.map((b) => ({ date: b.date, customers: applySort(b.customers.filter(matchesFilter)) })),
)

// ── Phone smart-inbox feed ─────────────────────────────────────────────────
// Drops the kanban metaphor for phone widths and shows a single chronological
// list of cards. Filter chips at top let the agent narrow to overdue / today /
// this week / unscheduled. Each card renders its own date label inline
// (KanbanCard's show-date prop) so no column context is needed.
const phoneFilter = ref('all')

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate()
}

const scheduledFlat = computed(() => dayBucketsFiltered.value.flatMap((b) => b.customers))

const todayCount = computed(() => {
  const t = new Date()
  return scheduledFlat.value.filter((c) =>
    c.nextContactAt && isSameDay(new Date(c.nextContactAt), t),
  ).length
})

const phoneFilterOptions = computed(() => [
  { value: 'all',         label: 'All',         count: overdueFiltered.value.length + scheduledFlat.value.length + unscheduledFiltered.value.length },
  { value: 'overdue',     label: 'Overdue',     count: overdueFiltered.value.length },
  { value: 'today',       label: 'Today',       count: todayCount.value },
  { value: 'week',        label: 'This week',   count: scheduledFlat.value.length },
  { value: 'unscheduled', label: 'No schedule', count: unscheduledFiltered.value.length },
])

const phoneFilterLabel = computed(() =>
  phoneFilterOptions.value.find((o) => o.value === phoneFilter.value)?.label.toLowerCase() ?? '',
)

const feedCards = computed(() => {
  const t = new Date()
  switch (phoneFilter.value) {
    case 'overdue':
      return overdueFiltered.value
    case 'today':
      return scheduledFlat.value.filter((c) =>
        c.nextContactAt && isSameDay(new Date(c.nextContactAt), t),
      )
    case 'week':
      return scheduledFlat.value
    case 'unscheduled':
      return unscheduledFiltered.value
    default:
      // 'all' — overdue (most urgent first) → upcoming chronological → unscheduled
      return [
        ...overdueFiltered.value,
        ...scheduledFlat.value,
        ...unscheduledFiltered.value,
      ]
  }
})

const totalTasks = computed(() => {
  let n = overdueFiltered.value.length + unscheduledFiltered.value.length
  for (const b of dayBucketsFiltered.value) n += b.customers.length
  return n
})

function applyFilters(categories) {
  activeCategories.value = [...categories]
  showFilterDialog.value = false
}
function clearFilters() {
  activeCategories.value = []
}

// ── Drag state ──────────────────────────────────────────────────────────────
const dragCustomer = ref(null)
const dragOverColumn = ref(null)

function onDragStart(customer) {
  dragCustomer.value = customer
}

function onDrop(target) {
  dragOverColumn.value = null
  if (!dragCustomer.value) return
  const c = dragCustomer.value
  dragCustomer.value = null
  if (target === 'unscheduled') {
    openRescheduleFor(c, null)
  } else {
    openRescheduleFor(c, target)  // a Date object
  }
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

async function clearScheduleFromDialog() {
  const { customer } = rescheduleDialog.value
  if (customer) await store.setNextContactAt(customer.id, null)
  rescheduleDialog.value.open = false
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
  await store.logContact(customer.id, { lastContactedIso: now, nextContactIso: nextIso })
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
  return date.getFullYear() === t.getFullYear()
      && date.getMonth() === t.getMonth()
      && date.getDate() === t.getDate()
}
function isWeekend(date) {
  const d = date.getDay()
  return d === 0 || d === 6
}
function isPast(date) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return date < now && !isToday(date)
}
function weekdayLabel(date) {
  return date.toLocaleDateString('en-AU', { weekday: 'short' })
}
function shortDateLabel(date) {
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.fu-dialog-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}
.fu-dialog-skip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--text-muted);
  cursor: pointer;
  margin-top: 8px;
}
.fu-dialog-skip input[type="checkbox"] { cursor: pointer; }

/* Filter count badge inside the Filters button */
.fu-controls .btn .tab-ct {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  background: var(--accent);
  color: var(--text-on-accent, white);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 4px;
}

/* Sort dropdown — narrower than a full input, sits inline in the controls row */
.fu-sort-select {
  width: auto;
  min-width: 140px;
  height: 36px;
  padding: 0 28px 0 12px;
  font-size: 13px;
}

/* "All caught up" subtitle decoration */
.fu-range-check {
  color: var(--success);
  vertical-align: -2px;
  margin-right: 2px;
}

</style>
