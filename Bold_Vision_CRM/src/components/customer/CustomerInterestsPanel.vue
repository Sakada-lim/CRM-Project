<template>
  <v-card elevation="4">
    <v-card-title>Interested properties</v-card-title>

    <v-card-text>
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="24" />
      </div>

      <v-row v-else dense>
        <v-col v-for="level in LEVELS" :key="level" cols="12" md="4">
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
              <v-btn size="x-small" variant="text" icon="mdi-plus" @click="openAddDialog(level)" />
            </header>

            <div class="kanban-body">
              <div
                v-for="item in itemsFor(level)"
                :key="item.id"
                class="kanban-card"
                :class="{ 'kanban-card--dragging': dragFrom?.propertyId === item.propertyId }"
                draggable="true"
                @dragstart="onDragStart(item)"
                @dragend="onDragEnd"
                @click="router.push({ name: 'property-details', params: { id: item.propertyId } })"
              >
                <div class="kanban-card-main">
                  <p class="kanban-card-name">{{ item.propertyAddress }}</p>
                  <p class="kanban-card-contact">{{ item.propertySuburb }} · {{ item.propertyType }}</p>
                  <div class="kanban-card-chips">
                    <v-chip :color="statusColor(item.propertyStatus)" size="x-small" variant="outlined">
                      {{ item.propertyStatus }}
                    </v-chip>
                    <span v-if="item.propertyPriceGuide" class="kanban-card-price">
                      {{ item.propertyPriceGuide }}
                    </span>
                  </div>
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
                No {{ level.toLowerCase() }} properties.
              </p>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Add property dialog -->
    <v-dialog v-model="dialog" max-width="420">
      <v-card>
        <v-card-title>Add {{ selectedLevel.toLowerCase() }} property</v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="selectedProperty"
            :items="availableProperties"
            item-title="address"
            item-value="id"
            label="Property"
            clearable
            return-object
          />
          <v-select v-model="selectedLevel" :items="LEVELS" label="Interest level" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn
            variant="outlined"
            color="primary"
            :disabled="!selectedProperty"
            :loading="adding"
            @click="addProperty"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomerStore } from '../../stores/customerStore'
import { usePropertyStore } from '../../stores/propertyStore'

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

const dragFrom = ref(null)
const dragOverColumn = ref(null)

const interests = computed(() => customerStore.propertyInterests[props.customerId] ?? [])

const availableProperties = computed(() => {
  const linked = new Set(interests.value.map((i) => i.propertyId))
  return propertyStore.properties.filter((p) => !linked.has(p.id))
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
  selectedLevel.value = level
  dialog.value = true
}

async function addProperty() {
  if (!selectedProperty.value) return
  adding.value = true
  try {
    await customerStore.addPropertyInterest(props.customerId, selectedProperty.value.id, selectedLevel.value)
    closeDialog()
  } finally {
    adding.value = false
  }
}

function closeDialog() {
  dialog.value = false
  selectedProperty.value = null
  selectedLevel.value = 'Warm'
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
  } finally {
    removing.value = null
  }
}

function statusColor(status) {
  if (status === 'On Market') return 'primary'
  if (status === 'Under Offer') return 'amber-darken-2'
  if (status === 'Sold') return 'grey-darken-1'
  return 'green-darken-1'
}
</script>

<style scoped>
.kanban-column {
  background: var(--bv-surface-muted, #f1f5f9);
  border-radius: 12px;
  padding: 10px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: outline 0.15s ease, background 0.15s ease;
  outline: 2px solid transparent;
}

.kanban-column--over {
  outline: 2px dashed #6366f1;
  background: #eef2ff;
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
  font-size: 0.9rem;
  color: #0f172a;
}

.kanban-count {
  font-weight: 500;
  font-size: 0.8rem;
  color: #64748b;
}

.kanban-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.kanban-dot--hot  { background: #ef4444; }
.kanban-dot--warm { background: #f59e0b; }
.kanban-dot--cold { background: #3b82f6; }

.kanban-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kanban-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: opacity 0.15s ease, box-shadow 0.15s ease;
}

.kanban-card:hover {
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.kanban-card--dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.kanban-card-main {
  flex: 1;
  min-width: 0;
}

.kanban-card-name {
  margin: 0;
  font-weight: 600;
  font-size: 0.9rem;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kanban-card-contact {
  margin: 2px 0 4px;
  font-size: 0.8rem;
  color: #475569;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kanban-card-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.kanban-card-price {
  font-size: 0.75rem;
  color: #64748b;
}

.kanban-empty {
  margin: 6px;
  font-size: 0.8rem;
  color: #94a3b8;
  font-style: italic;
}
</style>
