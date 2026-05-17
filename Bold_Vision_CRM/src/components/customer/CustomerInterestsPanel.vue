<template>
  <div class="cd-int-panel">
    <div v-if="loading" class="cd-int-loading">Loading interested properties…</div>

    <div v-else class="cd-int-grid">
      <div
        v-for="level in LEVELS"
        :key="level"
        class="cd-int-column"
        :class="{ 'is-dragover': dragOverColumn === level }"
        @dragover.prevent="dragOverColumn = level"
        @dragleave="onColumnLeave(level)"
        @drop.prevent="onDrop(level)"
      >
        <header class="cd-int-column__head">
          <span class="cd-int-column__title">
            <span class="dot" :data-tone="level.toLowerCase()"></span>
            {{ level }}
            <span class="cd-int-column__count">{{ countFor(level) }}</span>
          </span>
          <button class="cd-int-column__add" aria-label="Add property" @click="openAddDialog(level)">
            <AppIcon name="plus" :size="13" />
          </button>
        </header>

        <div class="cd-int-column__body">
          <article
            v-for="item in itemsFor(level)"
            :key="item.id"
            class="cd-int-card"
            :class="{ 'is-dragging': dragFrom?.propertyId === item.propertyId }"
            draggable="true"
            @dragstart="onDragStart(item)"
            @dragend="onDragEnd"
            @click="router.push(`/properties/${item.propertyId}`)"
          >
            <div class="cd-int-card__thumb">
              <PropCardPhoto
                :storage-path="propertyOf(item)?.mainPhoto || null"
                :alt="item.propertyAddress"
              />
            </div>
            <div class="cd-int-card__body">
              <div class="cd-int-card__head-row">
                <span class="cd-int-card__addr">{{ item.propertyAddress }}</span>
                <span v-if="priceLabel(item)" class="cd-int-card__price">{{ priceLabel(item) }}</span>
              </div>
              <div v-if="locationLine(item)" class="cd-int-card__sub">{{ locationLine(item) }}</div>
              <div v-if="specLine(item)" class="cd-int-card__specs">{{ specLine(item) }}</div>
              <div class="cd-int-card__foot">
                <span
                  v-if="item.propertyStatus"
                  class="status-badge"
                  :class="statusClass(item.propertyStatus)"
                >
                  <span class="dot"></span>{{ item.propertyStatus }}
                </span>
                <button
                  class="cd-int-card__remove"
                  aria-label="Remove from interests"
                  :disabled="removing === item.id"
                  @click.stop="remove(item)"
                >
                  <AppIcon name="x" :size="11" />
                </button>
              </div>
            </div>
          </article>

          <div v-if="!itemsFor(level).length" class="cd-int-empty">
            No {{ level.toLowerCase() }} properties.
          </div>
        </div>
      </div>
    </div>

    <!-- Add property dialog -->
    <v-dialog v-model="dialog" :max-width="520" :scrim="'rgba(15,23,42,0.65)'" @update:model-value="onDialogToggle">
      <div class="modal-card">
        <header class="modal-head">
          <span class="ico"><AppIcon name="house" :size="18" /></span>
          <div class="modal-head__text">
            <h2>Match a property</h2>
            <div class="sub">Link a property to this customer's interest list</div>
          </div>
          <button class="close" aria-label="Close" @click="closeDialog">
            <AppIcon name="x" :size="16" />
          </button>
        </header>

        <div class="modal-body">
          <div class="field">
            <label for="ap-search">Property</label>
            <div class="cd-int-picker">
              <div class="input-affix">
                <span class="prefix"><AppIcon name="search" :size="14" /></span>
                <input
                  id="ap-search"
                  v-model="propertySearch"
                  class="input has-prefix"
                  type="text"
                  :placeholder="selectedProperty ? selectedProperty.address : 'Search by address or suburb'"
                  autocomplete="off"
                />
              </div>
              <div v-if="filteredProperties.length" class="cd-int-picker__list">
                <button
                  v-for="p in filteredProperties"
                  :key="p.id"
                  type="button"
                  class="cd-int-picker__option"
                  :class="{ selected: selectedProperty?.id === p.id }"
                  @click="pickProperty(p)"
                >
                  <div class="cd-int-picker__thumb">
                    <PropCardPhoto :storage-path="p.mainPhoto || null" :alt="p.address" />
                  </div>
                  <div class="cd-int-picker__info">
                    <div class="cd-int-picker__addr">{{ p.address }}</div>
                    <div class="cd-int-picker__meta">
                      {{ p.suburb }}<template v-if="p.state || p.postcode">, {{ p.state }} {{ p.postcode }}</template>
                      <span class="cd-int-picker__type">· {{ p.type }}</span>
                    </div>
                  </div>
                  <AppIcon
                    v-if="selectedProperty?.id === p.id"
                    name="check"
                    :size="14"
                    class="cd-int-picker__check"
                  />
                </button>
              </div>
              <div v-else class="cd-int-picker__empty">
                {{ availableProperties.length === 0
                  ? 'All properties are already in this customer\'s interest list.'
                  : 'No matches.' }}
              </div>
            </div>
          </div>

          <div class="field">
            <label>Interest level</label>
            <div class="cd-int-levels">
              <button
                v-for="level in LEVELS"
                :key="level"
                type="button"
                class="cd-int-level"
                :data-tone="level.toLowerCase()"
                :aria-pressed="selectedLevel === level"
                @click="selectedLevel = level"
              >
                <span class="dot"></span>{{ level }}
              </button>
            </div>
          </div>
        </div>

        <div class="modal-foot">
          <button class="btn btn-ghost" :disabled="adding" @click="closeDialog">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="!selectedProperty || adding"
            @click="addProperty"
          >
            <AppIcon name="plus" :size="14" />
            {{ adding ? 'Adding…' : 'Match property' }}
          </button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomerStore } from '../../stores/customerStore'
