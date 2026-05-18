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
          <div class="field" :class="{ 'is-error': errors.name }">
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
                :maxlength="LIMITS.name.max"
                @input="clearError('name')"
                @blur="validateField('name'); checkDuplicates()"
              />
            </div>
            <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
            <p v-if="duplicates.name" class="dup-warn">
              <AppIcon name="user" :size="12" />
              Same name as
              <RouterLink :to="`/customers/${duplicates.name.id}`" class="dup-link" @click="close">
                {{ duplicates.name.name }}
              </RouterLink>
              — different person? Save anyway.
            </p>
          </div>
          <div class="split-grid cols-2">
            <div class="field" :class="{ 'is-error': errors.phone }">
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
                  :maxlength="LIMITS.phone.max"
                  @input="clearError('phone'); clearError('_')"
                  @blur="validateField('phone'); checkDuplicates()"
                />
              </div>
              <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>
              <p v-if="duplicates.phone" class="dup-error">
                <AppIcon name="phone" :size="12" />
                This phone already belongs to
                <RouterLink :to="`/customers/${duplicates.phone.id}`" class="dup-link" @click="close">
                  {{ duplicates.phone.name || 'an existing customer' }}
                </RouterLink>
                — open them or change the number.
              </p>
            </div>
            <div class="field" :class="{ 'is-error': errors.email }">
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
                  :maxlength="LIMITS.email.max"
                  @input="clearError('email'); clearError('_')"
                  @blur="validateField('email'); checkDuplicates()"
                />
              </div>
              <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
              <p v-if="duplicates.email" class="dup-error">
                <AppIcon name="mail" :size="12" />
                This email already belongs to
                <RouterLink :to="`/customers/${duplicates.email.id}`" class="dup-link" @click="close">
                  {{ duplicates.email.name || 'an existing customer' }}
                </RouterLink>
                — open them or change the address.
              </p>
            </div>
          </div>
          <div class="field" :class="{ 'is-error': errors.agent }">
            <label for="ac-agent">Agent</label>
            <div class="input-affix">
              <span class="prefix"><AppIcon name="user" :size="14" /></span>
              <input
                id="ac-agent"
                v-model="form.agent"
                type="text"
                class="input has-prefix"
                placeholder="Who owns this customer (e.g. Sarah Liang)"
                :maxlength="LIMITS.agent.max"
                @input="clearError('agent')"
                @blur="validateField('agent')"
              />
            </div>
            <p v-if="errors.agent" class="field-error">{{ errors.agent }}</p>
          </div>
          <p v-if="errors._" class="form-error">{{ errors._ }}</p>
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
              :maxlength="LIMITS.notes.max"
              @input="clearError('notes')"
              @blur="validateField('notes')"
            ></textarea>
            <p v-if="errors.notes" class="field-error">{{ errors.notes }}</p>
          </div>
        </div>
      </div>

      <div class="modal-foot modal-foot--split">
        <span class="hint">
          <span class="hint-dot" :class="hintDotClass"></span>
          <template v-if="hasBlockingDuplicate">Duplicate phone or email — must be unique</template>
          <template v-else-if="duplicates.name">Same name as another customer — save anyway?</template>
          <template v-else>{{ canSave ? 'Ready to save' : 'Add a name and phone or email' }}</template>
        </span>
        <div class="actions">
          <button class="btn btn-ghost" @click="close">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="hasBlockingDuplicate"
            @click="handleSave"
          >
            <AppIcon name="plus" :size="14" />
            {{ duplicates.name && !hasBlockingDuplicate ? 'Save anyway' : 'Add customer' }}
          </button>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '../base/AppIcon.vue'
import { validateCustomerForm, findDuplicateCustomers, LIMITS } from '../../utils/validators'
import { useFeedback } from '../../composables/useFeedback'
import { useCustomerStore } from '../../stores/customerStore'

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
const errors = ref({})
const duplicates = ref({})           // { phone?: customer, email?: customer }
const { notifyError } = useFeedback()
const customerStore = useCustomerStore()

// Phone + email are hard blocks (no override). Name is a soft warn.
const hasBlockingDuplicate = computed(
  () => !!(duplicates.value.phone || duplicates.value.email),
)
const hintDotClass = computed(() => {
  if (hasBlockingDuplicate.value) return 'err'
  if (duplicates.value.name) return 'warn'
  if (canSave.value) return 'ok'
  return ''
})

function checkDuplicates() {
  duplicates.value = findDuplicateCustomers(
    { phone: form.value.phone, email: form.value.email, name: form.value.name },
    customerStore.customers,
  )
}

watch(() => props.modelValue, (val) => {
  isOpen.value = val
  if (val) {
    form.value = makeEmptyForm()
    errors.value = {}
    duplicates.value = {}
  }
})
watch(isOpen, (val) => emit('update:modelValue', val))

const canSave = computed(() => {
  const f = form.value
  return !!f.name.trim() && (!!f.phone.trim() || !!f.email.trim())
})

function clearError(field) {
  if (errors.value[field]) {
    const { [field]: _, ...rest } = errors.value
    errors.value = rest
  }
}

// Run the full composite validator but only surface the error for the given
// field. Keeps the at-least-one-contact check live across phone+email blur.
function validateField(field) {
  const result = validateCustomerForm(form.value) ?? {}
  if (result[field]) errors.value = { ...errors.value, [field]: result[field] }
  else clearError(field)
  // Refresh the form-level "at least one contact" message based on current state
  if (result._) errors.value = { ...errors.value, _: result._ }
  else clearError('_')
}

function close() {
  isOpen.value = false
}

function handleSave() {
  const result = validateCustomerForm(form.value)
  if (result) {
    errors.value = result
    // Surface the first field's message as a toast so the user notices even
    // if the offending field is scrolled off-screen
    const first = result._ ?? Object.values(result)[0]
    notifyError(first)
    return
  }
  // Re-check duplicates defensively (Enter key may bypass @blur)
  checkDuplicates()
  if (hasBlockingDuplicate.value) {
    const target = duplicates.value.phone ?? duplicates.value.email
    const field  = duplicates.value.phone ? 'phone number' : 'email'
    notifyError(`This ${field} already belongs to ${target.name || 'an existing customer'}.`)
    return
  }
  errors.value = {}
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
.hint-dot.ok   { background: var(--success, var(--accent)); }
.hint-dot.warn { background: oklch(72% 0.16 75); }
.hint-dot.err  { background: var(--danger, oklch(56% 0.20 27)); }

/* Soft duplicate warning (name) — yellow, allows override */
.dup-warn {
  margin: 4px 0 0;
  padding: 6px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: oklch(45% 0.13 75);
  background: oklch(96% 0.04 75);
  border: 1px solid oklch(80% 0.10 75);
  border-radius: var(--r-md);
}
:root[data-theme="dark"] .dup-warn {
  background: oklch(28% 0.06 75);
  border-color: oklch(40% 0.10 75);
  color: oklch(85% 0.10 75);
}

/* Hard duplicate error (phone / email) — red, blocks save */
.dup-error {
  margin: 4px 0 0;
  padding: 6px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--danger, oklch(45% 0.18 27));
  background: oklch(96% 0.03 27);
  border: 1px solid oklch(80% 0.10 27);
  border-radius: var(--r-md);
}
:root[data-theme="dark"] .dup-error {
  background: oklch(28% 0.06 27);
  border-color: oklch(40% 0.10 27);
  color: oklch(85% 0.10 27);
}

.dup-link {
  color: inherit;
  text-decoration: underline;
  font-weight: 600;
}
.dup-link:hover { opacity: 0.85; }
</style>
