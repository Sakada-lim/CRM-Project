<template>
  <div v-if="propertyFound">
    <v-breadcrumbs :items="breadcrumbs" class="mb-4 page-breadcrumbs" />

    <h2 class="mb-2">
      {{ editable.address || 'Property details' }}
    </h2>
    <div class="property-meta mb-6">
      <span>Code: <strong>{{ editable.code || 'N/A' }}</strong></span>
      <span>Type: <strong>{{ editable.type }}</strong></span>
    </div>

    <v-row>
      <!-- Left: main info -->
      <v-col cols="12" md="8">
        <v-card class="mb-4" elevation="4">
          <v-card-title>Overview</v-card-title>
          <v-card-text>
            <PropertyForm v-model="editable" />
          </v-card-text>

          <v-card-actions class="px-4 pb-4">
            <v-spacer />
            <v-btn variant="outlined" color="grey-darken-1" class="mr-2" @click="resetChanges">
              Reset
            </v-btn>
            <v-btn variant="outlined" color="primary" @click="saveChanges"> Save changes </v-btn>
          </v-card-actions>
        </v-card>

        <v-snackbar v-model="snackbar" timeout="2000" color="success">
          Changes saved successfully.
        </v-snackbar>
      </v-col>

      <!-- Right: summary + media -->
      <v-col cols="12" md="4">
        <v-card elevation="4" class="mb-4">
          <v-card-title>Quick summary</v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-2">
              Created: <strong>{{ createdAtFormatted }}</strong>
            </p>
            <p class="text-body-2 mb-2">
              Address:
              <strong>{{ editable.address || 'N/A' }}</strong>
              <span v-if="editable.suburb">
                · {{ editable.suburb }}, {{ editable.state }} {{ editable.postcode }}
              </span>
            </p>
            <p class="text-body-2 mb-2">
              Status:
              <v-chip :color="statusColor(editable.status)" text-color="white" size="small">
                {{ editable.status }}
              </v-chip>
            </p>
            <p class="text-body-2 mb-2">
              Price guide: <strong>{{ editable.priceGuide || 'N/A' }}</strong>
            </p>

            <div class="stats-summary" aria-label="Key property stats">
              <div v-for="stat in keyStats" :key="stat.label" class="stat-item">
                <v-icon :icon="stat.icon" size="20" class="mr-2" />
                <div>
                  <p class="stat-label">{{ stat.label }}</p>
                  <p class="stat-value">{{ stat.value }}</p>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Photos -->
        <v-card elevation="4" class="mb-4">
          <v-card-title>Photos</v-card-title>
          <v-card-text>
            <v-alert v-if="photoError" type="error" density="compact" class="mb-3">
              {{ photoError }}
            </v-alert>
            <PhotoUploader
              :items="original.photos"
              :main-photo-path="original.mainPhoto"
              kind="photo"
              :disabled="photoUploading"
              @add="(files) => handleAdd(files, 'photo')"
              @remove="handleRemove"
              @reorder="handleReorder"
              @select="handleSelect"
            />
          </v-card-text>
        </v-card>

        <!-- Floorplans -->
        <v-card elevation="4">
          <v-card-title>Floor plans</v-card-title>
          <v-card-text>
            <PhotoUploader
              :items="original.floorplans"
              kind="floorplan"
              @add="(files) => handleAdd(files, 'floorplan')"
              @remove="handleRemove"
              @reorder="handleReorder"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Interested customers (full-width Kanban) -->
    <PropertyInterestsPanel :property-id="id" class="mt-2" />
  </div>

  <div v-else>
    <h2>Property not found</h2>
    <p class="text-body-2 mb-4">The requested property does not exist. It may have been removed.</p>
    <v-btn color="primary" @click="goBack"> Back to properties </v-btn>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePropertyStore } from '../stores/propertyStore'
import { createEmptyPropertyDraft } from '../constants/propertyDefaults'
import PropertyForm from '../components/properties/PropertiesForm.vue'
import PhotoUploader from '../components/base/PhotoUploader.vue'
import PropertyInterestsPanel from '../components/properties/PropertyInterestsPanel.vue'

const route = useRoute()
const router = useRouter()
const propertyStore = usePropertyStore()

const id = route.params.id