import { usePropertyStore } from '../../stores/propertyStore'
import AppIcon from '../base/AppIcon.vue'
import PropCardPhoto from '../base/PropCardPhoto.vue'

const props = defineProps({ customerId: { type: String, required: true } })

const router = useRouter()
const customerStore = useCustomerStore()
const propertyStore = usePropertyStore()

const LEVELS = ['Hot', 'Warm', 'Cold']

const loading = ref(false)
const adding = ref(false)
const removing = ref(null)

const dialog = ref(false)
const selectedProperty = ref(null)
const selectedLevel = ref('Warm')
const propertySearch = ref('')

const dragFrom = ref(null)
const dragOverColumn = ref(null)

const interests = computed(() => customerStore.propertyInterests[props.customerId] ?? [])

function propertyOf(item) {
  return propertyStore.properties.find((p) => p.id === item.propertyId) ?? null
}

const availableProperties = computed(() => {
  const linked = new Set(interests.value.map((i) => i.propertyId))
  return propertyStore.properties.filter((p) => !linked.has(p.id))
})

const filteredProperties = computed(() => {
  const q = propertySearch.value.trim().toLowerCase()
  let list = availableProperties.value
  if (q) {
    list = list.filter(
      (p) =>
        (p.address || '').toLowerCase().includes(q) ||
        (p.suburb || '').toLowerCase().includes(q) ||
        (p.postcode || '').toLowerCase().includes(q),
    )
  }
  return list.slice(0, 20)
})

function itemsFor(level) {
  return interests.value.filter((i) => i.interestLevel === level)
}
function countFor(level) {
  return itemsFor(level).length
}

onMounted(async () => {
  loading.value = true
  try {
    await customerStore.fetchPropertyInterests(props.customerId)
    if (!propertyStore.loaded) await propertyStore.fetchProperties()
  } finally {
    loading.value = false
  }
})

function openAddDialog(level) {
  if (level) selectedLevel.value = level
  dialog.value = true
}

function closeDialog() {
  dialog.value = false
  selectedProperty.value = null
  propertySearch.value = ''
  selectedLevel.value = 'Warm'
}

function onDialogToggle(open) {
  if (!open) closeDialog()
}

function pickProperty(p) {
  selectedProperty.value = p
  propertySearch.value = ''
}

