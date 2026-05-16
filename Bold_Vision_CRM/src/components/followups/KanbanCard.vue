<template>
  <div
    class="kanban-card"
    :class="[`kanban-card--${customer.category?.toLowerCase()}`, { 'kanban-card--dragging': isDragging }]"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div class="kanban-card__body" @click="$router.push(`/customers/${customer.id}`)">
      <div class="kanban-card__top-row">
        <p class="kanban-card__name">{{ customer.name }}</p>
        <span class="kanban-card__category-dot" :class="`dot--${customer.category?.toLowerCase()}`" :title="customer.category" />
      </div>
      <p class="kanban-card__sub">{{ customer.phone || customer.email || 'No contact info' }}</p>
      <div class="kanban-card__footer">
        <span v-if="timeLabel" class="kanban-card__time">
          <v-icon size="10" class="mr-1">mdi-clock-outline</v-icon>{{ timeLabel }}
        </span>
        <v-chip v-if="statusChip" :color="statusChip.color" size="x-small" variant="tonal" class="kanban-card__chip">
          {{ statusChip.label }}
        </v-chip>
      </div>
    </div>

    <div class="kanban-card__actions">
      <v-menu location="bottom end">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon="mdi-dots-vertical" size="x-small" variant="text" density="compact" />
        </template>
        <v-list density="compact">
          <v-list-item prepend-icon="mdi-check-circle-outline" title="Mark contacted" @click="$emit('mark-contacted')" />
          <v-list-item prepend-icon="mdi-calendar-remove-outline" title="Clear schedule" @click="$emit('clear-schedule')" />
          <v-list-item prepend-icon="mdi-account-details-outline" title="View customer" :to="`/customers/${customer.id}`" />
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  customer: { type: Object, required: true },
  showStatus: { type: Boolean, default: false },
})

const emit = defineEmits(['dragstart', 'dragend', 'mark-contacted', 'clear-schedule'])

const isDragging = ref(false)

const timeLabel = computed(() => {
  if (!props.customer.nextContactAt) return null
  const d = new Date(props.customer.nextContactAt)
  return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })
})

const statusChip = computed(() => {
  if (!props.showStatus) return null
  if (!props.customer.nextContactAt && !props.customer.lastContactedAt) {
    return { label: 'Never contacted', color: 'error' }
  }
  if (!props.customer.nextContactAt) {
    return { label: 'No schedule', color: 'warning' }
  }
  return null
})

function onDragStart(e) {
  isDragging.value = true
  e.dataTransfer.effectAllowed = 'move'
  emit('dragstart', props.customer)
}

function onDragEnd() {
  isDragging.value = false
  emit('dragend')
}
</script>

<style scoped>
.kanban-card {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 8px 10px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  border-left-width: 4px;
  cursor: grab;
  transition: box-shadow 0.15s, opacity 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.kanban-card:hover { box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.kanban-card--dragging { opacity: 0.35; cursor: grabbing; }

.kanban-card--hot  { border-left-color: #ef4444; }
.kanban-card--warm { border-left-color: #f97316; }
.kanban-card--cold { border-left-color: #3b82f6; }

.kanban-card__body { flex: 1; min-width: 0; cursor: pointer; }

.kanban-card__top-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.kanban-card__name {
  font-weight: 600;
  font-size: 0.85rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.kanban-card__category-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot--hot  { background: #ef4444; }
.dot--warm { background: #f97316; }
.dot--cold { background: #3b82f6; }

.kanban-card__sub {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kanban-card__footer {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.kanban-card__time {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.kanban-card__chip { font-size: 0.65rem !important; }

.kanban-card__actions {
  flex-shrink: 0;
  margin-top: -4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.kanban-card:hover .kanban-card__actions { opacity: 1; }
</style>
