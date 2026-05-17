<template>
  <div class="customers">
    <CustomersToolbar
      v-model:search="searchQuery"
      v-model:filters="toolbarFilters"
      v-model:quick-category="quickCategory"
      v-model:sort="sortOption"
      :sort-options="SORT_OPTIONS"
      :available-filters="filterDefinitions"
      :supporting-text="supportingText"
      @add="openAddCustomer"
      @open-filters="openFilterDialog"
    />

    <div v-if="overdueCount > 0" class="cust-banner">
      <div class="cust-banner__icon">
        <AppIcon name="bell" :size="14" />
      </div>
      <div class="cust-banner__body">
        <strong>{{ overdueCount }} customer{{ overdueCount === 1 ? '' : 's' }}</strong>
        {{ overdueCount === 1 ? ' is' : ' are' }} overdue for follow-up. Sort by overdue first to triage.
      </div>
      <button class="btn btn-ghost sm cust-banner__action" @click="sortOption = 'overdue'">
        Triage now
        <AppIcon name="arrow-right" :size="12" />
      </button>
    </div>

    <!-- Desktop / tablet table -->
    <div class="cust-table-wrap">
      <table class="cust-table">
        <thead>
          <tr>
            <th class="col-customer">Customer</th>
            <th class="col-channel">Phone · Channel</th>
            <th class="col-status">Status</th>
            <th class="col-followup">Last contact</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!paginatedCustomers.length">
            <td colspan="5" class="cust-empty">
              {{ emptyMessage }}
            </td>
          </tr>
          <tr
            v-for="c in paginatedCustomers"
            :key="c.id"
            class="cust-row"
            @click="goToCustomer(c)"
          >
            <td class="col-customer">
              <div class="cust-name-cell">
                <div class="cust-avatar" :data-tone="avatarTone(c)">{{ initials(c.name) }}</div>
                <div class="cust-name-cell__meta">
                  <div class="nm">{{ c.name || 'Unnamed' }}</div>
                  <div class="em">{{ c.email || '—' }}</div>
                </div>
              </div>
            </td>
            <td class="col-channel">
              <div class="phone-cell">
                <div class="num">{{ c.phone || '—' }}</div>
                <div class="ch">
                  <AppIcon :name="channelIcon(c.channel)" :size="11" />
                  Prefers {{ c.channel }}
                </div>
              </div>
            </td>
            <td class="col-status">
              <span class="pill" :class="categoryToneClass(c.category)">
                <span class="dot"></span>{{ c.category }}
              </span>
            </td>
            <td class="col-followup">
              <div class="due-cell">
                <div class="due-main" :data-tone="dueTone(c)">{{ dueText(c) }}</div>
                <div class="due-sub">{{ lastContactText(c) }}</div>
              </div>
            </td>
            <td class="col-actions">
              <RouterLink
                :to="`/customers/${c.id}`"
                class="btn btn-ghost sm"
                @click.stop
              >
                View
                <AppIcon name="arrow-right" :size="12" />
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="cust-cards">
      <div v-if="!paginatedCustomers.length" class="cust-empty cust-cards__empty">
        {{ emptyMessage }}
      </div>
      <div
        v-for="c in paginatedCustomers"
        :key="c.id"
        class="cust-card"
        @click="goToCustomer(c)"
      >
        <div class="cust-card__head">
          <div class="cust-avatar lg" :data-tone="avatarTone(c)">{{ initials(c.name) }}</div>
          <div class="cust-card__head-meta">
            <div class="nm-row">
              <span class="nm">{{ c.name || 'Unnamed' }}</span>
              <span class="pill" :class="categoryToneClass(c.category)">
                <span class="dot"></span>{{ c.category }}
              </span>
            </div>
            <div class="em">{{ c.email || '—' }}</div>
          </div>
        </div>
        <div class="cust-card__grid">
          <div class="kv">
            <span class="k">Phone</span>
            <span class="v">{{ c.phone || '—' }}</span>
            <span class="v-sub">Prefers {{ c.channel }}</span>
          </div>
          <div class="kv">
            <span class="k">Follow-up</span>
            <span class="v" :data-tone="dueTone(c)">{{ dueText(c) }}</span>
            <span v-if="lastContactText(c) !== '—'" class="v-sub">{{ lastContactText(c) }}</span>
          </div>
        </div>
        <div class="cust-card__actions">
          <RouterLink
            :to="`/customers/${c.id}`"
            class="btn btn-primary sm"
            @click.stop
          >
            View profile
            <AppIcon name="arrow-right" :size="13" />
          </RouterLink>
        </div>
      </div>
    </div>

    <BasePaginationFooter
      v-if="filteredCustomers.length"
      v-model="currentPage"
      :length="pageCount"
      :total-visible="4"
      :label="rangeLabel"
    />

    <AddCustomerDialog
      v-model="showAddCustomer"
      @add="handleAddCustomer"
    />

    <CustomerFilterDialog
      v-model="showFilterDialog"
      :criteria="filterCriteria"
      @apply="handleFilterApply"
      @clear="handleFilterClear"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCustomerStore } from '../stores/customerStore'
