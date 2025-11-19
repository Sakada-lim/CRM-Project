<template>
  <div>
    <!-- Existing customers table -->
    <v-card elevation="4">
      <!-- Header row -->
      <div class="d-flex justify-space-between align-center mr-4 ml-4 mt-4">
        <h2 class="text-h5 font-weight-medium">Existing Customers</h2>

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

      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="customers"
          :items-per-page="10"
          class="elevation-1"
        >
          <template #item.category="{ item }">
            <v-chip :color="categoryColor(item.category)" text-color="white" size="small">
              {{ item.category }}
            </v-chip>
          </template>

          <template #item.followUpCadence="{ item }">
            <v-chip size="small" variant="outlined">
              {{ item.followUpCadence }}
            </v-chip>
          </template>

          <template #item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template #item.actions="{ item }">
            <v-btn :to="`/customers/${item.id}`" text small color="primary"> View / Edit </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
      <BaseDialog
        v-model="showAddCustomer"
        title="Add new customer"
        confirm-text="Add customer"
        @confirm="handleAddCustomer"
        @cancel="resetNewCustomer"
      >
        <CustomerForm v-model="newCustomer" />
      </BaseDialog>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCustomerStore } from '../stores/customerStore'
import BaseDialog from '../components/base/BaseDialog.vue'
import CustomerForm from '../components/customer/CustomerForm.vue'

const store = useCustomerStore()
const customers = computed(() => store.customers)

const showAddCustomer = ref(false)

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

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Phone', key: 'phone' },
  { title: 'Channel', key: 'channel' },
  { title: 'Category', key: 'category' },
  { title: 'Property', key: 'interestedProperty' },
  { title: 'Follow-up cadence', key: 'followUpCadence' },
  { title: 'Created', key: 'createdAt' },
  { title: 'Actions', key: 'actions', sortable: false },
]

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

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString()
}
</script>
