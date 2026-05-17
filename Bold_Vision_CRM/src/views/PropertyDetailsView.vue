<template>
  <!-- ── Found ──────────────────────────────────────────────── -->
  <div v-if="propertyFound" class="prop-detail">

    <!-- Breadcrumb -->
    <div class="prop-detail__crumb">
      <router-link to="/properties" class="crumb-link">Properties</router-link>
      <AppIcon name="chevron" :size="14" class="crumb-sep" />
      <span class="crumb-current">{{ editable.address || 'Property details' }}</span>
    </div>

    <!-- Top: hero card (photo left + info right) -->
    <div class="prop-detail__top">

      <!-- Photo -->
      <div
        class="prop-detail__hero-media is-clickable"
        :class="{ 'is-drop-target': isDraggingPhoto }"
        role="button"
        tabindex="0"
        @click="onHeroClick"
        @keydown.enter="onHeroClick"
        @dragenter.prevent="isDraggingPhoto = true"
        @dragover.prevent="isDraggingPhoto = true"
        @dragleave.prevent="onHeroDragLeave"
        @drop.prevent="onHeroDrop"
      >
        <img
          v-if="mainPhotoUrl"
          :src="mainPhotoUrl"
          :alt="editable.address"
          class="prop-detail__hero-img"
        />
        <div v-else class="prop-detail__hero-ph">
          <AppIcon name="house" :size="40" />
          <span>No photo yet</span>
          <span class="prop-detail__hero-ph-hint">Click or drag a photo here to upload</span>
        </div>

        <span v-if="photoCount > 0" class="photo-counter">
          <AppIcon name="eye" :size="12" />
          {{ photoCount }} {{ photoCount === 1 ? 'photo' : 'photos' }}
        </span>

        <button
          class="floorplan-pill"
          :class="{ 'is-add': planCount === 0 }"
          @click.stop="openFloorplanLightbox()"
        >
          <AppIcon :name="planCount === 0 ? 'plus' : 'grid'" :size="13" />
          {{ planCount === 0
            ? 'Add floor plan'
            : `${planCount} floor plan${planCount === 1 ? '' : 's'}` }}
        </button>

        <input
          ref="heroFileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style="display: none"
          @change="onHeroFileInputChange"
        />

        <div v-if="isDraggingPhoto" class="hero-drop-overlay" aria-hidden="true">
          <AppIcon name="plus" :size="40" />
          <span>Drop to add photo{{ ' ' }}</span>
        </div>
      </div>

      <!-- Info panel -->
      <div class="prop-detail__info-col">
        <div>
          <div class="info-meta-row">
            <span class="status-badge" :class="statusToClass(editable.status)">
              <span class="dot" /> {{ editable.status }}
            </span>
            <span class="status-badge info-type-badge">{{ editable.type }}</span>
          </div>

          <h1 class="info-address">{{ editable.address || 'Property details' }}</h1>
          <p class="info-location">
            <AppIcon name="pin" :size="13" />
            {{ editable.suburb }}<span v-if="editable.suburb">, </span>{{ editable.state }} {{ editable.postcode }}
          </p>
        </div>

        <div>
          <div class="info-price">{{ editable.priceGuide || 'Price on request' }}</div>
          <span class="info-price-label">Price guide</span>
        </div>

        <!-- Activity at a glance (Leads / Days on market / Photos) -->
        <div class="info-stats">
          <div class="info-stat">
            <div class="info-stat-eyebrow">Leads</div>
            <div class="info-stat-num">{{ leadsCount }}</div>
          </div>
          <div class="info-stat">
            <div class="info-stat-eyebrow">Days on market</div>
            <div class="info-stat-num">{{ editable.daysOnMarket ?? 0 }}</div>
          </div>
          <div class="info-stat">
            <div class="info-stat-eyebrow">Photos</div>
            <div class="info-stat-num">{{ photoCount }}</div>
          </div>
        </div>

        <div class="info-actions">
          <button class="btn btn-primary" @click="broadcastOpen = true">
            <AppIcon name="chat" :size="14" /> Broadcast
          </button>
        </div>
      </div>
    </div>

    <!-- Specs bar (full-width, 5 cells) -->
    <div class="prop-detail__specs-bar">
      <div class="spec-cell">
        <span class="spec-icon-wrap"><AppIcon name="bed" :size="18" /></span>
        <div class="spec-text">
          <span class="spec-num">{{ editable.bedrooms ?? '—' }}</span>
          <span class="spec-label">Bedrooms</span>
        </div>
      </div>
      <div class="spec-cell">
        <span class="spec-icon-wrap"><AppIcon name="bath" :size="18" /></span>
        <div class="spec-text">
          <span class="spec-num">{{ editable.bathrooms ?? '—' }}</span>
          <span class="spec-label">Bathrooms</span>
        </div>
      </div>
      <div class="spec-cell">
        <span class="spec-icon-wrap"><AppIcon name="car" :size="18" /></span>
        <div class="spec-text">
          <span class="spec-num">{{ editable.carSpaces ?? '—' }}</span>
          <span class="spec-label">Car spaces</span>
        </div>
      </div>
      <div class="spec-cell">
        <span class="spec-icon-wrap"><AppIcon name="pin" :size="18" /></span>
        <div class="spec-text">
          <span class="spec-num">{{ editable.landSizeSqm ? formatSqm(editable.landSizeSqm) : '—' }}</span>
          <span class="spec-label">Land size</span>
        </div>
      </div>
      <div class="spec-cell">
        <span class="spec-icon-wrap"><AppIcon name="house" :size="18" /></span>
        <div class="spec-text">
          <span class="spec-num">{{ editable.houseSizeSqm ? formatSqm(editable.houseSizeSqm) : '—' }}</span>
          <span class="spec-label">House size</span>
        </div>
      </div>
    </div>

    <!-- Body: main card (tabs + content) + quick summary aside -->
    <div class="prop-detail__body">

      <!-- LEFT: tabbed main card -->
      <div class="prop-detail__main">
        <section class="pd-card">
          <!-- Tabs (always visible) -->
          <div class="tabs" role="tablist">
            <button
              role="tab"
              :aria-pressed="activeTab === 'details'"
              @click="activeTab = 'details'"
            >Details</button>
            <button
              role="tab"
              :aria-pressed="activeTab === 'customers'"
              @click="activeTab = 'customers'"
            >
              Customers
              <span v-if="leadsCount > 0" class="tab-ct">{{ leadsCount }}</span>
            </button>
          </div>

          <!-- Tab content -->
          <div class="pd-card__body">
            <header class="pd-card__head">
              <div class="pd-card__head-left">
                <h2 class="pd-card__title">{{ tabMeta.title }}</h2>
                <span v-if="activeTab === 'details' && hasUnsavedChanges" class="unsaved-badge">
                  <span class="unsaved-dot" />Unsaved
                </span>
              </div>
              <span class="pd-card__sub">{{ tabMeta.sub }}</span>
            </header>

            <Transition name="tab-fade" mode="out-in">
              <div :key="activeTab" class="tab-panel">

                <!-- Details tab: the overview form -->
                <template v-if="activeTab === 'details'">
                  <PropertyForm v-model="editable" />
                  <div class="pd-form-footer">
                    <button class="btn btn-ghost" :disabled="!hasUnsavedChanges" @click="resetChanges">Reset</button>
                    <button class="btn btn-primary" :disabled="!hasUnsavedChanges" @click="saveChanges">
                      <AppIcon name="check" :size="14" /> Save changes
                      <span v-if="hasUnsavedChanges" class="save-dot" />
                    </button>
                  </div>
                </template>

                <!-- Customers tab: interested customers kanban -->
                <template v-else-if="activeTab === 'customers'">
                  <PropertyInterestsPanel :property-id="id" />
                </template>

              </div>
            </Transition>
          </div>
        </section>
      </div>

    </div><!-- /prop-detail__body -->

    <!-- Broadcast dialog -->
    <v-dialog v-model="broadcastOpen" max-width="1000" :fullscreen="mobile" scrollable>
      <BroadcastPanel v-if="original" :property="original" @close="broadcastOpen = false" />
    </v-dialog>

    <!-- Photo / floor plan lightbox -->
    <v-dialog v-model="lightboxOpen" max-width="960" scrollable>
      <PhotoLightbox
        v-if="lightboxOpen && original"
        :items="lightboxItems"
        :kind="lightboxKind"
        :main-photo-path="original.mainPhoto"
        :start-index="lightboxStartIndex"
        @close="lightboxOpen = false"
        @delete="onLightboxDelete"
        @set-main="onLightboxSetMain"
        @upload="onLightboxUpload"
        @reorder="onLightboxReorder"
      />
    </v-dialog>

    <v-snackbar v-model="snackbar" timeout="2000" color="success">
      Changes saved successfully.
    </v-snackbar>
  </div>

  <!-- ── Not found ──────────────────────────────────────────── -->
  <div v-else class="prop-detail-empty">
    <h2>Property not found</h2>
    <p>The requested property does not exist or has been removed.</p>
    <button class="btn btn-primary" @click="goBack">Back to properties</button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { usePropertyStore } from '../stores/propertyStore'
