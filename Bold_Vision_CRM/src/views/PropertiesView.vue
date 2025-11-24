<template>
  <div class="properties-view">
    <div class="properties-toolbar">
      <div>
        <p class="eyebrow">Portfolio overview</p>
        <h2 class="title">Properties</h2>
        <p class="supporting">{{ properties.length }} active listings</p>
      </div>

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

    <div class="properties-grid">
      <article v-for="property in properties" :key="property.id" class="property-card">
        <div class="card-photo">
          <img :src="property.mainPhoto" :alt="property.address" loading="lazy" />

          <div v-if="property.statusBadge" class="status-pill" :class="`status-${property.statusBadge.type}`">
            <span class="status-dot" />
            {{ property.statusBadge.label }}
          </div>

          <div class="photo-meta">
            <span class="price">{{ property.priceGuide }}</span>
          </div>
        </div>

        <div class="card-body">
          <div class="address">{{ property.address }}</div>
          <div class="suburb">{{ property.suburb }}, {{ property.state }} {{ property.postcode }}</div>

          <div class="property-stats">
            <div class="stat">
              <v-icon icon="mdi-bed-outline" size="18" />
              <span>{{ property.bedrooms }}</span>
            </div>
            <div class="stat">
              <v-icon icon="mdi-shower" size="18" />
              <span>{{ property.bathrooms }}</span>
            </div>
            <div class="stat">
              <v-icon icon="mdi-car-outline" size="18" />
              <span>{{ property.carSpaces }}</span>
            </div>
            <span class="dot">•</span>
            <div class="stat type">{{ property.type }}</div>
          </div>

          <div class="property-footer">
            <div class="meta">
              <span>{{ property.landSize }}</span>
              <span class="dot">•</span>
              <span>{{ property.daysOnMarket }} days on market</span>
            </div>

            <v-btn :to="`/properties/${property.id}`" variant="tonal" color="primary" class="text-capitalize">
              View details
            </v-btn>
          </div>
        </div>
      </article>
    </div>

    <BaseDialog
      v-model="showAddProperty"
      title="Add new property"
      confirm-text="Add property"
      @confirm="handleAddProperty"
      @cancel="resetNewProperty"
    >
      <PropertyForm v-model="newProperty" />
    </BaseDialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { usePropertyStore } from '../stores/propertyStore'
import BaseDialog from '../components/base/BaseDialog.vue'
import PropertyForm from '../components/properties/PropertiesForm.vue'

const propertyStore = usePropertyStore()
const properties = computed(() => propertyStore.properties)

const showAddProperty = ref(false)

const newProperty = ref({
  address: '',
  type: 'House',
  status: 'On Market',
  priceGuide: '',
  description: '',
  notes: '',
})

const resetNewProperty = () => {
  newProperty.value = {
    address: '',
    type: 'House',
    status: 'On Market',
    priceGuide: '',
    description: '',
    notes: '',
  }
}

function openAddProperty() {
  resetNewProperty()
  showAddProperty.value = true
}

function handleAddProperty() {
  if (!newProperty.value.address || !newProperty.value.type || !newProperty.value.status) {
    alert('Please fill in at least address, type, and status.')
    return
  }

  propertyStore.addProperty({ ...newProperty.value })
  resetNewProperty()
  showAddProperty.value = false
}
</script>

<style scoped>
.properties-view {
  width: 100%;
  max-width: none;
  margin: 0;
  padding-right: 0;
  padding-top: 0;
  padding-bottom: clamp(16px, 2vw, 32px);
}

.properties-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 24px;
}

@media (max-width: 640px) {
  .properties-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
