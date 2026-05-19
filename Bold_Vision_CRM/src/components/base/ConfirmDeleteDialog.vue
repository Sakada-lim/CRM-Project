<template>
  <v-dialog
    v-model="isOpen"
    :max-width="520"
    transition="dialog-transition"
    :scrim="'rgba(15,23,42,0.65)'"
    :persistent="busy"
  >
    <div class="modal-card cdd-card">
      <header class="modal-head">
        <span class="ico cdd-ico"><AppIcon name="x" :size="18" /></span>
        <div class="modal-head__text">
          <h2>Delete {{ entityType }}</h2>
          <div class="sub">This cannot be undone.</div>
        </div>
        <button class="close" aria-label="Close" :disabled="busy" @click="cancel">
          <AppIcon name="x" :size="16" />
        </button>
      </header>

      <div class="modal-body cdd-body">
        <p class="cdd-warn">
          You are about to permanently delete
          <strong>{{ entityLabel || `this ${entityType}` }}</strong>.
          Related data (notes, interactions, photos, interests) will also be removed.
        </p>

        <div class="field" :class="{ 'is-error': showError }">
          <label for="cdd-input">
            To confirm, type <strong>{{ confirmWord }}</strong> below.
          </label>
          <input
            id="cdd-input"
            ref="inputRef"
            v-model="typed"
            type="text"
            class="input"
            autocomplete="off"
            :placeholder="confirmWord"
            :disabled="busy"
            @keyup.enter="onConfirm"
          />
          <p v-if="showError" class="field-error">
            Type {{ confirmWord }} exactly to enable delete.
          </p>
        </div>
      </div>

      <div class="modal-foot">
        <button class="btn btn-ghost" :disabled="busy" @click="cancel">Cancel</button>
        <button
          type="button"
          class="btn cdd-btn-danger"
          :disabled="!canConfirm || busy"
          @click="onConfirm"
        >
          <AppIcon name="x" :size="14" />
          {{ busy ? 'Deleting…' : `Delete ${entityType}` }}
        </button>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  modelValue:  { type: Boolean, required: true },
  entityType:  { type: String, required: true },   // e.g. "customer", "property"
  entityLabel: { type: String, default: '' },      // e.g. customer name or property address
  confirmWord: { type: String, default: 'CONFIRM' },
  busy:        { type: Boolean, default: false },  // parent sets true while async delete in flight
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const isOpen = ref(props.modelValue)
const typed = ref('')
const inputRef = ref(null)
const attempted = ref(false)

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (val) {
    typed.value = ''
    attempted.value = false
    nextTick(() => inputRef.value?.focus())
  }
})
watch(isOpen, (val) => emit('update:modelValue', val))

const canConfirm = computed(() => typed.value.trim() === props.confirmWord)
const showError = computed(() => attempted.value && !canConfirm.value)

function cancel() {
  if (props.busy) return
  isOpen.value = false
}

function onConfirm() {
  attempted.value = true
  if (!canConfirm.value || props.busy) return
  emit('confirm')
}
</script>

<style scoped>
.cdd-card { /* sits on top of modal-card chrome */ }
.cdd-ico {
  background: oklch(94% 0.04 27);
  color: var(--danger, oklch(56% 0.20 27));
}
:root[data-theme="dark"] .cdd-ico {
  background: oklch(28% 0.06 27);
}
.cdd-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 20px;
}
.cdd-warn {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--text);
}
.cdd-warn strong {
  color: var(--text);
  font-weight: 600;
}
.cdd-btn-danger {
  background: var(--danger, oklch(56% 0.20 27));
  color: oklch(100% 0 0);
  border: none;
}
.cdd-btn-danger:hover:not(:disabled) {
  background: oklch(50% 0.20 27);
}
.cdd-btn-danger:disabled {
  background: var(--surface-sunk);
  color: var(--text-faint);
  cursor: not-allowed;
}
</style>
