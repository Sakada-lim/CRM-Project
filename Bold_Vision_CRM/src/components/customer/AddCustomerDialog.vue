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
          <AppIcon name="user" :size="18" />
        </span>
        <div class="modal-head__text">
          <h2>Add new customer</h2>
          <div class="sub">Capture the basics — you can refine on the profile.</div>
        </div>
        <button class="close" aria-label="Close" @click="close">
          <AppIcon name="x" :size="16" />
        </button>
      </header>

      <div class="modal-body">
        <!-- Contact -->
        <div class="modal-section">
          <h4>Contact</h4>
          <div class="field">
            <label for="ac-name">Full name</label>
            <div class="input-affix">
              <span class="prefix"><AppIcon name="user" :size="14" /></span>
              <input
                id="ac-name"
                v-model="form.name"
                type="text"
                class="input has-prefix"
                autocomplete="name"
                placeholder="e.g. Bora Chhem"
              />
            </div>
          </div>
          <div class="split-grid cols-2">
            <div class="field">
              <label for="ac-phone">Phone</label>
              <div class="input-affix">
                <span class="prefix"><AppIcon name="phone" :size="14" /></span>
                <input
                  id="ac-phone"
                  v-model="form.phone"
                  type="tel"
                  class="input has-prefix"
                  autocomplete="tel"
                  placeholder="0412 345 678"
                />
              </div>
            </div>
            <div class="field">
              <label for="ac-email">Email</label>
              <div class="input-affix">
                <span class="prefix"><AppIcon name="mail" :size="14" /></span>
                <input
                  id="ac-email"
                  v-model="form.email"
                  type="email"
                  class="input has-prefix"
                  autocomplete="email"
                  placeholder="name@example.com"
                />
              </div>
            </div>
          </div>
          <div class="field">
            <label for="ac-agent">Agent</label>
            <div class="input-affix">
              <span class="prefix"><AppIcon name="user" :size="14" /></span>
              <input
                id="ac-agent"
                v-model="form.agent"
                type="text"
                class="input has-prefix"
                placeholder="Who owns this customer (e.g. Sarah Liang)"
              />
            </div>
          </div>
        </div>

        <!-- Categorize -->
        <div class="modal-section">
          <h4>Categorize</h4>
          <div class="field">
            <label>Lead status</label>
            <div class="seg-control" role="group">
              <button
                v-for="opt in STATUS_OPTIONS"
                :key="opt.value"
                type="button"
                :class="opt.toneClass"
                :aria-pressed="form.category === opt.value"
                @click="form.category = opt.value"
              >
                <span class="dot" :style="{ background: opt.dot }"></span>
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div class="field">
            <label>Preferred channel</label>
            <div class="seg-control cols-4" role="group">
              <button
                v-for="opt in CHANNEL_OPTIONS"
                :key="opt.value"
                type="button"
                :aria-pressed="form.channel === opt.value"
                @click="form.channel = opt.value"
              >
                <span class="ico"><AppIcon :name="opt.icon" :size="14" /></span>
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="modal-section">
          <div class="field">
            <div class="field-head">
              <label for="ac-notes">Internal notes</label>
              <span class="field-action">Only visible to your team</span>
            </div>
            <textarea

              v-model="form.notes"
              class="textarea"
              rows="3"
              placeholder="Anything important to remember…"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="modal-foot modal-foot--split">
        <span class="hint">
          <span class="hint-dot" :class="{ ok: canSave }"></span>
          {{ canSave ? 'Ready to save' : 'Add a name and phone or email' }}
        </span>
        <div class="actions">
          <button class="btn btn-ghost" @click="close">Cancel</button>
          <button class="btn btn-primary" :disabled="!canSave" @click="handleSave">
            <AppIcon name="plus" :size="14" />
            Add customer
          </button>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from '../base/AppIcon.vue'

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

function makeEmptyForm() {
  return {
    name: '',
    phone: '',
    email: '',
    channel: 'Call',
    category: 'Cold',
    agent: '',
    notes: '',
  }
}

const props = defineProps({
  modelValue: { type: Boolean, required: true },
})

const emit = defineEmits(['update:modelValue', 'add'])

const isOpen = ref(props.modelValue)
const form = ref(makeEmptyForm())

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (val) form.value = makeEmptyForm()
})
watch(isOpen, (val) => emit('update:modelValue', val))

const canSave = computed(() => {
  const f = form.value
  return !!f.name.trim() && (!!f.phone.trim() || !!f.email.trim())
})

function close() {
  isOpen.value = false
}

function handleSave() {
  if (!canSave.value) return
  emit('add', { ...form.value })
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
.hint-dot.ok { background: var(--success, var(--accent)); }
</style>