import { createEmptyPropertyDraft } from '../constants/propertyDefaults'
import { useSignedUrl } from '../composables/useSignedUrl'
import PropertyForm from '../components/properties/PropertiesForm.vue'
import PropertyInterestsPanel from '../components/properties/PropertyInterestsPanel.vue'
import BroadcastPanel from '../components/properties/BroadcastPanel.vue'
import PhotoLightbox from '../components/properties/PhotoLightbox.vue'
import AppIcon from '../components/base/AppIcon.vue'
import { statusToClass } from '../utils/property'
import { formatSqm } from '../utils/formatters'

const route  = useRoute()
const router = useRouter()
const { mobile } = useDisplay()
const propertyStore = usePropertyStore()

const id = route.params.id

const original      = computed(() => propertyStore.properties.find((p) => p.id === id))
const propertyFound = computed(() => !!original.value)

const editable       = ref(createEmptyPropertyDraft())
const snackbar       = ref(false)
const photoUploading = ref(false)
const photoError     = ref(null)
const broadcastOpen  = ref(false)
const activeTab      = ref('details')

// Lightbox state — used for both photos and floor plans
const lightboxOpen       = ref(false)
const lightboxKind       = ref('photo')   // 'photo' | 'floorplan'
const lightboxStartIndex = ref(0)

