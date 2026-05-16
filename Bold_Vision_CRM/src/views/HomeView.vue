<template>
  <div class="home">
    <div class="home-header mb-6">
      <h2>Dashboard</h2>
      <p class="text-body-2 text-medium-emphasis mt-1">
        {{ today }}
      </p>
    </div>

    <!-- Follow-up summary -->
    <v-card elevation="4" class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-bell-ring-outline</v-icon>
        Follow-ups
      </v-card-title>

      <v-card-text>
        <div v-if="overdueCount > 0 || unscheduledCount > 0" class="summary-stats">
          <div v-if="overdueCount > 0" class="summary-stat summary-stat--error">
            <p class="summary-stat__count">{{ overdueCount }}</p>
            <p class="summary-stat__label">Overdue</p>
          </div>
          <div v-if="unscheduledCount > 0" class="summary-stat summary-stat--warning">
            <p class="summary-stat__count">{{ unscheduledCount }}</p>
            <p class="summary-stat__label">Unscheduled</p>
          </div>
          <div v-if="todayCount > 0" class="summary-stat summary-stat--primary">
            <p class="summary-stat__count">{{ todayCount }}</p>
            <p class="summary-stat__label">Today</p>
          </div>
        </div>

        <div v-else class="all-clear">
          <v-icon size="40" color="success" class="mb-2">mdi-check-circle-outline</v-icon>
          <p class="text-body-1 font-weight-medium">All caught up!</p>
          <p class="text-body-2 text-medium-emphasis">No overdue or unscheduled customers.</p>
        </div>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn color="primary" variant="outlined" :to="{ name: 'follow-ups' }" append-icon="mdi-arrow-right">
          View follow-ups
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCustomerStore } from '../stores/customerStore'
import { useCustomerFollowups } from '../composables/useCustomerFollowups'

const store = useCustomerStore()
const customers = computed(() => store.customers)

const { overdueCount, unscheduledCount, days } = useCustomerFollowups(customers)

const today = new Date().toLocaleDateString('en-AU', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const todayCount = computed(() => days.value[0]?.customers.length ?? 0)
</script>

<style scoped>
.home-header h2 {
  font-size: 1.6rem;
  font-weight: 700;
}

.summary-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 24px;
  border-radius: 12px;
  min-width: 90px;
}

.summary-stat--error   { background: #fee2e2; color: #991b1b; }
.summary-stat--warning { background: #ffedd5; color: #9a3412; }
.summary-stat--primary { background: #dbeafe; color: #1e3a8a; }

.summary-stat__count {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

.summary-stat__label {
  font-size: 0.8rem;
  font-weight: 600;
  margin: 4px 0 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.all-clear {
  padding: 16px 0;
  text-align: center;
}
</style>