import AddCustomerDialog from '../components/customer/AddCustomerDialog.vue'
import BasePaginationFooter from '../components/base/BasePaginationFooter.vue'
import CustomersToolbar from '../components/customer/CustomersToolbar.vue'
import AppIcon from '../components/base/AppIcon.vue'
import { customerFilterDefinitions as filterDefinitions } from '../config/filterDefinitions'
import { useCustomerFilters } from '../composables/useCustomerFilters'
import { useResponsivePageSize } from '../composables/useResponsivePageSize'
import CustomerFilterDialog from '../components/customer/CustomerFilterDialog.vue'
import { useFilterChips } from '../composables/useFilterChips'
import { daysUntilContact, isOverdue } from '../utils/followUp'
import { useRouter } from 'vue-router'

const router = useRouter()
const store = useCustomerStore()
const customers = computed(() => store.customers)

const SORT_OPTIONS = [
  { value: 'last-contact', label: 'Last contact' },
  { value: 'overdue',      label: 'Overdue first' },
  { value: 'status',       label: 'Status' },
  { value: 'name',         label: 'Name (A–Z)' },
]
const STATUS_RANK = { Hot: 0, Warm: 1, Cold: 2 }
const AVATAR_TONES = ['accent', 'warm', 'hot', 'cold']

const showAddCustomer = ref(false)
const showFilterDialog = ref(false)
const { pageSize: itemsPerPage } = useResponsivePageSize({
  breakpoints: [
    { minWidth: 1100, size: 12 },
    { minWidth: 720,  size: 8 },
    { minWidth: 0,    size: 6 },
  ],
  fallbackSize: 8,
})
const searchQuery = ref('')
const sortOption = ref('last-contact')
const quickCategory = ref('All')
const activeFilters = ref([])
const { toolbarFilters } = useFilterChips({ manualFilters: activeFilters })

const filterPredicates = {
  category: (customer, filter) => {
    const currentValue = (customer.category || '').toLowerCase()
    const targetValue = String(filter?.value ?? '').toLowerCase()
    if (!targetValue) return true
    return filter?.operator === 'is_not'
      ? currentValue !== targetValue
      : currentValue === targetValue
  },
  channel: (customer, filter) => {
    const currentValue = (customer.channel || '').toLowerCase()
    const targetValue = String(filter?.value ?? '').toLowerCase()
    if (!targetValue) return true
    return filter?.operator === 'is_not'
      ? currentValue !== targetValue
      : currentValue === targetValue
  },
  __quickCategory: (customer, filter) => {
    if (!filter?.value || filter.value === 'All') return true
    return (customer.category || '').toLowerCase() === String(filter.value).toLowerCase()
  },
  __overdueOnly: (customer, filter) => {
    if (!filter?.value) return true
    return isOverdue(customer)
  },
}

