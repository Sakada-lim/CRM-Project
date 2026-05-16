<template>
  <div class="messages">
    <div class="mb-6">
      <h2 class="text-h5 font-weight-bold">Broadcast history</h2>
      <p class="text-body-2 text-medium-emphasis mt-1">All Telegram broadcasts sent from this account.</p>
    </div>

    <v-card elevation="4">
      <v-card-text v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </v-card-text>

      <v-card-text v-else-if="!broadcasts.length" class="text-center py-8 text-medium-emphasis">
        No broadcasts sent yet.
      </v-card-text>

      <template v-else>
        <div v-for="b in broadcasts" :key="b.id" class="broadcast-row">
          <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-1">
            <div>
              <span class="text-body-2 font-weight-medium">{{ formatDate(b.sentAt) }}</span>
              <v-chip size="x-small" class="ml-2" variant="outlined">{{ b.audienceFilter }}</v-chip>
              <span v-if="b.propertyAddress" class="text-caption text-medium-emphasis ml-2">
                {{ b.propertyAddress }}
              </span>
            </div>
            <div class="d-flex gap-2">
              <v-chip size="x-small" color="success" variant="tonal">
                {{ b.sentCount }} sent
              </v-chip>
              <v-chip v-if="b.failedCount" size="x-small" color="error" variant="tonal">
                {{ b.failedCount }} failed
              </v-chip>
              <v-chip size="x-small" color="primary" variant="tonal">
                {{ b.recipientCount }} total
              </v-chip>
            </div>
          </div>
          <p class="text-body-2 text-medium-emphasis message-body">{{ b.body }}</p>
          <v-divider class="mt-3" />
        </div>
      </template>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listAllBroadcasts } from '../services/messagesService'

const broadcasts = ref([])
const loading    = ref(true)

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

onMounted(async () => {
  try {
    broadcasts.value = await listAllBroadcasts()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.broadcast-row {
  padding: 16px 20px;
}

.message-body {
  white-space: pre-wrap;
  max-height: 80px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
</style>