const original = computed(() => propertyStore.properties.find((p) => p.id === id))
const propertyFound = computed(() => !!original.value)

const editable = ref(createEmptyPropertyDraft())
const snackbar = ref(false)
const photoUploading = ref(false)
const photoError = ref(null)

watch(
  original,
  (value) => {
    if (value) {
      editable.value = { ...createEmptyPropertyDraft(), ...value }
    } else {
      editable.value = createEmptyPropertyDraft()
    }
  },
  { immediate: true },
)

const breadcrumbs = computed(() => [
  { title: 'Properties', to: { name: 'properties' } },
  { title: editable.value.address || 'Property details', disabled: true },
])

const createdAtFormatted = computed(() => {
  if (!editable.value.createdAt) return 'N/A'
  return new Date(editable.value.createdAt).toLocaleDateString()
})

const keyStats = computed(() => {
  const landSizeLabel = editable.value.landSize || formatAreaDisplay(editable.value.landSizeSqm)
  const houseSizeLabel = editable.value.houseSize || formatAreaDisplay(editable.value.houseSizeSqm)
  return [
    { label: 'Bedrooms', icon: 'mdi-bed-outline', value: numberOrDash(editable.value.bedrooms) },
    { label: 'Bathrooms', icon: 'mdi-shower', value: numberOrDash(editable.value.bathrooms) },
    { label: 'Car spaces', icon: 'mdi-car-outline', value: numberOrDash(editable.value.carSpaces) },
    { label: 'Land size', icon: 'mdi-ruler-square', value: textOrDash(landSizeLabel) },
    { label: 'House size', icon: 'mdi-home-floor-1', value: textOrDash(houseSizeLabel) },
  ]
})

function statusColor(status) {
  switch (status) {
    case 'On Market': return 'primary'
    case 'Under Offer': return 'amber-darken-2'
    case 'Sold': return 'grey-darken-1'
    default: return 'green-darken-1'
  }
}

function saveChanges() {
  if (!propertyFound.value) return
  propertyStore.updateProperty(id, { ...editable.value })
  snackbar.value = true
}

function resetChanges() {
  if (original.value) {
    editable.value = { ...createEmptyPropertyDraft(), ...original.value }
  }
}

function goBack() {
  router.push({ name: 'properties' })
}

// ── photo event handlers ───────────────────────────────────────

async function handleAdd(files, kind) {
  photoError.value = null
  photoUploading.value = true
  try {
    for (const file of files) {
      await propertyStore.uploadPhoto(id, file, kind)
    }
  } catch (e) {
    photoError.value = `Upload failed: ${e.message}`
  } finally {
    photoUploading.value = false
  }
}

async function handleRemove(photoId) {
  photoError.value = null
  try {
    await propertyStore.removePhoto(id, photoId)
  } catch (e) {
    photoError.value = `Delete failed: ${e.message}`
  }
}

async function handleReorder(orderedIds) {
  try {
    await propertyStore.reorderPhotos(id, orderedIds)
  } catch (e) {
    photoError.value = `Reorder failed: ${e.message}`
  }
}

async function handleSelect(storagePath) {
  try {
    await propertyStore.setMainPhoto(id, storagePath)
  } catch (e) {
    photoError.value = `Failed to set main photo: ${e.message}`
  }
}

// ── helpers ────────────────────────────────────────────────────

function numberOrDash(value) {
  if (value === 0) return '0'
  if (value == null || value === '') return '—'
  return `${value}`
}

function textOrDash(value) {
  return value && value !== '' ? value : '—'
}

function formatAreaDisplay(value) {
  if (value == null || value === '') return ''
  return `${value} m²`
}
</script>

<style scoped>
.page-breadcrumbs {
  padding-left: 0;
  padding-right: 0;
}

.property-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.95rem;
  color: var(--bv-text-muted, #475569);
}

.property-meta strong {
  color: var(--bv-text-strong, #0f172a);
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin: 16px 0 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--bv-surface-muted, #f1f5f9);
}

.stat-label {
  margin: 0;
  font-size: 0.8rem;
  color: var(--bv-text-muted, #64748b);
}

.stat-value {
  margin: 0;
  font-weight: 600;
  font-size: 1rem;
}
</style>