const sortedCustomers = computed(() => sortCustomers(customers.value, sortOption.value))

const effectiveFilters = computed(() => {
  const list = [...activeFilters.value]
  if (quickCategory.value && quickCategory.value !== 'All') {
    list.unshift({
      id: '__quick-category',
      key: '__quickCategory',
      operator: 'is',
      value: quickCategory.value,
    })
  }
  return list
})

const {
  currentPage,
  pageCount,
  paginatedCustomers,
  filteredCustomers,
  rangeLabel,
  isFilteredView,
} = useCustomerFilters({
  customers: sortedCustomers,
  searchQuery,
  activeFilters: effectiveFilters,
  filterPredicates,
  itemsPerPage,
})

const overdueCount = computed(() => {
  const today = new Date()
  return customers.value.filter((c) => isOverdue(c, today)).length
})

const supportingText = computed(() => {
  const n = customers.value.length
  return `${n} contact${n === 1 ? '' : 's'} in your pipeline`
})

const emptyMessage = computed(() => {
  if (!customers.value.length) return 'No customers yet. Click "Add new customer" to get started.'
  if (isFilteredView.value) return 'No customers match your current filters.'
  return 'No customers to show.'
})

function openAddCustomer() {
  showAddCustomer.value = true
}

async function handleAddCustomer(payload) {
  try {
    await store.addCustomer(payload)
    showAddCustomer.value = false
  } catch (e) {
    alert(`Failed to add customer: ${e.message}`)
  }
}

function goToCustomer(c) {
  router.push(`/customers/${c.id}`)
}

// Sorting
function sortCustomers(list, mode) {
  const arr = [...list]
  const today = new Date()
  switch (mode) {
    case 'name':
      arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      break
    case 'status':
      arr.sort((a, b) => (STATUS_RANK[a.category] ?? 9) - (STATUS_RANK[b.category] ?? 9))
      break
    case 'overdue':
      arr.sort((a, b) => {
        const da = daysUntilContact(a, today)
        const db = daysUntilContact(b, today)
        const va = da === null ? Number.POSITIVE_INFINITY : da
        const vb = db === null ? Number.POSITIVE_INFINITY : db
        return va - vb
      })
      break
    case 'last-contact':
    default:
      arr.sort((a, b) => {
        const ta = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : -Infinity
        const tb = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : -Infinity
        return tb - ta
      })
      break
  }
  return arr
}

// Display helpers
function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const out = parts.map((p) => p[0]).join('').toUpperCase()
  return out || '?'
}

function avatarTone(c) {
  const s = c.name || c.id || ''
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length]
}

function categoryToneClass(cat) {
  if (cat === 'Hot') return 'hot'
  if (cat === 'Warm') return 'warm'
  return 'cold'
}

function channelIcon(ch) {
  if (ch === 'Email') return 'mail'
  if (ch === 'SMS' || ch === 'Telegram') return 'chat'
  return 'phone'
}

function dueText(c) {
  const d = daysUntilContact(c)
  if (d === null) return 'Not scheduled'
  if (d < 0) return `${Math.abs(d)}d overdue`
  if (d === 0) return 'Due today'
  if (d === 1) return 'Tomorrow'
  return `In ${d} days`
}

function dueTone(c) {
  const d = daysUntilContact(c)
  if (d === null) return 'muted'
  if (d < 0) return 'overdue'
  if (d === 0) return 'today'
  return 'ok'
}

