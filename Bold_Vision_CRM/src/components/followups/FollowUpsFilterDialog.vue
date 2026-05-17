<template>
  <v-dialog
    v-model="isOpen"
    :max-width="420"
    transition="dialog-transition"
    :scrim="'rgba(15,23,42,0.65)'"
  >
    <div class="modal-card">
      <header class="modal-head">
        <span class="ico"><AppIcon name="filter" :size="18" /></span>
        <div class="modal-head__text">
          <h2>Filter follow-ups</h2>
          <div class="sub">Narrow the board by lead status.</div>
        </div>
        <button class="close" aria-label="Close" @click="close">
          <AppIcon name="x" :size="16" />
        </button>
      </header>

      <div class="modal-body">
        <div class="modal-section">
          <h4>Lead status</h4>
          <div class="seg-control" role="group" aria-label="Lead status filter">
            <button
              v-for="opt in STATUS_OPTIONS"
              :key="opt.value"
              type="button"
              :class="opt.toneClass"
              :aria-pressed="local.includes(opt.value)"
              @click="toggle(opt.value)"
            >
              <span class="dot" :style="{ background: opt.dot }"></span>
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="modal-foot modal-foot--split">
        <span class="hint">
          {{ local.length === 0
              ? 'Showing all follow-ups'
              : `${local.length} filter${local.length === 1 ? '' : 's'} selected` }}
        </span>
        <div class="actions">
          <button class="btn btn-ghost" @click="reset">Reset</button>
          <button class="btn btn-primary" @click="apply">
            <AppIcon name="check" :size="14" />
            Apply
          </button>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import AppIcon from '../base/AppIcon.vue'

const STATUS_OPTIONS = [
  { value: 'Hot',  label: 'Hot',  toneClass: 'is-hot',  dot: 'var(--hot)'  },
  { value: 'Warm', label: 'Warm', toneClass: 'is-warm', dot: 'var(--warm)' },
  { value: 'Cold', label: 'Cold', toneClass: 'is-cold', dot: 'var(--cold)' },
]

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  selected:   { type: Array,   default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'apply', 'clear'])

const isOpen = ref(props.modelValue)
const local  = ref([...props.selected])

watch(() => props.modelValue, (v) => {
  isOpen.value = v
  if (v) local.value = [...props.selected]
})
watch(isOpen, (v) => emit('update:modelValue', v))

function toggle(value) {
  if (local.value.includes(value)) {
    local.value = local.value.filter((v) => v !== value)
  } else {
    local.value = [...local.value, value]
  }
}

function close()  { isOpen.value = false }
function apply()  { emit('apply', local.value) }
function reset()  { local.value = []; emit('clear') }
</script>