// Hero upload state
const heroFileInput   = ref(null)
const isDraggingPhoto = ref(false)
let   heroDragLeaveTimer = null

watch(original, (value) => {
  editable.value = value
    ? { ...createEmptyPropertyDraft(), ...value }
    : createEmptyPropertyDraft()
}, { immediate: true })

// Signed URL for hero — safe to call here (not inside v-for)
const mainPhotoPath = computed(() => original.value?.mainPhoto ?? null)
const { url: mainPhotoUrl } = useSignedUrl(mainPhotoPath)

const createdAtFormatted = computed(() => {
  if (!editable.value.createdAt) return '—'
  return new Date(editable.value.createdAt).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
})

const listedAtFormatted = computed(() => {
  if (!editable.value.listedAt) return '—'
  return new Date(editable.value.listedAt).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
})

const leadsCount = computed(() => original.value?.interestedCustomers?.length ?? 0)
const photoCount = computed(() => original.value?.photos?.length ?? 0)
const planCount  = computed(() => original.value?.floorplans?.length ?? 0)

const EDITABLE_FIELDS = [
  'address', 'suburb', 'state', 'postcode', 'type', 'status',
  'priceGuide', 'priceMin', 'priceMax', 'listedAt',
  'bedrooms', 'bathrooms', 'carSpaces',
  'landSizeSqm', 'houseSizeSqm',
  'description', 'notes',
]
const hasUnsavedChanges = computed(() => {
  if (!original.value) return false
  return EDITABLE_FIELDS.some((f) => {
    const a = editable.value?.[f] ?? null
    const b = original.value?.[f] ?? null
    return a !== b
  })
})

const tabMeta = computed(() => {
  if (activeTab.value === 'customers') {
    return {
      title: 'Interested customers',
      sub: `${leadsCount.value} ${leadsCount.value === 1 ? 'customer' : 'customers'} linked`,
    }
  }
  return {
    title: 'Overview',
    sub: `Listed ${listedAtFormatted.value} · Created ${createdAtFormatted.value}`,
  }
})

function saveChanges() {
  if (!propertyFound.value) return
  propertyStore.updateProperty(id, { ...editable.value })
  snackbar.value = true
}

