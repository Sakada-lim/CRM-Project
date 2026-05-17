<template>
  <v-dialog
    v-model="isOpen"
    :max-width="720"
    transition="dialog-transition"
    :scrim="'rgba(15,23,42,0.65)'"
  >
    <div class="modal-card">
      <header class="modal-head">
        <span class="ico">
          <AppIcon name="filter" :size="18" />
        </span>
        <div class="modal-head__text">
          <h2>Filter customers</h2>
          <div class="sub">Narrow down your pipeline</div>
        </div>
        <button class="close" aria-label="Close" @click="close">
          <AppIcon name="x" :size="16" />
        </button>
      </header>

      <div class="modal-body">
        <!-- Status -->
        <div class="modal-section">
          <h4>Status</h4>
          <div class="seg-control" role="group">
            <button
              v-for="opt in STATUS_OPTIONS"
              :key="opt.value"
              type="button"
              :class="opt.toneClass"
              :aria-pressed="draft.categories.includes(opt.value)"
              @click="toggle('categories', opt.value)"
            >
              <span class="dot" :style="{ background: opt.dot }"></span>
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Channel -->
        <div class="modal-section">
          <h4>Preferred channel</h4>
          <div class="seg-control cols-4" role="group">
            <button
              v-for="opt in CHANNEL_OPTIONS"
              :key="opt.value"
              type="button"
              :aria-pressed="draft.channels.includes(opt.value)"
              @click="toggle('channels', opt.value)"
            >
              <span class="ico"><AppIcon :name="opt.icon" :size="14" /></span>
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Overdue toggle -->
        <div class="modal-section">
          <div class="toggle-row">
            <div class="meta">
              <span class="ttl">Overdue follow-ups only</span>
              <span class="desc">Hide everyone who's still on track</span>
            </div>
            <button
              class="toggle-switch"
              role="switch"
              :aria-checked="draft.overdueOnly"
              @click="draft.overdueOnly = !draft.overdueOnly"
            />
          </div>
        </div>
      </div>

      <div class="modal-foot modal-foot--split">
        <span class="hint">
          <span class="hint-dot" :class="{ ok: activeCount > 0 }"></span>
          <template v-if="activeCount === 0">No filters active</template>
          <template v-else><strong>{{ activeCount }}</strong>&nbsp;filter{{ activeCount === 1 ? '' : 's' }} selected</template>
        </span>
        <div class="actions">
          <button class="btn btn-ghost" :disabled="activeCount === 0" @click="handleReset">Reset</button>
          <button class="btn btn-primary" @click="handleApply">
            <AppIcon name="check" :size="14" />
            Apply filters
          </button>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '../base/AppIcon.vue'
import { useFilterDialogState } from '../../composables/useFilterDialogState'

const STATUS_OPTIONS = [
  { value: 'Hot',  label: 'Hot',  toneClass: 'is-hot',  dot: 'var(--hot)'  },
  { value: 'Warm', label: 'Warm', toneClass: 'is-warm', dot: 'var(--warm)' },
  { value: 'Cold', label: 'Cold', toneClass: 'is-cold', dot: 'var(--cold)' },
]

const CHANNEL_OPTIONS = [
  { value: 'Call',     label: 'Call',     icon: 'phone' },
  { value: 'Telegram', label: 'Telegram', icon: 'chat'  },
  { value: 'SMS',      label: 'SMS',      icon: 'chat'  },
  { value: 'Email',    label: 'Email',    icon: 'mail'  },
]

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  criteria: {
    type: Object,
    default: () => ({ categories: [], channels: [], overdueOnly: false }),
  },
})

const emit = defineEmits(['update:modelValue', 'apply', 'clear'])

const { draft, isOpen, close } = useFilterDialogState({
  props,
  emit,
  createEmptyDraft: () => ({ categories: [], channels: [], overdueOnly: false }),
  mapCriteriaToDraft: (criteria = {}) => ({
    categories: Array.isArray(criteria?.categories) ? [...criteria.categories] : [],
    channels: Array.isArray(criteria?.channels) ? [...criteria.channels] : [],
    overdueOnly: !!criteria?.overdueOnly,
  }),
})

const activeCount = computed(() =>
  draft.categories.length + draft.channels.length + (draft.overdueOnly ? 1 : 0),
)

function toggle(key, value) {
  const list = draft[key]
  const idx = list.indexOf(value)
  if (idx >= 0) list.splice(idx, 1)
  else list.push(value)
}

function handleReset() {
  draft.categories = []
  draft.channels = []
  draft.overdueOnly = false
  emit('clear')
}

function handleApply() {
  emit('apply', {
    categories: [...draft.categories],
    channels: [...draft.channels],
    overdueOnly: draft.overdueOnly,
  })
  close()
}
</script>

<style scoped>
.hint { gap: 8px; }
.hint-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--text-faint);
  flex-shrink: 0;
  transition: background .15s;
}
.hint-dot.ok { background: var(--accent); }
.hint strong { color: var(--text); font-weight: 600; }
</style>