function lastContactText(c) {
  if (!c.lastContactedAt) return '—'
  const formatted = new Date(c.lastContactedAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `Last: ${formatted}`
}

// Filter dialog wiring (unchanged from prior implementation)
const filterDefinitionMap = computed(() => {
  return filterDefinitions.reduce((map, definition) => {
    map[definition.key] = definition
    return map
  }, {})
})

const filterCriteria = computed(() => {
  const categoryFilters = activeFilters.value.filter((filter) => filter.key === 'category')
  const channelFilters = activeFilters.value.filter((filter) => filter.key === 'channel')
  const overdueOnly = activeFilters.value.some((filter) => filter.key === '__overdueOnly')
  return {
    categories: categoryFilters.map((filter) => filter.value),
    channels: channelFilters.map((filter) => filter.value),
    overdueOnly,
  }
})

function openFilterDialog() {
  showFilterDialog.value = true
}

function buildFilterFromValue(key, value) {
  const definition = filterDefinitionMap.value[key]
  if (!definition || !value) return null

  const operatorValue = definition.operators?.[0]?.value ?? 'is'
  const operatorLabel =
    definition.operators?.find((op) => op.value === operatorValue)?.label ?? operatorValue
  const optionLabel = definition.options?.find((option) => option.value === value)?.title ?? value

  return {
    id: `${key}-${operatorValue}-${value}-${Date.now()}`,
    key,
    operator: operatorValue,
    value,
    label: `${definition.label} ${operatorLabel} ${optionLabel}`,
    labelParts: {
      field: definition.label,
      operator: operatorLabel,
      value: optionLabel,
    },
  }
}

function handleFilterApply(criteria) {
  const nextFilters = []

  const categoryValues = Array.isArray(criteria?.categories) ? criteria.categories : []
  const uniqueCategories = [...new Set(categoryValues.filter(Boolean))]
  uniqueCategories.forEach((categoryValue) => {
    const built = buildFilterFromValue('category', categoryValue)
    if (built) nextFilters.push(built)
  })

  const channelValues = Array.isArray(criteria?.channels) ? criteria.channels : []
  const uniqueChannels = [...new Set(channelValues.filter(Boolean))]
  uniqueChannels.forEach((channelValue) => {
    const built = buildFilterFromValue('channel', channelValue)
    if (built) nextFilters.push(built)
  })

  if (criteria?.overdueOnly) {
    nextFilters.push({
      id: '__overdue-only',
      key: '__overdueOnly',
      operator: 'is',
      value: true,
      label: 'Overdue only',
      labelParts: { field: 'Status', operator: 'is', value: 'Overdue only' },
    })
  }

  activeFilters.value = nextFilters
  showFilterDialog.value = false
}

function handleFilterClear() {
  activeFilters.value = []
}
</script>

<style scoped>
.customers {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px 28px 40px;
}

/* ── Overdue banner ─────────────────────────────────── */
.cust-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid color-mix(in oklch, var(--hot) 30%, transparent);
  background: var(--hot-soft);
  color: var(--hot-ink);
  border-radius: var(--r-lg);
}
.cust-banner__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--hot) 22%, transparent);
  color: var(--hot);
  flex-shrink: 0;
}
.cust-banner__body { flex: 1; font-size: 13.5px; line-height: 1.45; color: var(--hot-ink); }
.cust-banner__body strong { font-weight: 600; }
.cust-banner__action { flex-shrink: 0; }

/* ── Table wrapper ──────────────────────────────────── */
.cust-table-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.cust-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.cust-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-faint);
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
  white-space: nowrap;
}
.cust-table td {
  padding: 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  font-size: 13.5px;
  color: var(--text);
}
.cust-table tbody tr:last-child td { border-bottom: none; }
.cust-row { cursor: pointer; transition: background-color .12s; }
.cust-row:hover { background: var(--surface-2); }

/* Fixed column widths so spacing is uniform regardless of content length.
   Trying equal 20/20/20/20/20 split for visual balance. */
.cust-table .col-customer { width: 35%; }
.cust-table .col-channel  { width: 20%; }
.cust-table .col-status   { width: 20%; white-space: nowrap; }
.cust-table .col-followup { width: 20%; }
.cust-table .col-actions  { width: 10%; text-align: right; white-space: nowrap; }