function resetChanges() {
  if (original.value) editable.value = { ...createEmptyPropertyDraft(), ...original.value }
}

function goBack() { router.push({ name: 'properties' }) }

// ── lightbox ────────────────────────────────────────────────
const lightboxItems = computed(() => {
  if (!original.value) return []
  return lightboxKind.value === 'floorplan'
    ? (original.value.floorplans ?? [])
    : (original.value.photos ?? [])
})

function openPhotoLightbox(index = 0) {
  lightboxKind.value = 'photo'
  // Default to the main photo's index when present
  const mainIdx = (original.value?.photos ?? []).findIndex(
    (p) => p.storagePath === original.value?.mainPhoto,
  )
  lightboxStartIndex.value = mainIdx >= 0 ? mainIdx : index
  lightboxOpen.value = true
}
function openFloorplanLightbox(index = 0) {
  lightboxKind.value = 'floorplan'
  lightboxStartIndex.value = index
  lightboxOpen.value = true
}

async function onLightboxDelete(photoId) {
  await handleRemove(photoId)
  // Close if we just deleted the last item of this kind
  if (lightboxItems.value.length === 0) lightboxOpen.value = false
}
async function onLightboxSetMain(storagePath) {
  await handleSelect(storagePath)
}
async function onLightboxUpload(files) {
  await handleAdd(files, lightboxKind.value)
}
async function onLightboxReorder(orderedIds) {
  await handleReorder(orderedIds)
}

// ── hero upload / drop ──────────────────────────────────────
function onHeroClick() {
  if (photoCount.value > 0) openPhotoLightbox()
  else heroFileInput.value?.click()
}
function onHeroDragLeave() {
  clearTimeout(heroDragLeaveTimer)
  heroDragLeaveTimer = setTimeout(() => { isDraggingPhoto.value = false }, 60)
}
async function onHeroDrop(e) {
  isDraggingPhoto.value = false
  const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
  if (files.length) await handleAdd(files, 'photo')
}
async function onHeroFileInputChange(e) {
  const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'))
  if (files.length) await handleAdd(files, 'photo')
  e.target.value = ''
}

// listProperties() doesn't join property_photos, so the property loaded from
// the list has empty photos/floorplans. Refetch with photos on mount.
onMounted(() => {
  if (id) propertyStore.fetchProperty(id)
})

// ── photo handlers ───────────────────────────────────────────
async function handleAdd(files, kind) {
  photoError.value = null
  photoUploading.value = true
  try {
    for (const file of files) await propertyStore.uploadPhoto(id, file, kind)
  } catch (e) {
    photoError.value = `Upload failed: ${e.message}`
  } finally {
    photoUploading.value = false
  }
}

async function handleRemove(photoId) {
  photoError.value = null
  try { await propertyStore.removePhoto(id, photoId) }
  catch (e) { photoError.value = `Delete failed: ${e.message}` }
}

async function handleReorder(orderedIds) {
  try { await propertyStore.reorderPhotos(id, orderedIds) }
  catch (e) { photoError.value = `Reorder failed: ${e.message}` }
}

async function handleSelect(storagePath) {
  try { await propertyStore.setMainPhoto(id, storagePath) }
  catch (e) { photoError.value = `Failed to set main photo: ${e.message}` }
}
</script>

<style scoped>
/* ── Shell ──────────────────────────────────────────────────── */
.prop-detail {
  display: flex; flex-direction: column;
  gap: 20px;
  padding: 24px 28px 40px;
}

/* ── Breadcrumb ─────────────────────────────────────────────── */
.prop-detail__crumb {
  display: flex; align-items: center; gap: 6px; font-size: 13px;
}
.crumb-link { color: var(--text-muted); text-decoration: none; transition: color .12s; }
.crumb-link:hover { color: var(--text); }
.crumb-sep { color: var(--text-faint); }
.crumb-current { color: var(--text); font-weight: 500; }

