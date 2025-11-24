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

.eyebrow {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin-bottom: 4px;
}

.title {
  font-weight: 600;
  margin: 0;
}

.supporting {
  color: #64748b;
  margin-top: 4px;
}

.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  grid-auto-columns: minmax(260px, 1fr);
  max-width: 100%;
  gap: 20px;
}
@media (min-width: 1800px) {
  .properties-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

.property-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-photo {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.card-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-pill {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: white;
}

.status-pill .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  display: inline-flex;
}

.status-new {
  background-color: #0f9d58;
}

.status-under_offer {
  background-color: #fb8c00;
}

.status-sold {
  background-color: #6b7280;
}

.photo-meta {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: flex-end;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 10px rgba(15, 23, 42, 0.55);
}

.photo-meta .price {
  background: rgba(15, 23, 42, 0.4);
  padding: 4px 10px;
  border-radius: 999px;
}

.card-body {
  padding: 16px 18px 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.address {
  font-weight: 600;
  margin-bottom: 4px;
}

.suburb {
  color: #475569;
  margin-bottom: 14px;
}

.property-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}

.property-stats .stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #0f172a;
}

.property-stats .stat.type {
  text-transform: capitalize;
}

.dot {
  color: #94a3b8;
}

.property-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.property-footer .meta {
  color: #64748b;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .properties-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}

</style>
