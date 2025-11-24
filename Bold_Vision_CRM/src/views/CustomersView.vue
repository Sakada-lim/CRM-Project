<template>
  <div class="customers">
    <CustomersToolbar
      v-model:search="searchQuery"
      v-model:filters="activeFilters"
      :available-filters="filterDefinitions"
      title="Customers"
      icon="mdi-account"
      action-icon="mdi-account-plus"
      @add="openAddCustomer"
    />

    <div class="customers-list mt-4">
      <div class="list-header text-body-2 text-uppercase text-medium-emphasis">
        <span>Name</span>
        <span>Phone</span>
        <span>Channel</span>
        <span>Category</span>
        <span class="followup-col">Follow-up cadence</span>
        <span class="text-center">Actions</span>
      </div>

      <template v-if="paginatedCustomers.length">
        <div v-for="customer in paginatedCustomers" :key="customer.id" class="list-row">
          <div class="cell name">
            <p class="title">{{ customer.name }}</p>
            <p class="muted">{{ customer.email }}</p>
          </div>
          <div class="cell phone">
            <span class="cell-label">Phone</span>
            {{ customer.phone }}
          </div>
          <div class="cell channel text-capitalize">
            <span class="cell-label">Channel</span>
            {{ customer.channel }}
          </div>
          <div class="cell category">
            <span class="cell-label">Category</span>
            <v-chip
              :color="categoryColor(customer.category)"
              text-color="white"
              size="small"
              class="category-chip"
            >
              {{ customer.category }}
            </v-chip>
          </div>
          <div class="cell followup-col">
            <span class="cell-label">Follow-up Cadence</span>
            <v-chip size="small" variant="outlined" class="text-capitalize">
              {{ customer.followUpCadence }}
            </v-chip>
          </div>
          <div class="cell actions">
            <span class="cell-label">Actions</span>
            <v-btn
              :to="`/customers/${customer.id}`"
              variant="tonal"
              color="primary"
              class="text-capitalize"
            >
              View / Edit
            </v-btn>
          </div>
        </div>
      </template>

      <div v-else class="empty-state">
        <p v-if="!customers.length">No customers yet.</p>
        <p v-else-if="isFilteredView">No customers match your current filters.</p>
        <p v-else>No customers available.</p>
      </div>
    </div>

    <BasePaginationFooter
      v-if="filteredCustomers.length"
      v-model="currentPage"
      :length="pageCount"
      :total-visible="4"
      :label="rangeLabel"
    />

    <BaseDialog
      v-model="showAddCustomer"
      title="Add new customer"
      confirm-text="Add customer"
      @confirm="handleAddCustomer"
      @cancel="resetNewCustomer"
    >
      <CustomerForm v-model="newCustomer" />
    </BaseDialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCustomerStore } from '../stores/customerStore'
import BaseDialog from '../components/base/BaseDialog.vue'
import CustomerForm from '../components/customer/CustomerForm.vue'
import BasePaginationFooter from '../components/base/BasePaginationFooter.vue'
import CustomersToolbar from '../components/customer/CustomersToolbar.vue'
import { customerFilterDefinitions as filterDefinitions } from '../config/filterDefinitions'
import { useCustomerFilters } from '../composables/useCustomerFilters'
import { useResponsivePageSize } from '../composables/useResponsivePageSize'

const store = useCustomerStore()
const customers = computed(() => store.customers)

const showAddCustomer = ref(false)
const { pageSize: itemsPerPage } = useResponsivePageSize({
  breakpoints: [
    { minWidth: 901, size: 10 },
    { minWidth: 0, size: 5 },
  ],
  fallbackSize: 5,
})
const searchQuery = ref('')
const activeFilters = ref([])

const filterPredicates = {
  category: (customer, filter) => {
    const currentValue = (customer.category || '').toLowerCase()
    const targetValue = String(filter?.value ?? '').toLowerCase()
    if (!targetValue) return true
    return filter?.operator === 'is_not'
      ? currentValue !== targetValue
      : currentValue === targetValue
  },
  channel: (customer, filter) => {
    const currentValue = (customer.channel || '').toLowerCase()
    const targetValue = String(filter?.value ?? '').toLowerCase()
    if (!targetValue) return true
    return filter?.operator === 'is_not'
      ? currentValue !== targetValue
      : currentValue === targetValue
  },
}