/* ── Hero card (photo left + info right) ────────────────────── */
.prop-detail__top {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* Photo pane */
.prop-detail__hero-media {
  position: relative;
  min-height: 320px;
  background: var(--surface-sunk);
}
.prop-detail__hero-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}
.prop-detail__hero-ph {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px;
  color: var(--text-faint); font-size: 13px;
  background: repeating-linear-gradient(45deg, var(--surface-2) 0 12px, var(--surface-sunk) 12px 24px);
}
.photo-counter {
  position: absolute; bottom: 16px; left: 16px;
  display: inline-flex; align-items: center; gap: 5px;
  background: oklch(15% 0.01 50 / 0.8);
  color: oklch(98% 0.005 80);
  padding: 5px 11px; border-radius: 999px;
  font-size: 12px; font-weight: 600;
  backdrop-filter: blur(8px);
  pointer-events: none;
}

/* Click-anywhere-on-photo affordance */
.prop-detail__hero-media.is-clickable { cursor: zoom-in; }
.prop-detail__hero-media.is-clickable:hover .prop-detail__hero-img {
  filter: brightness(1.06);
}
.prop-detail__hero-media.is-clickable:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

/* Placeholder hint (visible when 0 photos) */
.prop-detail__hero-ph-hint {
  font-size: 12px; color: var(--text-faint);
  margin-top: 2px;
}

/* Drag-and-drop overlay */
.prop-detail__hero-media.is-drop-target {
  outline: 2px dashed var(--accent);
  outline-offset: -6px;
}
.hero-drop-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px;
  background: color-mix(in oklch, var(--accent) 22%, transparent);
  color: var(--accent);
  font-weight: 600; font-size: 14px;
  pointer-events: none;
  backdrop-filter: blur(2px);
}

/* Floor-plan pill (bottom-right of hero) */
.floorplan-pill {
  position: absolute; bottom: 16px; right: 16px;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 999px;
  background: oklch(15% 0.01 50 / 0.82);
  color: oklch(98% 0.005 80);
  border: 1px solid oklch(100% 0 0 / 0.15);
  font-size: 12px; font-weight: 600;
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: background .12s, transform .08s;
}
.floorplan-pill:hover  { background: oklch(15% 0.01 50 / 0.96); }
.floorplan-pill:active { transform: translateY(1px); }
/* Dashed/quieter look when there's nothing there yet */
.floorplan-pill.is-add {
  background: oklch(15% 0.01 50 / 0.5);
  border-style: dashed;
  color: oklch(95% 0.005 80);
}
.floorplan-pill.is-add:hover { background: oklch(15% 0.01 50 / 0.78); }

/* Info pane */
.prop-detail__info-col {
  padding: 24px;
  display: flex; flex-direction: column; gap: 14px;
  min-width: 0;
}

.info-meta-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-bottom: 10px;
}
/* Property type renders as a neutral pill matching the status-badge chrome */
.info-type-badge { color: var(--text-muted); }

.info-address {
  margin: 0;
  font-size: 26px; font-weight: 600;
  letter-spacing: -0.02em; line-height: 1.2;
  color: var(--text);
}
.info-location {
  display: inline-flex; align-items: center; gap: 5px;
  margin: 8px 0 0; font-size: 14px; color: var(--text-muted);
}

.info-price {
  font-size: 30px; font-weight: 600;
  letter-spacing: -0.02em; color: var(--text);
}
.info-price-label {
  display: block;
  font-size: 12px; font-weight: 500; color: var(--text-muted);
  letter-spacing: 0; margin-top: 2px;
}

/* Activity at a glance */
.info-stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  padding: 14px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.info-stat { display: flex; flex-direction: column; gap: 2px; }
.info-stat-eyebrow {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--text-muted);
}
.info-stat-num {
  font-size: 22px; font-weight: 400; font-style: italic;
  letter-spacing: -0.01em; color: var(--text); line-height: 1.1;
  margin-top: 2px;
}

.info-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* ── Specs bar ──────────────────────────────────────────────── */
.prop-detail__specs-bar {
  display: grid; grid-template-columns: repeat(5, 1fr);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.spec-cell {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px;
  min-width: 0;
}
.spec-cell + .spec-cell { border-left: 1px solid var(--border); }

.spec-icon-wrap {
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--surface-sunk);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); flex-shrink: 0;
}
.spec-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.spec-num { font-size: 17px; font-weight: 600; color: var(--text); letter-spacing: -0.01em; }
.spec-label { font-size: 11.5px; color: var(--text-muted); }

/* ── Body ───────────────────────────────────────────────────── */
.prop-detail__body { display: block; }
.prop-detail__main { min-width: 0; }

