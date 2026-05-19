<template>
  <div class="interests-panel">
    <div v-if="loading" class="interests-loading">
      <v-progress-circular indeterminate color="primary" size="24" />
    </div>

    <div v-else class="interests-grid">
      <div v-for="level in LEVELS" :key="level">
        <div
            class="kanban-column"
            :class="[`kanban-column--${level.toLowerCase()}`, { 'kanban-column--over': dragOverColumn === level }]"
            @dragover.prevent="dragOverColumn = level"
            @dragleave="onColumnLeave(level)"
            @drop.prevent="onDrop(level)"
          >
            <header class="kanban-header">
              <span class="kanban-title">
                <span class="kanban-dot" :class="`kanban-dot--${level.toLowerCase()}`" />
                {{ level }}
                <span class="kanban-count">{{ countFor(level) }}</span>
              </span>
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-plus"
                @click="openAddDialog(level)"
              />
            </header>

            <div class="kanban-body">
              <div
                v-for="item in itemsFor(level)"
                :key="item.id"
                class="kanban-card"
                :class="{ 'kanban-card--dragging': dragFrom?.customerId === item.customerId }"
                draggable="true"
                @dragstart="onDragStart(item)"
                @dragend="onDragEnd"
                @click="router.push({ name: 'customer-details', params: { id: item.customerId } })"
              >
                <div class="kanban-card-main">
                  <p class="kanban-card-name">{{ item.customerName }}</p>
                  <p class="kanban-card-contact">{{ item.customerPhone || item.customerEmail || '—' }}</p>
                  <p class="kanban-card-meta">Lead: {{ item.customerCategory }}</p>
                </div>
                <v-btn
                  icon="mdi-close"
                  size="x-small"
                  variant="text"
                  color="grey"
                  :loading="removing === item.id"
                  @click.stop="remove(item)"
                />
              </div>

              <p v-if="!itemsFor(level).length" class="kanban-empty">
                No {{ level.toLowerCase() }} customers.
              </p>
            </div>
          </div>
        </div>
      </div>
    <!-- Add customer dialog -->
    <v-dialog v-model="dialog" max-width="460" scrollable @update:model-value="onDialogToggle">
      <div class="add-customer modal-card">
        <header class="modal-head">
          <span class="ico"><AppIcon name="users" :size="18" /></span>
          <div class="modal-head__text">
            <h2>Link a customer</h2>
            <div class="sub">Add an interested customer to this property</div>
          </div>
          <button class="close" aria-label="Close" @click="closeDialog">
            <AppIcon name="x" :size="16" />
          </button>
        </header>

        <div class="modal-body">
          <!-- Customer picker -->
          <div class="field">
            <label for="ac-search">Customer</label>
            <div class="customer-picker">
              <div class="input-affix">
                <span class="prefix"><AppIcon name="search" :size="14" /></span>
                <input
                  id="ac-search"
                  v-model="customerSearch"
                  class="input has-prefix"
                  type="text"
                  :placeholder="selectedCustomer ? selectedCustomer.name : 'Search by name, phone or email'"
                  autocomplete="off"
                  maxlength="200"
                />
              </div>
              <div v-if="filteredCustomers.length" class="customer-list">
                <button
                  v-for="c in filteredCustomers"
                  :key="c.id"
                  type="button"
                  class="customer-option"
                  :class="{ selected: selectedCustomer?.id === c.id }"
                  @click="pickCustomer(c)"
                >
                  <div class="customer-avatar">{{ initialsOf(c.name) }}</div>
                  <div class="customer-info">
                    <div class="customer-name">{{ c.name }}</div>
                    <div class="customer-meta">
                      {{ c.phone || c.email || '—' }}
                      <span v-if="c.category" class="customer-cat" :data-tone="c.category.toLowerCase()">
                        {{ c.category }}
                      </span>
                    </div>
                  </div>
                  <AppIcon
                    v-if="selectedCustomer?.id === c.id"
                    name="check"
                    :size="14"
                    class="customer-check"
                  />
                </button>
              </div>
              <div v-else class="customer-empty">
                {{ availableCustomers.length === 0
                  ? 'All customers are already linked to this property.'
                  : 'No matches.' }}
              </div>
            </div>
          </div>

          <!-- Interest level -->
          <div class="field">
            <label for="ac-level">Interest level</label>
            <div class="level-chips">
              <button
                v-for="level in LEVELS"
                :key="level"
                type="button"
                class="level-chip"
                :data-tone="level.toLowerCase()"
                :aria-pressed="selectedLevel === level"
                @click="selectedLevel = level"
              >
                <span class="dot" />{{ level }}
              </button>
            </div>
          </div>
        </div>

        <div class="modal-foot">
          <button class="btn btn-ghost" :disabled="adding" @click="closeDialog">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="!selectedCustomer || adding"
            @click="addCustomer"
          >
            <AppIcon name="plus" :size="13" />
            {{ adding ? 'Linking…' : 'Link customer' }}
          </button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePropertyStore } from '../../stores/propertyStore'
