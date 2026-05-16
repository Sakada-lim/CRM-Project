<template>
  <v-card v-bind="$attrs" elevation="4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="primary">mdi-send</v-icon>
      Broadcast via Telegram
    </v-card-title>

    <v-card-text>
      <!-- Audience selector -->
      <p class="text-caption text-medium-emphasis mb-2">Audience</p>
      <div class="d-flex gap-2 flex-wrap mb-4">
        <v-chip
          v-for="opt in audienceOptions"
          :key="opt.value"
          :color="selectedAudience === opt.value ? 'primary' : undefined"
          :variant="selectedAudience === opt.value ? 'flat' : 'outlined'"
          class="cursor-pointer"
          @click="selectedAudience = opt.value"
        >
          {{ opt.label }}
          <span class="ml-1 text-caption">({{ audienceCount(opt.value) }})</span>
        </v-chip>
      </div>

      <!-- Enrolled count notice -->
      <v-alert
        v-if="eligibleRecipients.length === 0"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        No enrolled Telegram customers in this group. Go to a customer profile to share their enrollment link.
      </v-alert>
      <p v-else class="text-caption text-medium-emphasis mb-4">
        {{ eligibleRecipients.length }} enrolled Telegram
        {{ eligibleRecipients.length === 1 ? 'customer' : 'customers' }} will receive this message.
      </p>

      <!-- Message body -->
      <v-textarea
        v-model="messageBody"
        label="Message"
        rows="5"
        auto-grow
        variant="outlined"
        class="mb-2"
      />
      <p class="text-caption text-medium-emphasis mb-4">
        You can edit this before sending.
      </p>
    </v-card-text>

    <v-card-actions class="px-4 pb-4">
      <v-spacer />
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-send"
        :disabled="eligibleRecipients.length === 0 || !messageBody.trim()"
        @click="confirmDialog = true"
      >
        Send to {{ eligibleRecipients.length }}
      </v-btn>
    </v-card-actions>

    <!-- Recent broadcasts -->
    <template v-if="recentBroadcasts.length">
      <v-divider />
      <v-card-text>
        <p class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-3">Recent broadcasts</p>
        <div v-for="b in recentBroadcasts" :key="b.id" class="mb-3">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption text-medium-emphasis">{{ formatDate(b.sentAt) }}</span>
            <div class="d-flex gap-2">
              <v-chip size="x-small" color="success" variant="tonal">{{ b.sentCount }} sent</v-chip>
              <v-chip v-if="b.failedCount" size="x-small" color="error" variant="tonal">{{ b.failedCount }} failed</v-chip>
            </div>
          </div>
          <p class="text-body-2 text-truncate">{{ b.body }}</p>
          <p class="text-caption text-medium-emphasis">To: {{ b.audienceFilter }}</p>
          <v-divider class="mt-2" />
        </div>
      </v-card-text>
    </template>
  </v-card>

  <!-- Confirm dialog -->
  <v-dialog v-model="confirmDialog" max-width="440">
    <v-card>
      <v-card-title>Confirm broadcast</v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-2">
          Sending to <strong>{{ eligibleRecipients.length }}</strong>
          {{ selectedAudience === 'All' ? '' : selectedAudience }}
          Telegram {{ eligibleRecipients.length === 1 ? 'customer' : 'customers' }}.
        </p>

        <!-- Recipient preview -->
        <v-expansion-panels variant="accordion" class="mb-4">
          <v-expansion-panel title="Preview recipients">
            <v-expansion-panel-text>
              <div v-for="c in eligibleRecipients" :key="c.id" class="text-body-2 py-1">
                {{ c.name }}
                <v-chip size="x-small" :color="categoryColor(c.category)" class="ml-1">{{ c.category }}</v-chip>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-card variant="tonal" class="pa-3 text-body-2" style="white-space: pre-wrap;">{{ messageBody }}</v-card>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" :disabled="sending" @click="confirmDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="sending" @click="send">Send</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Result snackbar -->
  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

defineOptions({ inheritAttrs: false })
import { useCustomerStore } from '../../stores/customerStore'
import { createBroadcast, listBroadcastsForProperty } from '../../services/messagesService'

const props = defineProps({
  property: { type: Object, required: true },
})

const customerStore = useCustomerStore()

const selectedAudience = ref('All')
const messageBody      = ref('')
const confirmDialog    = ref(false)
const sending          = ref(false)
const recentBroadcasts = ref([])

const snackbar = ref({ show: false, text: '', color: 'success' })

const audienceOptions = [
  { label: 'All',  value: 'All'  },
  { label: 'Hot',  value: 'Hot'  },
  { label: 'Warm', value: 'Warm' },
  { label: 'Cold', value: 'Cold' },
]

// Customers eligible for broadcast: must have telegram_chat_id
const telegramCustomers = computed(() =>
  customerStore.customers.filter((c) => c.telegramChatId)
)

function audienceCount(filter) {
  if (filter === 'All') return telegramCustomers.value.length
  return telegramCustomers.value.filter((c) => c.category === filter).length
}

const eligibleRecipients = computed(() => {
  if (selectedAudience.value === 'All') return telegramCustomers.value
  return telegramCustomers.value.filter((c) => c.category === selectedAudience.value)
})

function categoryColor(cat) {
  if (cat === 'Hot')  return 'red'
  if (cat === 'Warm') return 'orange'
  return 'blue'
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function buildDefaultMessage() {
  const p = props.property
  const lines = [`New Listing: ${p.address}${p.suburb ? ', ' + p.suburb : ''}`]
  if (p.priceGuide)  lines.push(`Price: ${p.priceGuide}`)
  const details = []
  if (p.bedrooms)   details.push(`${p.bedrooms} bed`)
  if (p.bathrooms)  details.push(`${p.bathrooms} bath`)
  if (p.carSpaces)  details.push(`${p.carSpaces} car`)
  if (details.length) lines.push(details.join(' | '))
  if (p.description) lines.push('', p.description)
  lines.push('', 'Contact Bold Vision Properties for more information.')
  return lines.join('\n')
}

async function send() {
  sending.value = true
  try {
    const result = await createBroadcast({
      propertyId: props.property.id,
      body: messageBody.value,
      audienceFilter: selectedAudience.value,
      customers: eligibleRecipients.value,
    })
    confirmDialog.value = false
    snackbar.value = {
      show: true,
      text: `Sent to ${result.sent} customer${result.sent === 1 ? '' : 's'}${result.failed ? ` (${result.failed} failed)` : ''}.`,
      color: result.failed ? 'warning' : 'success',
    }
    await loadBroadcasts()
  } catch (e) {
    snackbar.value = { show: true, text: `Error: ${e.message}`, color: 'error' }
  } finally {
    sending.value = false
  }
}

async function loadBroadcasts() {
  try {
    recentBroadcasts.value = await listBroadcastsForProperty(props.property.id)
  } catch {
    // non-critical — silent fail
  }
}

onMounted(() => {
  messageBody.value = buildDefaultMessage()
  loadBroadcasts()
})
</script>