/* ── Main card (tabs + content) ─────────────────────────────── */
.pd-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* Tabs chrome comes from src/styles/components/tabs.css (.tabs / .tab-ct / .tab-panel / .tab-fade-*) */

/* Card body */
.pd-card__body { padding: 22px 24px; }
.pd-card__head {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 12px; margin-bottom: 18px;
}
.pd-card__head-left { display: flex; align-items: center; gap: 10px; }
.pd-card__title {
  margin: 0;
  font-size: 16px; font-weight: 600;
  letter-spacing: -0.01em; color: var(--text);
}
.pd-card__sub { font-size: 12px; color: var(--text-muted); }

/* Unsaved-changes pill next to the tab title */
.unsaved-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid color-mix(in oklch, var(--accent) 30%, transparent);
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.01em;
}
.unsaved-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: unsaved-pulse 1.6s ease-in-out infinite;
}
@keyframes unsaved-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}

/* Tiny accent dot on Save button when there are unsaved changes */
.save-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
  margin-left: 2px;
  box-shadow: 0 0 0 2px color-mix(in oklch, currentColor 20%, transparent);
}

/* Form footer (Save / Reset) */
.pd-form-footer {
  display: flex; justify-content: flex-end; align-items: center; gap: 10px;
  margin-top: 20px; padding-top: 16px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
.pd-form-footer .btn:disabled {
  opacity: 0.45; cursor: not-allowed;
  pointer-events: none;
}
.pd-form-footer .btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
}

/* ── Agent card (kept for reuse) ────────────────────────────── */
.agent-card { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.agent-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: var(--accent); color: var(--text-on-accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.agent-name { font-size: 14px; font-weight: 600; color: var(--text); }
.agent-role { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.agent-actions { display: flex; gap: 6px; }
.agent-actions .btn { flex: 1; justify-content: center; text-decoration: none; }

/* ── Count badge ────────────────────────────────────────────── */
.count-badge {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: 999px;
  background: var(--surface-2); border: 1px solid var(--border);
  font-size: 12px; color: var(--text-muted); font-weight: 600;
}

/* ── Panel helpers ──────────────────────────────────────────── */
.last-edited { font-size: 12px; color: var(--text-faint); }

/* ── Upload error ───────────────────────────────────────────── */
.upload-error {
  margin: 0 0 10px;
  padding: 8px 12px; border-radius: var(--r-md);
  background: color-mix(in oklch, var(--hot) 10%, transparent);
  border: 1px solid color-mix(in oklch, var(--hot) 30%, transparent);
  color: var(--hot-ink); font-size: 13px;
}

/* ── Not found ──────────────────────────────────────────────── */
.prop-detail-empty {
  display: flex; flex-direction: column; align-items: flex-start;
  gap: 12px; padding: 40px 0;
}
.prop-detail-empty h2 { margin: 0; font-size: 22px; color: var(--text); }
.prop-detail-empty p  { margin: 0; color: var(--text-muted); }

/* ── Responsive (matches pd-shell breakpoints from reference) ─ */
@media (max-width: 1100px) {
  .prop-detail { padding: 20px 20px 32px; }
  .prop-detail__top  { grid-template-columns: 1fr; }
  .prop-detail__hero-media { min-height: 280px; aspect-ratio: 16 / 9; }
}

@media (max-width: 880px) {
  .prop-detail__specs-bar { grid-template-columns: repeat(3, 1fr); }
  .spec-cell:nth-child(n+4) { border-top: 1px solid var(--border); }
  .spec-cell:nth-child(4) { border-left: none; }
}

@media (max-width: 720px) {
  .prop-detail { padding: 14px 12px 24px; gap: 14px; }
  .prop-detail__info-col { padding: 18px 16px; }
  .info-address { font-size: 22px; }
  .info-price   { font-size: 24px; }
  .prop-detail__specs-bar { grid-template-columns: repeat(2, 1fr); }
  .spec-cell + .spec-cell { border-left: none; }
  .spec-cell:nth-child(odd) { border-right: 1px solid var(--border); }
  .spec-cell:nth-child(n+3) { border-top: 1px solid var(--border); }

  .pd-card__body { padding: 18px 16px; }
}
</style>