async function addProperty() {
  if (!selectedProperty.value) return
  adding.value = true
  try {
    await customerStore.addPropertyInterest(
      props.customerId,
      selectedProperty.value.id,
      selectedLevel.value,
    )
    closeDialog()
  } catch (e) {
    alert(`Failed to link property: ${e.message}`)
  } finally {
    adding.value = false
  }
}

function onDragStart(item) {
  dragFrom.value = { propertyId: item.propertyId, fromLevel: item.interestLevel }
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
  await customerStore.addPropertyInterest(props.customerId, moving.propertyId, targetLevel)
}

async function remove(item) {
  removing.value = item.id
  try {
    await customerStore.removePropertyInterest(props.customerId, item.propertyId)
  } catch (e) {
    alert(`Failed to remove: ${e.message}`)
  } finally {
    removing.value = null
  }
}

// ── Card display helpers ──────────────────────────────────────────────────

function fmtPrice(n) {
  if (!n) return ''
  if (n >= 1_000_000) {
    const m = (n / 1_000_000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
    return `$${m}M`
  }
  return `$${Math.round(n).toLocaleString('en-AU')}`
}

function priceLabel(item) {
  const p = propertyOf(item)
  if (p?.priceMin && p?.priceMax && p.priceMin !== p.priceMax) {
    return `${fmtPrice(p.priceMin)} – ${fmtPrice(p.priceMax)}`
  }
  if (p?.priceMin) return fmtPrice(p.priceMin)
  return item.propertyPriceGuide || ''
}

function locationLine(item) {
  const p = propertyOf(item)
  const suburb = p?.suburb || item.propertySuburb || ''
  const state = p?.state || ''
  const postcode = p?.postcode || ''
  const tail = [state, postcode].filter(Boolean).join(' ')
  if (suburb && tail) return `${suburb}, ${tail}`
  return suburb || tail || ''
}

function specLine(item) {
  const p = propertyOf(item)
  const type = p?.type || item.propertyType
  if (!p) return type ? type : ''
  const parts = [type]
  if (p.bedrooms) parts.push(`${p.bedrooms} bed`)
  if (p.bathrooms) parts.push(`${p.bathrooms} bath`)
  if (p.carSpaces) parts.push(`${p.carSpaces} car`)
  return parts.filter(Boolean).join(' · ')
}

function statusClass(status) {
  if (!status) return ''
  return status.toLowerCase().replace(/\s+/g, '-')
}

defineExpose({ openAdd: openAddDialog })
</script>

<style scoped>
.cd-int-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cd-int-loading {
  padding: 32px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

/* ── Grid + columns ─────────────────────────────────── */
.cd-int-grid {
  display: grid;
  /* auto-fit so the kanban drops from 3 → 2 → 1 column when the container
     narrows (e.g. CustomerDetailView's left main area on a half-screen
     desktop window). Empty auto-fit tracks collapse, so 3 categories still
     render as 3 columns when there's room. */
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}
.cd-int-column {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 160px;
  transition: border-color .15s, background .15s;
}
.cd-int-column.is-dragover {
  border-color: var(--accent);
  background: color-mix(in oklch, var(--accent) 8%, var(--surface-2));
}
.cd-int-column__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 4px 0;
}
.cd-int-column__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
.cd-int-column__title .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cd-int-column__title .dot[data-tone='hot']  { background: var(--hot); }
.cd-int-column__title .dot[data-tone='warm'] { background: var(--warm); }
.cd-int-column__title .dot[data-tone='cold'] { background: var(--cold); }
.cd-int-column__count {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-faint);
}
.cd-int-column__add {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: var(--r-sm, 6px);
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  cursor: pointer;
  transition: background .12s, color .12s, border-color .12s;
}
.cd-int-column__add:hover {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border-strong);
}
.cd-int-column__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Card ───────────────────────────────────────────── */
.cd-int-card {
  display: flex;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 10px;
  cursor: pointer;
  transition: border-color .12s, box-shadow .12s, opacity .12s;
}
.cd-int-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-sm);
}
.cd-int-card.is-dragging { opacity: 0.5; cursor: grabbing; }