/* ── Customer cell (avatar + name + email) ─────────── */
.cust-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.cust-name-cell__meta { min-width: 0; }
.cust-name-cell__meta .nm {
  font-weight: 550;
  color: var(--text);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cust-name-cell__meta .em {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Avatar ─────────────────────────────────────────── */
.cust-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  background: var(--surface-sunk);
  color: var(--text);
  user-select: none;
}
.cust-avatar.lg { width: 44px; height: 44px; font-size: 14px; }
.cust-avatar[data-tone='accent'] { background: color-mix(in oklch, var(--accent) 18%, var(--surface)); color: var(--accent-ink, var(--accent)); }
.cust-avatar[data-tone='warm']   { background: color-mix(in oklch, var(--warm)   18%, var(--surface)); color: var(--warm); }
.cust-avatar[data-tone='hot']    { background: color-mix(in oklch, var(--hot)    18%, var(--surface)); color: var(--hot); }
.cust-avatar[data-tone='cold']   { background: color-mix(in oklch, var(--cold)   18%, var(--surface)); color: var(--cold); }

/* ── Phone / channel cell ──────────────────────────── */
.phone-cell .num {
  font-feature-settings: 'tnum';
  color: var(--text);
  font-size: 13.5px;
}
.phone-cell .ch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Status pill uses the global .pill from tokens.css (.pill.hot/.warm/.cold + .dot) */

/* ── Last contact / follow-up cell ─────────────────── */
.due-cell .due-main {
  font-size: 13.5px;
  font-weight: 550;
  color: var(--text);
}
.due-cell .due-sub {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 2px;
}
.due-main[data-tone='overdue'] { color: var(--hot); }
.due-main[data-tone='today']   { color: var(--accent); }
.due-main[data-tone='muted']   { color: var(--text-muted); font-weight: 500; }

/* ── Empty state ───────────────────────────────────── */
.cust-empty {
  text-align: center;
  padding: 56px 24px;
  color: var(--text-muted);
  font-size: 13.5px;
}

/* ── Mobile cards (default hidden, shown < 720px) ──── */
.cust-cards { display: none; flex-direction: column; gap: 12px; }
.cust-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: border-color .12s;
}
.cust-card:hover { border-color: var(--border-strong); }
.cust-card__head { display: flex; align-items: center; gap: 12px; }
.cust-card__head-meta { min-width: 0; flex: 1; }
.cust-card__head-meta .nm-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.cust-card__head-meta .nm {
  font-weight: 600;
  color: var(--text);
  font-size: 15px;
}
.cust-card__head-meta .em {
  font-size: 12.5px;
  color: var(--text-muted);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cust-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}
.cust-card__grid .kv { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cust-card__grid .k {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}
.cust-card__grid .v {
  font-size: 13px;
  color: var(--text);
}
.cust-card__grid .v-sub {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 1px;
}
.cust-card__grid .v[data-tone='overdue'] { color: var(--hot); font-weight: 600; }
.cust-card__grid .v[data-tone='today']   { color: var(--accent); font-weight: 600; }
.cust-card__grid .v[data-tone='muted']   { color: var(--text-muted); }
.cust-card__actions { display: flex; gap: 8px; }
.cust-card__actions .btn { flex: 1; justify-content: center; }
.cust-cards__empty {
  padding: 32px 18px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--r-lg);
}

/* ── Breakpoints ───────────────────────────────────── */
@media (max-width: 1100px) {
  .customers { padding: 20px 20px 32px; }
  .cust-table .col-followup .due-sub { display: none; }
}
@media (max-width: 900px) {
  .cust-table th, .cust-table td { padding: 12px 10px; }
}
@media (max-width: 720px) {
  .customers { padding: 14px 12px 24px; }
  .cust-table-wrap { display: none; }
  .cust-cards { display: flex; }
}
</style>