import { useCustomerStore } from '../../stores/customerStore'
import AppIcon from '../base/AppIcon.vue'

const props = defineProps({ propertyId: { type: String, required: true } })

const router = useRouter()
const propertyStore = usePropertyStore()
const customerStore = useCustomerStore()

const LEVELS = ['Hot', 'Warm', 'Cold']

const loading = ref(false)
const adding = ref(false)
const removing = ref(null)

const dialog = ref(false)
const selectedCustomer = ref(null)
const selectedLevel = ref('Warm')
const customerSearch = ref('')

const dragFrom = ref(null)
const dragOverColumn = ref(null)

const interests = computed(() => propertyStore.interests[props.propertyId] ?? [])

const availableCustomers = computed(() => {
  const linked = new Set(interests.value.map((i) => i.customerId))
  return customerStore.customers.filter((c) => !linked.has(c.id))
})

const filteredCustomers = computed(() => {
  const q = customerSearch.value.trim().toLowerCase()
  const pool = availableCustomers.value
  if (!q) return pool.slice(0, 20) // show first 20 by default
  return pool.filter((c) => {
    const hay = [c.name, c.phone, c.email].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(q)
  }).slice(0, 20)
})

function initialsOf(name) {
  if (!name) return '?'
  return name.split(' ').map((p) => p[0] ?? '').join('').toUpperCase().slice(0, 2)
}
function pickCustomer(c) {
  selectedCustomer.value = c
  customerSearch.value = ''
}
function onDialogToggle(open) {
  if (!open) closeDialog()
}

function itemsFor(level) {
  return interests.value.filter((i) => i.interestLevel === level)
}

function countFor(level) {
  return itemsFor(level).length
}

onMounted(async () => {
  loading.value = true
  try {
    await propertyStore.fetchInterests(props.propertyId)
    if (!customerStore.loaded) await customerStore.fetchCustomers()
  } finally {
    loading.value = false
  }
})

function openAddDialog(level) {
  selectedLevel.value = level
  dialog.value = true
}

async function addCustomer() {
  if (!selectedCustomer.value) return
  adding.value = true
  try {
    await propertyStore.addInterestedCustomer(props.propertyId, selectedCustomer.value.id, selectedLevel.value)
    closeDialog()
  } finally {
    adding.value = false
  }
}

function closeDialog() {
  dialog.value = false
  selectedCustomer.value = null
  selectedLevel.value = 'Warm'
  customerSearch.value = ''
}

function onDragStart(item) {
  dragFrom.value = { customerId: item.customerId, fromLevel: item.interestLevel }
}

function onDragEnd() {
  dragFrom.value = null
  dragOverColumn.value = null
}

function onColumnLeave(level) {
  if (dragOverColumn.value === level) dragOverColumn.value = null
}

async function onDrop(targetLevel) {
  const moving = dragFrom.value
  dragOverColumn.value = null
  dragFrom.value = null
  if (!moving || moving.fromLevel === targetLevel) return
  await propertyStore.updateInterestLevel(props.propertyId, moving.customerId, targetLevel)
}

async function remove(item) {
  removing.value = item.id
  try {
    await propertyStore.removeInterestedCustomer(props.propertyId, item.customerId)
  } finally {
    removing.value = null
  }
}
</script>

<style scoped>
.interests-loading { display: flex; justify-content: center; padding: 24px 0; }
.interests-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

