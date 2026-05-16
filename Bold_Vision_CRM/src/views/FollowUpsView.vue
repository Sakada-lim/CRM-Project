<template>
  <div class="followups">
    <div class="followups-header mb-6">
      <h2>Follow-ups</h2>
      <p class="text-body-2 text-medium-emphasis mt-1">
        {{ overdueCount }} customer{{ overdueCount === 1 ? '' : 's' }} overdue for contact
      </p>
    </div>

    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="Hot">
        <v-icon start>mdi-fire</v-icon>
        Hot
        <v-badge v-if="hot.length" :content="hot.length" color="red" inline class="ml-2" />
      </v-tab>
      <v-tab value="Warm">
        <v-icon start>mdi-weather-sunny</v-icon>
        Warm
        <v-badge v-if="warm.length" :content="warm.length" color="orange" inline class="ml-2" />
      </v-tab>
      <v-tab value="Cold">
        <v-icon start>mdi-snowflake</v-icon>
        Cold
        <v-badge v-if="cold.length" :content="cold.length" color="blue" inline class="ml-2" />
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item v-for="(group, level) in { Hot: hot, Warm: warm, Cold: cold }" :key="level" :value="level">
        <div v-if="group.length" class="followup-list">
          <div
            v-for="customer in group"
            :key="customer.id"
            class="followup-card"
          >
            <div class="followup-card__info">
              <p class="followup-card__name">{{ customer.name }}</p>
              <p class="followup-card__sub">{{ customer.phone || customer.email || 'No contact info' }}</p>
            </div>

            <div class="followup-card__status">
              <v-chip
                :color="overdueChipColor(customer)"
                size="small"
                variant="tonal"
              >
                {{ overdueLabel(customer) }}
              </v-chip>
            </div>

            <div class="followup-card__actions">
              <v-btn
                size="small"
                variant="outlined"
                color="primary"
                class="mr-2"
                @click="markContacted(customer)"
              >
                Mark contacted
              </v-btn>
              <v-btn
                size="small"
                variant="tonal"
                color="primary"
                :to="`/customers/${customer.id}`"
              >
                View
              </v-btn>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <v-icon size="48" color="success" class="mb-3">mdi-check-circle-outline</v-icon>
          <p class="text-body-1 font-weight-medium">All {{ level }} customers are up to date.</p>
          <p class="text-body-2 text-medium-emphasis">No follow-ups needed right now.</p>
        </div>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCustomerStore } from '../stores/customerStore'
import { useCustomerFollowups } from '../composables/useCustomerFollowups'
import { daysOverdue, isOverdue } from '../utils/followUp'

const store = useCustomerStore()
const customers = computed(() => store.customers)

const activeTab = ref('Hot')

const { hot, warm, cold, overdueCount } = useCustomerFollowups(customers)

function overdueLabel(customer) {
  const days = daysOverdue(customer)
  if (days === Infinity) return 'Never contacted'
  if (days >= 0) return `${days} day${days === 1 ? '' : 's'} overdue`
  return `Due in ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`
}

function overdueChipColor(customer) {
  const days = daysOverdue(customer)
  if (isOverdue(customer) || days === Infinity) return 'error'
  return 'warning'
}

async function markContacted(customer) {
  await store.setLastContacted(customer.id, new Date().toISOString())
}
</script>

<style scoped>
.followups-header h2 {
  font-size: 1.6rem;
  font-weight: 700;
}

.followup-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.followup-card {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.followup-card__name {
  font-weight: 600;
  font-size: 0.95rem;
  margin: 0 0 2px;
}

.followup-card__sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.followup-card__status {
  white-space: nowrap;
}

.followup-card__actions {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.empty-state {
  padding: 64px 24px;
  text-align: center;
  color: #475569;
}

@media (max-width: 640px) {
  .followup-card {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
  }

  .followup-card__status {
    grid-column: 2;
    grid-row: 1;
  }

  .followup-card__info {
    grid-column: 1;
    grid-row: 1;
  }

  .followup-card__actions {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .followup-card__actions .v-btn {
    flex: 1;
  }
}
</style>
