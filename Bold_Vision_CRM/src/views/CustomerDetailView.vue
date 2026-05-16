<template>
  <v-container fluid class="py-4">
    <!-- Breadcrumbs -->
    <v-breadcrumbs :items="breadcrumbs" class="mb-4" />

    <!-- Profile header -->
    <v-card class="mb-4" elevation="4">
      <v-card-text>
        <v-row class="align-center" no-gutters>
          <v-col cols="auto">
            <v-avatar size="56" color="primary">
              <span class="text-h5">
                {{ initials }}
              </span>
            </v-avatar>
          </v-col>

          <v-col class="pl-4">
            <div class="d-flex align-center flex-wrap">
              <h2 class="mr-3 mb-1">
                {{ editable.name || 'Customer details' }}
              </h2>
              <v-chip
                v-if="editable.category"
                :color="categoryColor(editable.category)"
                text-color="white"
                size="small"
                class="mr-2"
              >
                {{ editable.category }}
              </v-chip>
            </div>

            <div class="text-body-2 text-medium-emphasis">
              Last contact:
              <strong>{{ lastContactedLabel }}</strong>
              · Preferred:
              <strong>{{ editable.channel || 'N/A' }}</strong>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Main layout -->
    <v-row>
      <!-- Left side: basic info + feedback log -->
      <v-col cols="12" md="8">
        <!-- Basic info card -->
        <v-card elevation="4" class="mb-4">
          <v-card-title>Basic information</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field v-model="editable.name" label="Name" required />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="editable.phone" label="Phone" required />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="editable.email" label="Email" />
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="editable.channel"
                  :items="['Call', 'Telegram', 'SMS', 'Email']"
                  label="Preferred channel"
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="editable.category"
                  :items="['Cold', 'Warm', 'Hot']"
                  label="Category"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="editable.notes" label="Internal notes" rows="3" />
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions class="justify-end mr-2 mb-2">
            <v-btn variant="outlined" color="grey-darken-1" class="mr-2" @click="resetChanges">
              Reset
            </v-btn>
            <v-btn variant="outlined" color="primary" @click="saveChanges"> Save changes </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Feedback / interaction timeline -->
        <v-card elevation="4">
          <v-card-title class="justify-space-between align-center">
            Interaction history
          </v-card-title>

          <v-card-text>
            <!-- New feedback input (skeleton only) -->
            <v-textarea
              v-model="newFeedback"
              label="New feedback note"
              rows="2"
              class="mb-3"
              auto-grow
            />

            <v-divider />

            <v-card-actions class="justify-end pa-0 mb-4">
              <v-btn variant="outlined" color="primary" @click="addFeedback"> Add feedback </v-btn>
            </v-card-actions>

            <div v-if="feedbackEntries.length">
              <div v-for="entry in feedbackEntries" :key="entry.id" class="mb-3">
                <div class="text-body-2 font-weight-medium">
                  {{ formatDate(entry.date) }}
                </div>
                <div class="text-body-2">
                  {{ entry.note }}
                </div>
                <v-divider class="mt-2" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right side: follow-up -->
      <v-col cols="12" md="4">
        <v-card elevation="2" class="mb-4">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Follow-up</span>
            <v-chip :color="statusChip.color" size="small" variant="tonal">{{ statusChip.label }}</v-chip>
          </v-card-title>

          <v-card-text>
            <!-- Last contacted -->
            <p class="text-caption text-medium-emphasis mb-1">Last contacted</p>
            <div class="d-flex align-center gap-2 mb-4">
              <v-text-field
                :model-value="lastContactedDateInput"
                type="datetime-local"
                density="compact"
                hide-details
                variant="outlined"
                @change="onLastContactedChange"
              />
              <v-btn size="small" variant="tonal" color="primary" @click="setLastContactToNow">Now</v-btn>
            </div>

            <!-- Next contact -->
            <p class="text-caption text-medium-emphasis mb-1">Next contact</p>
            <div class="d-flex align-center gap-2 mb-2">
              <v-text-field
                v-model="nextContactInput"
                type="datetime-local"
                density="compact"
                hide-details
                variant="outlined"
              />
              <v-btn size="small" variant="tonal" color="primary" @click="saveNextContact">Set</v-btn>
              <v-btn size="small" variant="tonal" color="error" icon="mdi-close" @click="clearNextContact" />
            </div>
            <v-btn
              size="small"
              variant="outlined"
              color="secondary"
              class="mb-4"
              :disabled="!editable.category"
              @click="applyDefaultCadence"
            >
              {{ quickPickLabel }}
            </v-btn>
          </v-card-text>

          <v-card-actions class="px-4 pb-4">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-check-circle-outline"
              block
              @click="markContactedDialog = true"
            >
              Mark contacted
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Mark contacted dialog -->
    <v-dialog v-model="markContactedDialog" max-width="400">
      <v-card>
        <v-card-title>Mark as contacted</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4">Last contacted will be set to now.</p>
          <p class="text-body-2 font-weight-medium mb-2">When should we contact next?</p>
          <v-text-field v-model="mcNextDate" label="Date & time" type="datetime-local" class="mb-2" />
          <v-btn variant="outlined" size="small" color="secondary" class="mb-3" @click="mcApplyDefault">
            {{ quickPickLabel }}
          </v-btn>
          <v-checkbox v-model="mcSkip" label="Skip - don't schedule next contact" density="compact" hide-details />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="markContactedDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="confirmMarkContacted">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Interested properties (full-width) -->
    <CustomerInterestsPanel :customer-id="id" class="mt-2" />
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCustomerStore } from '../stores/customerStore'
import { customerStatus, daysUntilContact, cadenceMonths, cadenceLabel } from '../utils/followUp'
import CustomerInterestsPanel from '../components/customer/CustomerInterestsPanel.vue'

