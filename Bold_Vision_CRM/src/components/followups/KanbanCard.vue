<template>
  <a
    class="fu-card"
    :href="`/customers/${customer.id}`"
    :data-status="customer.category?.toLowerCase()"
    :data-dragging="isDragging"
    draggable="true"
    @click.prevent="$router.push(`/customers/${customer.id}`)"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div class="top">
      <div style="min-width: 0;">
        <div class="nm">{{ customer.name }}</div>
        <div class="ph">{{ customer.phone || customer.email || 'No contact info' }}</div>
      </div>
      <span v-if="customer.category" class="pill" :class="categoryToneClass(customer.category)" style="height: 18px; padding: 0 7px; font-size: 10.5px;">
        {{ customer.category }}
      </span>
    </div>

    <div class="footer">
      <span class="type-ico">
        <AppIcon :name="channelIcon(customer.channel)" :size="11" />
        <!-- Context-aware second line: urgency for overdue, last-contact for
             no-schedule, time-of-day for scheduled cards. When show-date is
             on (phone smart-inbox feed), scheduled cards include the date
             since there's no column header to provide that context. -->
        <span v-if="overdueDays" class="fu-overdue-tag">{{ overdueDays }}d overdue</span>
        <template v-else-if="!customer.nextContactAt">{{ lastContactLabel }}</template>
        <template v-else>{{ showDate ? fullWhenLabel : timeLabel }}</template>
      </span>

      <div class="quick-actions">
        <a
          v-if="customer.phone"
          class="qa-btn"
          :href="`tel:${customer.phone.replace(/\s/g, '')}`"
          title="Call"
          @click.stop
          @mousedown.stop
        >
          <AppIcon name="phone" :size="11" />
        </a>
        <button
          type="button"
          class="qa-btn done"
          title="Mark contacted"
          @click.prevent.stop="$emit('mark-contacted')"
          @mousedown.stop
        >
          <AppIcon name="check" :size="11" />
        </button>
      </div>
    </div>
  </a>
</template>

<script setup>
import { computed, ref } from 'vue'
import { daysUntilContact } from '../../utils/followUp'
import AppIcon from '../base/AppIcon.vue'

const props = defineProps({
  customer: { type: Object, required: true },
  showDate: { type: Boolean, default: false },   // phone feed turns this on
})
const emit = defineEmits(['dragstart', 'dragend', 'mark-contacted'])

const isDragging = ref(false)

const timeLabel = computed(() => {
  if (!props.customer.nextContactAt) return null
  const d = new Date(props.customer.nextContactAt)
  return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
})

// "Today, 9:00 am" / "Tomorrow, 9:00 am" / "Wed 20 May, 5:56 pm"
const fullWhenLabel = computed(() => {
  if (!props.customer.nextContactAt) return null
  const d = new Date(props.customer.nextContactAt)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(d); target.setHours(0, 0, 0, 0)
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24))
  let datePart
  if (diff === 0)      datePart = 'Today'
  else if (diff === 1) datePart = 'Tomorrow'
  else datePart = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${datePart}, ${timeLabel.value}`
})

const overdueDays = computed(() => {
  const d = daysUntilContact(props.customer)
  return d !== null && d < 0 ? Math.abs(d) : null
})

const lastContactLabel = computed(() => {
  if (!props.customer.lastContactedAt) return 'Never contacted'
  const d = new Date(props.customer.lastContactedAt)
  return 'Last: ' + d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
})

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
