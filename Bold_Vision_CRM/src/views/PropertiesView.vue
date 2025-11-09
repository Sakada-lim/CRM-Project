<template>
  <div>
    <v-row class="mb-4" align="center" justify="space-between">
      <v-col cols="12" md="6">
        <h2>Property Stock</h2>
        <p class="text-body-2">
          Add or update properties in stock. In production, new listings will
          trigger SMS/email/Telegram alerts to matching customers.
        </p>
      </v-col>
    </v-row>

    <!-- New property form -->
    <v-card class="mb-6" elevation="2">
      <v-card-title>New Property</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.code"
                label="Property code"
                hint="Internal code, e.g. PROP-001"
              />
            </v-col>

            <v-col cols="12" md="8">
              <v-text-field v-model="form.address" label="Address" required />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="form.type"
                :items="['House', 'Unit', 'Townhouse', 'Land']"
                label="Type"
                required
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="form.status"
                :items="['New', 'On Market', 'Sold']"
                label="Status"
                required
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.priceGuide"
                label="Price guide"
                hint="e.g. $850k–$900k"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea v-model="form.notes" label="Notes" rows="2" />
            </v-col>
          </v-row>

          <v-btn type="submit" color="primary" class="mt-3" @click="simulateAlert">
            Add property (and simulate alert)
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Existing properties table -->
    <v-card elevation="2">
      <v-card-title>Current Stock</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="properties"
          :items-per-page="5"
        >
          
                <template #item.status="{ item }">
                <v-chip :color="statusColor(item.status)" text-color="white" size="small">
                  {{ item.status }}
                </v-chip>
                </template>

                <template #item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
                </template>
                <!-- New: Actions column -->
                <template #item.actions="{ item }">
                <v-btn
                  :to="`/properties/${item.id}`"
                  text
                  small
                  color="primary"
                >
                  View / Edit
                </v-btn>
                </template>
        </v-data-table>
      </v-card-text>

      <v-card-subtitle class="text-body-2 pa-4">
        <strong>Demo note:</strong> In production, saving a "New" or
        "On Market" property will trigger:
        <ul class="ma-0 pl-4">
          <li>SMS to Hot/Warm buyers initially</li>
          <li>Later – filtered by budget, location, and buyer category</li>
        </ul>
      </v-card-subtitle>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePropertyStore } from '../stores/propertyStore';
import { useCustomerStore } from '../stores/customerStore';

const propertyStore = usePropertyStore();
const customerStore = useCustomerStore();

const form = ref({
  code: '',
  address: '',
  type: 'House',
  status: 'New',
  priceGuide: '',
  notes: '',

});

const headers = [
  { title: 'Code', key: 'code' },
  { title: 'Address', key: 'address' },
  { title: 'Type', key: 'type' },
  { title: 'Status', key: 'status' },
  { title: 'Price guide', key: 'priceGuide' },
  { title: 'Created', key: 'createdAt' },
  { title: 'Actions', key: 'actions', sortable: false },
];

const properties = computed(() => propertyStore.properties);

function handleSubmit() {
  if (!form.value.address || !form.value.type || !form.value.status) {
    alert('Please fill in at least address, type, and status.');
    return;
  }

  propertyStore.addProperty({ ...form.value });

  form.value = {
    code: '',
    address: '',
    type: 'House',
    status: 'New',
    priceGuide: '',
    notes: '',
  };
}

function simulateAlert() {
  const hotOrWarm = customerStore.customers.filter((c) =>
    ['Hot', 'Warm'].includes(c.category)
  );
  alert(
    `Demo: this would trigger SMS alerts to ${hotOrWarm.length} Hot/Warm customers.`
  );
}

function statusColor(status) {
  switch (status) {
    case 'New':
      return 'green';
    case 'On Market':
      return 'blue';
    case 'Sold':
      return 'grey';
    default:
      return 'blue';
  }
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString();
}
</script>