const route = useRoute()
const store = useCustomerStore()

const id = route.params.id

const original = computed(() => store.customers.find((c) => c.id === id))
const customerFound = computed(() => !!original.value)

const editable = ref({
  id,
  name: '',
  phone: '',
  email: '',
  category: 'Cold',
  channel: 'Call',
  notes: '',
  lastContactedAt: null,
  nextContactAt: null,
})

if (original.value) {
  editable.value = { ...editable.value, ...original.value }
}

// ── Derived / display ───────────────────────────────────────────────────────

const breadcrumbs = computed(() => [
  { title: 'Existing customers', to: { name: 'customers' } },
  { title: editable.value.name || 'Customer details', disabled: true },
])

const initials = computed(() => {
  if (!editable.value.name) return '?'
  return editable.value.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
})

function categoryColor(category) {
  if (category === 'Hot') return 'red'
  if (category === 'Warm') return 'orange'
  return 'blue'
}

function formatDate(iso) {
  if (!iso) return 'N/A'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-AU')
}

const lastContactedLabel = computed(() =>
  editable.value.lastContactedAt ? formatDate(editable.value.lastContactedAt) : 'Not set',
)

// ── Follow-up card computeds ────────────────────────────────────────────────

const statusChip = computed(() => {
  const status = customerStatus(editable.value)
  if (status === 'never-contacted') return { label: 'Never contacted', color: 'error' }
  if (status === 'unscheduled')     return { label: 'No schedule', color: 'warning' }
  if (status === 'overdue') {
    const d = Math.abs(daysUntilContact(editable.value))
    return { label: `${d}d overdue`, color: 'error' }
  }
  if (status === 'approaching') {
    const d = daysUntilContact(editable.value)
    return { label: `Due in ${d}d`, color: 'warning' }
  }
  return { label: 'Up to date', color: 'success' }
})

const lastContactedDateInput = computed(() => {
  if (!editable.value.lastContactedAt) return ''
  return new Date(editable.value.lastContactedAt).toISOString().slice(0, 16)
})

const nextContactInput = ref(
  editable.value.nextContactAt ? new Date(editable.value.nextContactAt).toISOString().slice(0, 16) : ''
)

watch(
  () => editable.value.nextContactAt,
  (val) => {
    nextContactInput.value = val ? new Date(val).toISOString().slice(0, 16) : ''
  }
)

const quickPickLabel = computed(() => {
  if (!editable.value.category) return 'Set default'
  return `${cadenceLabel(editable.value.category)} (${editable.value.category} default)`
})

// ── Follow-up actions ────────────────────────────────────────────────────────

async function onLastContactedChange(e) {
  const val = e.target.value
  if (!val) return
  const iso = new Date(val).toISOString()
  editable.value.lastContactedAt = iso
  await store.setLastContacted(id, iso)
}

async function saveNextContact() {
  const val = nextContactInput.value
  const iso = val ? new Date(val).toISOString() : null
  editable.value.nextContactAt = iso
  await store.setNextContactAt(id, iso)
}

async function setLastContactToNow() {
  const iso = new Date().toISOString()
  editable.value.lastContactedAt = iso
  await store.setLastContacted(id, iso)
}

async function clearNextContact() {
  editable.value.nextContactAt = null
  nextContactInput.value = ''
  await store.setNextContactAt(id, null)
}

async function applyDefaultCadence() {
  const next = new Date()
  next.setMonth(next.getMonth() + cadenceMonths(editable.value.category))
  const iso = next.toISOString()
  editable.value.nextContactAt = iso
  await store.setNextContactAt(id, iso)
}

// ── Mark contacted dialog ────────────────────────────────────────────────────

const markContactedDialog = ref(false)
const mcNextDate = ref('')
const mcSkip = ref(false)

function mcApplyDefault() {
  const next = new Date()
  next.setMonth(next.getMonth() + cadenceMonths(editable.value.category))
  mcNextDate.value = next.toISOString().slice(0, 16)
  mcSkip.value = false
}

async function confirmMarkContacted() {
  const now = new Date().toISOString()
  const nextIso = mcSkip.value || !mcNextDate.value ? null : new Date(mcNextDate.value).toISOString()
  await store.logContact(id, now, nextIso)
  editable.value.lastContactedAt = now
  editable.value.nextContactAt = nextIso
  markContactedDialog.value = false
  mcNextDate.value = ''
  mcSkip.value = false
}

// ── Feedback ─────────────────────────────────────────────────────────────────

const feedbackEntries = computed(() => store.feedback[id] ?? [])
const newFeedback = ref('')

onMounted(() => store.fetchFeedback(id))

async function addFeedback() {
  const note = newFeedback.value.trim()
  if (!note || !customerFound.value) return
  await store.addFeedback(id, note)
  newFeedback.value = ''
}

// ── Basic info save/reset ────────────────────────────────────────────────────

function saveChanges() {
  if (!customerFound.value) return
  store.updateCustomer(id, { ...editable.value })
}

function resetChanges() {
  if (!original.value) return
  editable.value = { ...editable.value, ...original.value }
}
</script>