@media (max-width: 720px) {
  .interests-grid { grid-template-columns: 1fr; }
}

/* ── Add Customer dialog ───────────────────────────────────── */
/* Modal-card chrome (head/body/foot) comes from styles/components/modals.css.
   Below: dialog-specific styles only (customer picker + interest chips). */

/* Customer picker */
.customer-picker { display: flex; flex-direction: column; gap: 8px; }
.customer-list {
  display: flex; flex-direction: column; gap: 4px;
  max-height: 260px; overflow-y: auto;
  padding-right: 2px;
}
.customer-option {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  text-align: left;
  cursor: pointer;
  transition: border-color .12s, background .12s, transform .08s;
}
.customer-option:hover { border-color: var(--border-strong); background: var(--surface-sunk); }
.customer-option.selected {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.customer-avatar {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: var(--accent); color: var(--text-on-accent);
  display: grid; place-items: center;
  font-size: 12px; font-weight: 700;
  flex-shrink: 0;
}
.customer-info { flex: 1; min-width: 0; }
.customer-name {
  font-size: 13.5px; font-weight: 600; color: var(--text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.customer-meta {
  display: flex; align-items: center; gap: 8px;
  margin-top: 2px;
  font-size: 12px; color: var(--text-muted);
}
.customer-cat {
  display: inline-flex; align-items: center;
  padding: 1px 7px; border-radius: 999px;
  font-size: 10.5px; font-weight: 700;
  letter-spacing: 0.02em; text-transform: uppercase;
  background: var(--surface); border: 1px solid var(--border);
}
.customer-cat[data-tone="hot"]  { color: var(--hot-ink);  border-color: color-mix(in oklch, var(--hot) 35%, transparent); }
.customer-cat[data-tone="warm"] { color: var(--warm-ink); border-color: color-mix(in oklch, var(--warm) 35%, transparent); }
.customer-cat[data-tone="cold"] { color: var(--cold-ink); border-color: color-mix(in oklch, var(--cold) 35%, transparent); }
.customer-check { color: var(--accent); flex-shrink: 0; }
.customer-empty {
  font-size: 12.5px; color: var(--text-faint);
  font-style: italic;
  padding: 10px 4px;
}

/* Interest level chips */
.level-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.level-chip {
  flex: 1; min-width: 0;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-size: 13.5px; font-weight: 600;
  color: var(--text);
  cursor: pointer;
  transition: border-color .12s, background .12s;
}
.level-chip:hover { border-color: var(--border-strong); }
.level-chip .dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.level-chip[data-tone="hot"]  .dot { background: var(--hot); }
.level-chip[data-tone="warm"] .dot { background: var(--warm); }
.level-chip[data-tone="cold"] .dot { background: var(--cold); }
.level-chip[aria-pressed="true"] {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.kanban-column {
  background: var(--surface-2);
  border-radius: 12px;
  border: 1px solid var(--border);
  padding: 10px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: outline 0.15s ease, background 0.15s ease;
  outline: 2px solid transparent;
}

.kanban-column--over {
  outline: 2px dashed var(--accent);
  background: color-mix(in oklch, var(--accent) 8%, transparent);
}

.kanban-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 0;
}

.kanban-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13.5px;
  color: var(--text);
}

.kanban-count {
  font-weight: 500;
  font-size: 12px;
  color: var(--text-faint);
}

.kanban-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.kanban-dot--hot  { background: var(--hot); }
.kanban-dot--warm { background: var(--warm); }
.kanban-dot--cold { background: var(--cold); }

.kanban-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kanban-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  cursor: grab;
  transition: border-color .12s, box-shadow .12s, transform .05s, opacity .15s;
}

.kanban-card:active { cursor: grabbing; }

.kanban-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.kanban-card--dragging { opacity: 0.4; }

.kanban-card-main {
  flex: 1;
  min-width: 0;
}

.kanban-card-name {
  margin: 0;
  font-weight: 600;
  font-size: 13.5px;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kanban-card-contact {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kanban-card-meta {
  margin: 4px 0 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-faint);
}

.kanban-empty {
  margin: 6px;
  font-size: 12.5px;
  color: var(--text-faint);
  font-style: italic;
  padding: 24px 8px;
  text-align: center;
}
</style>
