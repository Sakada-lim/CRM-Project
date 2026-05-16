<template>
  <div class="home">
    <div class="home-header mb-6">
      <h2>Dashboard</h2>
      <p class="text-body-2 text-medium-emphasis mt-1">
        {{ today }}
      </p>
    </div>

    <!-- Follow-up summary -->
    <v-card elevation="4" class="mb-6">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-bell-ring-outline</v-icon>
        Follow-ups needed
      </v-card-title>

      <v-card-text>
        <div v-if="overdueCount > 0">
          <p class="text-body-1 mb-4">
            <strong>{{ overdueCount }}</strong> customer{{ overdueCount === 1 ? '' : 's' }}
            {{ overdueCount === 1 ? 'is' : 'are' }} overdue for contact.
          </p>

          <div class="category-summary">
            <div
              v-for="item in categorySummary"
              :key="item.label"
              class="category-summary__item"
              :class="`category-summary__item--${item.label.toLowerCase()}`"
            >
              <p class="category-summary__count">{{ item.count }}</p>
              <p class="category-summary__label">{{ item.label }}</p>
            </div>
          </div>
        </div>

        <div v-else class="all-clear">
          <v-icon size="40" color="success" class="mb-2">mdi-check-circle-outline</v-icon>
          <p class="text-body-1 font-weight-medium">All caught up!</p>
          <p class="text-body-2 text-medium-emphasis">No customers are overdue for contact.</p>
        </div>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          :to="{ name: 'follow-ups' }"
          append-icon="mdi-arrow-right"
        >
          View follow-ups
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Approaching (not yet overdue) -->
    <v-card v-if="approachingCount > 0" elevation="2" variant="tonal" color="warning">
      <v-card-text class="d-flex align-center">
        <v-icon class="mr-3" color="warning">mdi-clock-outline</v-icon>
        <span class="text-body-2">
          <strong>{{ approachingCount }}</strong> more customer{{ approachingCount === 1 ? '' : 's' }}
          approaching their due date in the next 30 days.
        </span>
        <v-spacer />
        <v-btn size="small" variant="text" :to="{ name: 'follow-ups' }">View</v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCustomerStore } from '../stores/customerStore'
import { useCustomerFollowups } from '../composables/useCustomerFollowups'
import { isOverdue } from '../utils/followUp'

const store = useCustomerStore()
const customers = computed(() => store.customers)

const { hot, warm, cold, overdueCount, hotOverdueCount, warmOverdueCount, coldOverdueCount } =
  useCustomerFollowups(customers)

const today = new Date().toLocaleDateString('en-AU', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const categorySummary = computed(() => [
  { label: 'Hot', count: hotOverdueCount.value },
  { label: 'Warm', count: warmOverdueCount.value },
  { label: 'Cold', count: coldOverdueCount.value },
].filter((item) => item.count > 0))

const approachingCount = computed(() =>
  [...hot.value, ...warm.value, ...cold.value].filter((c) => !isOverdue(c)).length,
)
</script>

<style scoped>
.home-header h2 {
  font-size: 1.6rem;
  font-weight: 700;
}

.category-summary {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.category-summary__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 24px;
  border-radius: 12px;
  min-width: 90px;
  background: #f1f5f9;
}

.category-summary__item--hot {
  background: #fee2e2;
  color: #991b1b;
}

.category-summary__item--warm {
  background: #ffedd5;
  color: #9a3412;
}

.category-summary__item--cold {
  background: #dbeafe;
  color: #1e3a8a;
}

.category-summary__count {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

.category-summary__label {
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
