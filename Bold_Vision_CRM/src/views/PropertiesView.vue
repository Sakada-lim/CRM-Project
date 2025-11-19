<template>
  <div>
    <!-- Existing properties table -->
    <v-card elevation="2">
      <!-- Header row -->
      <div class="d-flex justify-space-between align-center mr-4 ml-4 mt-4">
        <h2 class="text-h5 font-weight-medium">Existing Properties</h2>

        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-home-plus"
          class="text-capitalize"
          @click="openAddProperty"
        >
          Add New Property
        </v-btn>
      </div>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="properties"
          :items-per-page="5"
          class="elevation-1"
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

      <BaseDialog
        v-model="showAddProperty"
        title="Add new property"
        confirm-text="Add property"
        @confirm="handleAddProperty"
        @cancel="resetNewProperty"
      >
        <PropertyForm v-model="newProperty" />
      </BaseDialog>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePropertyStore } from '../stores/propertyStore';
import BaseDialog from '../components/base/BaseDialog.vue';
import PropertyForm from '../components/properties/PropertiesForm.vue';

const propertyStore = usePropertyStore();
const properties = computed(() => propertyStore.properties);

const showAddProperty = ref(false);

const newProperty = ref({
  address: '',
  code: '',
  type: 'House',
  status: 'New',
  priceGuide: '',
  description: '',
  notes: '',
});

const resetNewProperty = () => {
  newProperty.value = {
    code: '',
    address: '',
    type: 'House',
    status: 'New',
    priceGuide: '',
    description: '',
    notes: '',
  };
};

function openAddProperty() {
  resetNewProperty();
  showAddProperty.value = true;
}

function handleAddProperty() {
  if (!newProperty.value.address || !newProperty.value.type || !newProperty.value.status) {
    alert('Please fill in at least address, type, and status.');
    return;
  }

  propertyStore.addProperty({ ...newProperty.value });
  resetNewProperty();
  showAddProperty.value = false;
}
const headers = [
  { title: 'Code', key: 'code' },
  { title: 'Address', key: 'address' },
  { title: 'Type', key: 'type' },
  { title: 'Status', key: 'status' },
  { title: 'Price guide', key: 'priceGuide' },
  { title: 'Created', key: 'createdAt' },
  { title: 'Actions', key: 'actions', sortable: false },
];

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