.cd-int-card__thumb {
  width: 88px;
  height: 72px;
  border-radius: var(--r-sm, 6px);
  overflow: hidden;
  background: var(--surface-sunk);
  flex-shrink: 0;
}
.cd-int-card__thumb :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.cd-int-card__thumb :deep(.ph) {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-faint);
  font-size: 10px;
}

.cd-int-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cd-int-card__head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.cd-int-card__addr {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  font-size: 13.5px;
  color: var(--text);
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.cd-int-card__price {
  font-weight: 600;
  font-size: 13.5px;
  color: var(--text);
  white-space: nowrap;
  flex-shrink: 0;
}
.cd-int-card__sub {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cd-int-card__specs {
  font-size: 11.5px;
  color: var(--text-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cd-int-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}
.cd-int-card__remove {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: var(--r-sm, 6px);
  background: transparent;
  border: none;
  color: var(--text-faint);
  cursor: pointer;
  opacity: 0;
  transition: opacity .12s, color .12s, background .12s;
}
.cd-int-card:hover .cd-int-card__remove { opacity: 1; }
.cd-int-card__remove:hover { color: var(--hot); background: color-mix(in oklch, var(--hot) 10%, transparent); }
.cd-int-card__remove:disabled { opacity: 0.4; cursor: not-allowed; }

.cd-int-empty {
  text-align: center;
  font-size: 12px;
  color: var(--text-faint);
  font-style: italic;
  padding: 24px 8px;
}

/* ── Add property picker (dialog) ───────────────────── */
.cd-int-picker { display: flex; flex-direction: column; gap: 8px; }
.cd-int-picker__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 260px;
  overflow-y: auto;
  padding: 4px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}
.cd-int-picker__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--r-md);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  width: 100%;
  transition: background .12s, border-color .12s;
}
.cd-int-picker__option:hover { background: var(--surface); border-color: var(--border); }
.cd-int-picker__option.selected {
  background: var(--surface);
  border-color: var(--accent);
}
.cd-int-picker__thumb {
  width: 48px;
  height: 40px;
  border-radius: var(--r-sm, 6px);
  overflow: hidden;
  background: var(--surface-sunk);
  flex-shrink: 0;
}
.cd-int-picker__thumb :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cd-int-picker__thumb :deep(.ph) {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--text-faint);
}
.cd-int-picker__info { flex: 1; min-width: 0; }
.cd-int-picker__addr {
  font-weight: 600;
  font-size: 13px;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cd-int-picker__meta {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cd-int-picker__type { color: var(--text-faint); margin-left: 4px; }
.cd-int-picker__check { color: var(--accent); flex-shrink: 0; }
.cd-int-picker__empty {
  padding: 18px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}

/* ── Interest level chips (dialog) ──────────────────── */
.cd-int-levels {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.cd-int-level {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12.5px;
  font-weight: 550;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  cursor: pointer;
  font-family: inherit;
  transition: background .12s, color .12s, border-color .12s;
}
.cd-int-level .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cd-int-level[data-tone='hot']  .dot { background: var(--hot); }
.cd-int-level[data-tone='warm'] .dot { background: var(--warm); }
.cd-int-level[data-tone='cold'] .dot { background: var(--cold); }
.cd-int-level:hover { color: var(--text); border-color: var(--border-strong); }
.cd-int-level[aria-pressed='true'][data-tone='hot']  { color: var(--hot-ink);  border-color: var(--hot);  background: var(--hot-soft); }
.cd-int-level[aria-pressed='true'][data-tone='warm'] { color: var(--warm-ink); border-color: var(--warm); background: var(--warm-soft); }
.cd-int-level[aria-pressed='true'][data-tone='cold'] { color: var(--cold-ink); border-color: var(--cold); background: var(--cold-soft); }

/* ── Breakpoints ────────────────────────────────────── */
@media (max-width: 1100px) {
  .cd-int-grid { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .cd-int-section { padding: 18px 16px; }
  .cd-int-card { padding: 8px; }
  .cd-int-card__thumb { width: 72px; height: 60px; }
}
</style>
