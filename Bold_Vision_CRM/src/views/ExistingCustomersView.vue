<template>
  <div>
    <!-- Existing customers table -->
    <v-card elevation="2">
      <v-card-title>Existing Customers</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="customers"
          :items-per-page="5"
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
            <v-btn
                  :to="`/customers/${item.id}`"
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
        <strong>Demo note:</strong> In production, this table will drive automation:
        <ul class="ma-0 pl-4">
          <li>Hot → follow up every 3 months (SMS initially)</li>
          <li>Warm → every 6 months</li>
          <li>Cold → every 12 months</li>
        </ul>
      </v-card-subtitle>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCustomerStore } from '../stores/customerStore';

const store = useCustomerStore();

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Phone', key: 'phone' },
  { title: 'Channel', key: 'channel' },
  { title: 'Category', key: 'category' },
  { title: 'Property', key: 'interestedProperty' },
  { title: 'Follow-up cadence', key: 'followUpCadence' },
  { title: 'Created', key: 'createdAt' },
  { title: 'Actions', key: 'actions', sortable: false },
];

const customers = computed(() => store.customers);

function categoryColor(cat) {
  switch (cat) {
    case 'Hot':
      return 'red';
    case 'Warm':
      return 'orange';
    default:
      return 'blue';
  }
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString();
}
</script>
