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

      <!-- Right: quick summary card -->
      <v-col cols="12" md="4">
        <v-card elevation="4">
          <v-card-title>Quick summary</v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-2">
              Created: <strong>{{ createdAtFormatted }}</strong>
            </p>
            <p class="text-body-2 mb-2">
              Address:
              <strong>
                {{ editable.address || 'N/A' }}
              </strong>
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

            <p class="text-body-2">In the full system, alerts sent to customers would include:</p>
            <ul class="text-body-2 pl-4">
              <li>Address and property type</li>
              <li>Price guide (if set)</li>
              <li>Main image</li>
              <li>Optional link to floor plan</li>
            </ul>
          </v-card-text>
        </v-card>

        <!-- Gallery card -->
        <v-card class="mt-4" elevation="4">
          <v-card-title>Gallery</v-card-title>
          <v-card-text>
            <div v-if="editable.gallery && editable.gallery.length" class="mb-4">
              <v-carousel hide-delimiters height="220">
                <v-carousel-item v-for="(url, index) in editable.gallery" :key="index">
                  <v-img
                    :src="url"
                    cover
                    height="220"
                    class="cursor-pointer"
                    @click="openImage(index)"
                  />
                </v-carousel-item>
              </v-carousel>
            </div>

            <p v-else class="text-caption text-disabled mb-4">
              No images or floor plans yet. Add some below.
            </p>

            <!-- Hidden native file input -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              class="d-none"
              @change="onFileChange"
            />

            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-image-plus"
              @click="triggerFilePicker"
            >
              Add images from your computer
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <!-- Image popup dialog -->
    <v-dialog v-model="dialogOpen" max-width="900">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Image preview</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogOpen = false" />
        </v-card-title>
        <v-card-text>
          <v-img
            v-if="currentImageUrl"
            :src="currentImageUrl"
            max-height="600"
            class="rounded mb-4"
            cover
          />
          <div class="d-flex justify-space-between">
            <v-btn variant="outlined" size="small" @click="prevImage" :disabled="!hasPrev">
              Previous
            </v-btn>
            <v-btn variant="outlined" size="small" @click="nextImage" :disabled="!hasNext">
              Next
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>

  <div v-else>
    <h2>Property not found</h2>
    <p class="text-body-2 mb-4">The requested property does not exist. It may have been removed.</p>
    <v-btn color="primary" @click="goBack"> Back to properties </v-btn>
  </div>
</template>

<!-- Scripting -->
<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePropertyStore } from '../stores/propertyStore'
import { createEmptyPropertyDraft } from '../constants/propertyDefaults'
import PropertyForm from '../components/properties/PropertiesForm.vue'

const route = useRoute()
const router = useRouter()
const propertyStore = usePropertyStore()

const id = route.params.id

const original = computed(() => propertyStore.properties.find((p) => p.id === id))

const propertyFound = computed(() => !!original.value)

// local editable copy
const editable = ref(createEmptyPropertyDraft())

const snackbar = ref(false)
const fileInput = ref(null)

// dialog state for image popup
const dialogOpen = ref(false)
const selectedImageIndex = ref(0)

watch(
  original,
  (value) => {
    if (value) {
      const base = createEmptyPropertyDraft()
      editable.value = {
        ...base,
        ...value,
        gallery: value.gallery ? [...value.gallery] : [],
      }
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
  const d = new Date(editable.value.createdAt)
  return d.toLocaleDateString()
})

const currentImageUrl = computed(() => {
  const gallery = editable.value.gallery || []
  return gallery[selectedImageIndex.value] || null
})

const hasPrev = computed(() => selectedImageIndex.value > 0)
const hasNext = computed(() => {
  const gallery = editable.value.gallery || []
  return selectedImageIndex.value < gallery.length - 1
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
    case 'On Market':
      return 'primary'
    case 'Under Offer':
      return 'amber-darken-2'
    case 'Sold':
      return 'grey-darken-1'
    default:
      return 'green-darken-1'
  }
}

function saveChanges() {
  if (!propertyFound.value) return

  propertyStore.updateProperty(id, { ...editable.value })
  snackbar.value = true
}

function goBack() {
  router.push({ name: 'properties' })
}
function triggerFilePicker() {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

function onFileChange(event) {
  const files = event.target.files
  handleImageFiles(files)
  // reset input so selecting the same file again still triggers change
  event.target.value = ''
}
// Handle image uploads from the user's machine
function handleImageFiles(files) {
  if (!files || !files.length) return

  const fileArray = Array.isArray(files) ? files : Array.from(files)

  fileArray.forEach((file) => {
    // For the demo: create a temporary object URL for preview
    const objectUrl = URL.createObjectURL(file)

    if (!editable.value.gallery) {
      editable.value.gallery = []
    }
    editable.value.gallery.push(objectUrl)

    // TODO (backend integration):
    //  - Replace this with an API call like:
    //      const url = await apiUploadPropertyImage(id, file);
    //      editable.value.gallery.push(url);
    //  - Revoke object URLs when component is destroyed:
    //      URL.revokeObjectURL(objectUrl);
  })
}
// Open dialog at a specific index
function openImage(index) {
  selectedImageIndex.value = index
  dialogOpen.value = true
}

function prevImage() {
  if (hasPrev.value) {
    selectedImageIndex.value -= 1
  }
}

function nextImage() {
  if (hasNext.value) {
    selectedImageIndex.value += 1
  }
}

function numberOrDash(value) {
  if (value === 0) {
    return '0'
  }
  if (value == null || value === '') {
    return '—'
  }
  return `${value}`
}

function textOrDash(value) {
  return value && value !== '' ? value : '—'
}

function formatAreaDisplay(value) {
  if (value == null || value === '') {
    return ''
  }
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

.status-pill {
  display: flex;
  align-items: center;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin: 16px 0 24px;
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
