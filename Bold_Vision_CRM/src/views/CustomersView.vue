<template>
  <div class="customers">
    <div class="header-row">
      <div class="heading">
        <v-icon size="38" color="black" class="heading-icon">mdi-account</v-icon>
        <h1 class="text-h4 font-weight-bold mb-1">Customers</h1>
      </div>

      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-account-plus"
        class="text-capitalize"
        @click="openAddCustomer"
      >
        Add New Customer
      </v-btn>
    </div>

    <BaseSearchBar
      v-model="searchQuery"
      class="mt-6"
      label="Search customers"
      placeholder="Search name, email, phone..."
    />

    <div class="customers-list mt-4">
      <div class="list-header text-body-2 text-uppercase text-medium-emphasis">
        <span>Name</span>
        <span>Phone</span>
        <span>Channel</span>
        <span>Category</span>
        <span>Follow-up cadence</span>
        <span class="text-right">Actions</span>
      </div>

      <template v-if="paginatedCustomers.length">
        <div v-for="customer in paginatedCustomers" :key="customer.id" class="list-row">
          <div class="cell name">
            <p class="title">{{ customer.name }}</p>
            <p class="muted">{{ customer.email }}</p>
          </div>
          <div class="cell">
            <span class="cell-label">Phone</span>
            {{ customer.phone }}
          </div>
          <div class="cell text-capitalize">
            <span class="cell-label">Channel</span>
            {{ customer.channel }}
          </div>
          <div class="cell">
            <span class="cell-label">Category</span>
            <v-chip :color="categoryColor(customer.category)" text-color="white" size="small">
              {{ customer.category }}
            </v-chip>
          </div>
          <div class="cell">
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
        <p v-else>No customers match your search.</p>
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
import { computed, ref, watch } from 'vue'
import { useCustomerStore } from '../stores/customerStore'
import BaseDialog from '../components/base/BaseDialog.vue'
import CustomerForm from '../components/customer/CustomerForm.vue'
import BasePaginationFooter from '../components/base/BasePaginationFooter.vue'
import BaseSearchBar from '../components/base/BaseSearchBar.vue'

const store = useCustomerStore()
const customers = computed(() => store.customers)

const showAddCustomer = ref(false)
const page = ref(1)
const itemsPerPage = 10
const searchQuery = ref('')

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

// pagination logic
const normalizedSearch = computed(() => searchQuery.value.trim().toLowerCase())

const filteredCustomers = computed(() => {
  if (!normalizedSearch.value) {
    return customers.value
  }

  return customers.value.filter((customer) => {
    const haystack = [
      customer.name,
      customer.email,
      customer.phone,
      customer.channel,
      customer.category,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedSearch.value)
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredCustomers.value.length / itemsPerPage) || 1))

const currentPage = computed({
  get() {
    return Math.min(Math.max(page.value, 1), pageCount.value)
  },
  set(value) {
    const parsed = Number(value) || 1
    page.value = Math.min(Math.max(parsed, 1), pageCount.value)
  },
})

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredCustomers.value.slice(start, start + itemsPerPage)
})

const rangeLabel = computed(() => {
  const total = filteredCustomers.value.length
  if (!total) {
    return normalizedSearch.value ? 'No matches' : '0 results'
  }

  const start = (currentPage.value - 1) * itemsPerPage + 1
  const end = Math.min(currentPage.value * itemsPerPage, total)
  const baseLabel = `${start}-${end} of ${total}`
  return normalizedSearch.value ? `${baseLabel} • filtered` : baseLabel
})

watch(
  () => filteredCustomers.value.length,
  () => {
    if (page.value > pageCount.value) {
      page.value = pageCount.value
    }
  },
)

watch(
  () => searchQuery.value,
  () => {
    page.value = 1
  },
)

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
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.heading-icon {
  line-height: 1;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.8rem;
  margin-bottom: 4px;
  color: #7c7c7c;
}

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
  background-color: #E1F5FE;
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

.actions {
  text-align: right;
}

.empty-state {
  padding: 40px 24px;
  text-align: center;
  color: #7c7c7c;
}

@media (max-width: 1024px) {
  .customers {
    padding-inline: 16px;
  }

  .heading h1 {
    font-size: 1.5rem;
  }

  .heading-icon {
    font-size: 28px;
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
}

@media (max-width: 640px) {
  .list-row {
    grid-template-columns: 1fr;
    padding: 12px 14px;
  }

  .list-row .cell {
    padding-right: 0;
  }

  .actions {
    text-align: left;
  }

  .actions .v-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