const {
  currentPage,
  pageCount,
  paginatedCustomers,
  filteredCustomers,
  rangeLabel,
  isFilteredView,
} = useCustomerFilters({
  customers,
  searchQuery,
  activeFilters,
  filterPredicates,
  itemsPerPage,
})

//Customer form data
const newCustomer = ref({
  name: '',
  phone: '',
  email: '',
  channel: 'Call',
  category: 'Cold',
  interestedProperty: '',
  notes: '',
})

function openAddCustomer() {
  resetNewCustomer()
  showAddCustomer.value = true
}

function resetNewCustomer() {
  newCustomer.value = {
    name: '',
    phone: '',
    email: '',
    channel: 'Call',
    category: 'Cold',
    interestedProperty: '',
    notes: '',
  }
}

function handleAddCustomer() {
  if (!newCustomer.value.name || !newCustomer.value.phone || !newCustomer.value.category) {
    alert('Please fill in name, phone, and category.')
    return
  }

  store.addCustomer({ ...newCustomer.value })
  showAddCustomer.value = false
  resetNewCustomer()
}

function categoryColor(cat) {
  switch (cat) {
    case 'Hot':
      return 'red'
    case 'Warm':
      return 'orange'
    default:
      return 'blue'
  }
}
</script>

<style scoped>
.customers-list {
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.list-header,
.list-row {
  display: grid;
  grid-template-columns: 1.8fr 1fr 1fr 1fr 1.2fr 1fr;
  gap: 16px;
  padding: 16px clamp(12px, 2.5vw, 24px);
  align-items: center;
}

.list-header {
  letter-spacing: 0.08em;
  border-bottom: 1px solid #ebeef4;
  background-color: #e1f5fe;
  border-radius: 10px;
}

.list-row {
  border-bottom: 1px solid #edeff3;
  background-color: white;
}

.list-row:last-of-type {
  border-bottom: none;
}

.cell {
  font-size: 0.95rem;
}

.cell-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin-bottom: 4px;
  display: none;
}

.cell.name .title {
  font-weight: 600;
  margin-bottom: 4px;
}

.cell.name .muted {
  color: #7c7c7c;
  font-size: 0.85rem;
}

.cell.category .category-chip {
  font-weight: 600;
}

.actions {
  text-align: center;
}

.followup-col {
  display: block;
}

.list-row .followup-col {
  text-align: left;
}

@media (max-width: 1200px) {
  .list-header,
  .list-row {
    grid-template-columns: 1.8fr 1fr 1fr 1fr 1fr;
  }

  .followup-col {
    display: none;
  }
}

.empty-state {
  padding: 40px 24px;
  text-align: center;
  color: #7c7c7c;
}

@media (max-width: 900px) {
  .customers {
    padding-inline: 16px;
  }

  .list-header {
    display: none;
  }

  .list-row {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    padding: 16px 18px;
    gap: 16px;
  }

  .list-row .cell.name {
    grid-column: 1 / -1;
  }

  .list-row .cell {
    padding-right: 8px;
  }

  .cell-label {
    display: block;
  }

  .list-header,
  .list-row {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    padding-inline: 12px;
  }

  .list-row .cell {
    font-size: 0.9rem;
  }

  .list-row .cell.name .title {
    font-size: 1rem;
  }

  .actions {
    text-align: left;
  }

  .actions .v-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .customers-list {
    overflow-x: auto;
    padding-bottom: 12px;
  }

  .list-row {
    position: relative;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 12px 14px 16px;
    min-width: 320px;
    gap: 12px;
  }

  .list-row .cell {
    padding-right: 0;
    grid-column: 1 / -1;
  }

  .list-row .cell.name {
    padding-right: 80px;
  }

  .list-row .cell.phone,
  .list-row .cell.channel,
  .list-row .cell.actions {
    grid-column: span 1;
  }

  .list-row .cell.channel {
    text-transform: capitalize;
  }

  .list-row .cell.actions {
    align-self: flex-start;
    justify-self: stretch;
    padding-right: 0;
  }

  .list-row .cell.actions .cell-label {
    display: none;
  }

  .list-row .cell.category {
    position: absolute;
    top: 12px;
    right: 14px;
    grid-column: auto;
    padding-right: 0;
    text-align: right;
    z-index: 1;
  }

  .list-row .cell.category .cell-label {
    display: none;
  }

  .list-row .cell.category .category-chip {
    font-size: 0.75rem;
  }

  .actions {
    text-align: left;
  }

  .actions .v-btn {
    width: 100%;
    min-width: 0;
    justify-content: center;
  }
}
</style>
