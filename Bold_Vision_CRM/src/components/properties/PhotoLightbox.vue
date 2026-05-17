<template>
  <div class="lightbox modal-card">
    <!-- Head -->
    <header class="lightbox__head">
      <div class="lightbox__head-info">
        <h2 class="lightbox__title">{{ title }}</h2>
        <span v-if="items.length" class="lightbox__counter">
          {{ activeIndex + 1 }} / {{ items.length }}
        </span>
      </div>
      <div class="lightbox__head-actions">
        <button
          v-if="items.length > 1"
          class="lb-head-btn"
          :class="{ active: reorderMode }"
          :title="reorderMode ? 'Done reordering' : 'Reorder'"
          @click="reorderMode = !reorderMode"
        >
          <AppIcon :name="reorderMode ? 'check' : 'grid'" :size="13" />
          {{ reorderMode ? 'Done' : 'Reorder' }}
        </button>
        <button class="lb-head-btn lb-head-btn--primary" @click="triggerUpload">
          <AppIcon name="plus" :size="13" />
          Upload
        </button>
        <button class="lightbox__close" aria-label="Close" @click="$emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </div>
      <input
        ref="fileInput"
        type="file"
        :accept="acceptType"
        multiple
        style="display: none"
        @change="onFileInputChange"
      />
    </header>

    <!-- Stage -->
    <div
      class="lightbox__main"
      :class="{ 'is-drag-over': isDraggingFile }"
      @dragenter.prevent="isDraggingFile = true"
      @dragover.prevent="isDraggingFile = true"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onFileDrop"
    >
      <button
        v-if="items.length > 1 && !reorderMode"
        class="lightbox__nav lightbox__nav--prev"
        aria-label="Previous"
        @click="prev"
      ><AppIcon name="arrow-left" :size="20" /></button>

      <div class="lightbox__stage">
        <img
          v-if="activeUrl"
          :src="activeUrl"
          :alt="`${title} ${activeIndex + 1}`"
        />
        <div v-else-if="items.length" class="lightbox__loading">
          <v-progress-circular indeterminate color="primary" size="32" />
        </div>
        <div v-else class="lightbox__empty">
          <AppIcon :name="kind === 'floorplan' ? 'grid' : 'house'" :size="40" />
          <span>No {{ kindLabel }}s yet</span>
          <button class="btn btn-primary" @click="triggerUpload">
            <AppIcon name="plus" :size="14" /> Upload {{ kindLabel }}
          </button>
          <span class="lightbox__empty-hint">or drag files here</span>
        </div>
      </div>

      <button
        v-if="items.length > 1 && !reorderMode"
        class="lightbox__nav lightbox__nav--next"
        aria-label="Next"
        @click="next"
      ><AppIcon name="arrow-right" :size="20" /></button>

      <!-- Drop overlay (covers the stage while dragging a file) -->
      <div v-if="isDraggingFile" class="lightbox__drop-overlay" aria-hidden="true">
        <AppIcon name="plus" :size="40" />
        <span>Drop to upload</span>
      </div>
    </div>

    <!-- Footer: thumbs + actions -->
    <div v-if="items.length" class="lightbox__foot">
      <div class="lightbox__thumbs" :class="{ 'is-reorder': reorderMode }">
        <button
          v-for="(item, i) in items"
          :key="item.id"
          class="lightbox__thumb"
          :class="{
            active: i === activeIndex && !reorderMode,
            main: isMainItem(item),
            'is-dragging': reorderFrom === i,
            'is-over': reorderOver === i && reorderFrom !== i,
          }"
          :aria-pressed="i === activeIndex"
          :draggable="reorderMode"
          @click="reorderMode ? null : (activeIndex = i)"
          @dragstart="reorderMode && onReorderStart(i)"
          @dragover.prevent="reorderMode && (reorderOver = i)"
          @dragleave="reorderMode && reorderOver === i && (reorderOver = null)"
          @drop.prevent="reorderMode && onReorderDrop(i)"
          @dragend="reorderMode && onReorderEnd()"
        >
          <img v-if="signedUrls[item.storagePath]" :src="signedUrls[item.storagePath]" alt="" />
          <span v-if="isMainItem(item)" class="lightbox__thumb-main-badge">
            <AppIcon name="star" :size="10" />
          </span>
        </button>
      </div>

      <div v-if="reorderMode" class="lightbox__reorder-hint">
        Drag thumbnails to reorder
      </div>
      <div v-else class="lightbox__actions">
        <button
          v-if="kind === 'photo'"
          class="btn btn-ghost lb-action"
          :disabled="isMain"
          @click="$emit('set-main', activeItem.storagePath)"
        >
          <AppIcon name="star" :size="14" />
          {{ isMain ? 'Main photo' : 'Set as main' }}
        </button>
        <button class="btn lb-action lb-action--danger" @click="$emit('delete', activeItem.id)">
          <AppIcon name="x" :size="14" /> Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import { getSignedUrl } from '../../services/mediaService'
import AppIcon from '../base/AppIcon.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  kind: { type: String, default: 'photo' }, // 'photo' | 'floorplan'
  mainPhotoPath: { type: String, default: null },
  startIndex: { type: Number, default: 0 },
})

const emit = defineEmits(['close', 'delete', 'set-main', 'upload', 'reorder'])

const activeIndex = ref(0)
const signedUrls  = reactive({})

// Upload state
const fileInput      = ref(null)
const isDraggingFile = ref(false)
let   dragLeaveTimer = null

// Reorder state
const reorderMode = ref(false)
const reorderFrom = ref(null)
const reorderOver = ref(null)

const acceptType = computed(() =>
  props.kind === 'floorplan'
    ? 'image/jpeg,image/png,image/webp,application/pdf'
    : 'image/jpeg,image/png,image/webp',
)

function triggerUpload() {
  fileInput.value?.click()
}
function filterFiles(fileList) {
  const allowPdf = props.kind === 'floorplan'
  return Array.from(fileList).filter((f) =>
    f.type.startsWith('image/') || (allowPdf && f.type === 'application/pdf'),
  )
}
function onFileInputChange(e) {
  const files = filterFiles(e.target.files)
  if (files.length) emit('upload', files)
  e.target.value = ''
}
function onFileDrop(e) {
  isDraggingFile.value = false
  const files = filterFiles(e.dataTransfer.files)
  if (files.length) emit('upload', files)
}
function onDragLeave() {
  // dragleave fires when moving between child elements; defer-and-cancel
  // pattern avoids the flicker when the cursor moves over thumbnails etc.
  clearTimeout(dragLeaveTimer)
  dragLeaveTimer = setTimeout(() => { isDraggingFile.value = false }, 60)
}

function onReorderStart(i) { reorderFrom.value = i }
function onReorderDrop(toIndex) {
  if (reorderFrom.value === null || reorderFrom.value === toIndex) return
  const next = [...props.items]
  const [moved] = next.splice(reorderFrom.value, 1)
  next.splice(toIndex, 0, moved)
  emit('reorder', next.map((item) => item.id))
  reorderFrom.value = null
  reorderOver.value = null
}
function onReorderEnd() {
  reorderFrom.value = null
  reorderOver.value = null
}

const kindLabel  = computed(() => props.kind === 'floorplan' ? 'floor plan' : 'photo')
const title      = computed(() => props.kind === 'floorplan' ? 'Floor plans' : 'Photos')
const activeItem = computed(() => props.items[activeIndex.value] ?? null)
const activeUrl  = computed(() => activeItem.value ? signedUrls[activeItem.value.storagePath] : null)
const isMain     = computed(() => !!activeItem.value && props.mainPhotoPath === activeItem.value.storagePath)

function isMainItem(item) {
  return props.kind === 'photo' && props.mainPhotoPath === item.storagePath
}

function prev() {
  activeIndex.value = (activeIndex.value - 1 + props.items.length) % props.items.length
}
function next() {
  activeIndex.value = (activeIndex.value + 1) % props.items.length
}

async function resolveUrls(items) {
  for (const item of items) {
    if (item.storagePath && !signedUrls[item.storagePath]) {
      try {
        signedUrls[item.storagePath] = await getSignedUrl(item.storagePath, props.kind)
      } catch {
        signedUrls[item.storagePath] = ''
      }
    }
  }
}

watch(() => props.items, (items) => {
  resolveUrls(items)
  // Clamp active index if items shrunk (e.g., after a delete)
  if (activeIndex.value >= items.length) {
    activeIndex.value = Math.max(0, items.length - 1)
  }
}, { immediate: true, deep: true })

// Reset to the requested start index whenever it changes
watch(() => props.startIndex, (i) => {
  if (i >= 0 && i < props.items.length) activeIndex.value = i
}, { immediate: true })

// Keyboard navigation: arrows
function onKey(e) {
  if (e.key === 'ArrowLeft' && props.items.length > 1)  prev()
  if (e.key === 'ArrowRight' && props.items.length > 1) next()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
/* Base modal-card chrome comes from styles/components/modals.css.
   Lightbox-specific override: allow more height (92vh vs 86vh default)
   since the stage is the main content. */
.lightbox.modal-card { max-height: 92vh; }

/* ── Head ───────────────────────────────────────────────────── */
.lightbox__head {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}
.lightbox__head-info { display: flex; align-items: baseline; gap: 12px; flex: 1; min-width: 0; }
.lightbox__title {
  margin: 0;
  font-size: 16px; font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text);
}
.lightbox__counter {
  font-size: 12.5px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.lightbox__head-actions { display: flex; align-items: center; gap: 6px; }
.lb-head-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 12px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text); font-size: 12.5px; font-weight: 600;
  cursor: pointer;
  transition: background .12s, border-color .12s, color .12s;
}
.lb-head-btn:hover { background: var(--surface-sunk); border-color: var(--border-strong); }
.lb-head-btn.active {
  background: var(--accent-soft);
  border-color: color-mix(in oklch, var(--accent) 40%, transparent);
  color: var(--accent);
}
.lb-head-btn--primary {
  background: var(--accent);
  color: var(--text-on-accent);
  border-color: transparent;
}
.lb-head-btn--primary:hover {
  background: var(--accent-hover, var(--accent));
  border-color: transparent;
  filter: brightness(1.05);
}

.lightbox__close {
  width: 32px; height: 32px;
  display: inline-grid; place-items: center;
  border-radius: 8px;
  color: var(--text-muted);
  background: transparent; border: none; cursor: pointer;
}
.lightbox__close:hover { background: var(--surface-2); color: var(--text); }

/* ── Stage ──────────────────────────────────────────────────── */
.lightbox__main {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  background:
    repeating-linear-gradient(45deg, var(--surface-2) 0 12px, var(--surface-sunk) 12px 24px);
  min-height: 0;
  flex: 1;
}
.lightbox__stage {
  width: 100%; height: 100%;
  min-height: 420px;
  display: flex; align-items: center; justify-content: center;
  padding: 12px;
}
.lightbox__stage img {
  max-width: 100%; max-height: 60vh;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 4px 16px oklch(0% 0 0 / 0.35);
}
.lightbox__loading,
.lightbox__empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  color: var(--text-faint); font-size: 13px;
}
.lightbox__empty-hint { font-size: 12px; color: var(--text-faint); }

/* Drag-and-drop overlay */
.lightbox__main.is-drag-over { outline: 2px dashed var(--accent); outline-offset: -8px; }
.lightbox__drop-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px;
  background: color-mix(in oklch, var(--accent) 18%, transparent);
  color: var(--accent);
  font-weight: 600; font-size: 14px;
  pointer-events: none;
  backdrop-filter: blur(2px);
}

/* Nav buttons */
.lightbox__nav {
  position: absolute; top: 50%;
  transform: translateY(-50%);
  width: 44px; height: 44px;
  border-radius: 50%;
  background: oklch(15% 0.01 50 / 0.7);
  color: oklch(98% 0.005 80);
  border: 1px solid oklch(100% 0 0 / 0.15);
  display: grid; place-items: center;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: background .12s, transform .08s;
}
.lightbox__nav:hover  { background: oklch(15% 0.01 50 / 0.92); }
.lightbox__nav:active { transform: translateY(-50%) scale(0.96); }
.lightbox__nav--prev { left: 16px; }
.lightbox__nav--next { right: 16px; }

/* ── Foot: thumbs + actions ────────────────────────────────── */
.lightbox__foot {
  padding: 14px 18px;
  border-top: 1px solid var(--border);
  background: var(--surface-2);
  display: flex; flex-direction: column; gap: 12px;
}

.lightbox__thumbs {
  display: flex; gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.lightbox__thumb {
  position: relative;
  flex: 0 0 auto;
  width: 64px; height: 48px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-sunk);
  border: 2px solid transparent;
  padding: 0;
  cursor: pointer;
  transition: border-color .12s, transform .08s;
}
.lightbox__thumb img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}
.lightbox__thumb:hover  { border-color: var(--border-strong); }
.lightbox__thumb.active { border-color: var(--accent); }

/* Reorder mode */
.lightbox__thumbs.is-reorder .lightbox__thumb { cursor: grab; }
.lightbox__thumbs.is-reorder .lightbox__thumb:active { cursor: grabbing; }
.lightbox__thumb.is-dragging { opacity: 0.4; }
.lightbox__thumb.is-over     { border-color: var(--accent); transform: translateY(-2px); }
.lightbox__reorder-hint {
  display: flex; align-items: center; justify-content: center;
  height: 38px;
  font-size: 12px; color: var(--text-muted);
  font-style: italic;
}
.lightbox__thumb-main-badge {
  position: absolute; top: 2px; right: 2px;
  width: 16px; height: 16px;
  display: grid; place-items: center;
  border-radius: 50%;
  background: var(--accent);
  color: var(--text-on-accent);
}

/* Actions */
.lightbox__actions {
  display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap;
}
.lb-action {
  display: inline-flex; align-items: center; gap: 6px;
}
.lb-action:disabled {
  opacity: 0.45; cursor: not-allowed; pointer-events: none;
}
.lb-action--danger {
  background: color-mix(in oklch, var(--hot) 12%, transparent);
  color: var(--hot-ink);
  border: 1px solid color-mix(in oklch, var(--hot) 35%, transparent);
  padding: 8px 14px;
  border-radius: var(--r-md);
  font-weight: 600; font-size: 13.5px;
  cursor: pointer;
  transition: background .12s, border-color .12s;
}
.lb-action--danger:hover {
  background: color-mix(in oklch, var(--hot) 20%, transparent);
  border-color: color-mix(in oklch, var(--hot) 55%, transparent);
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 720px) {
  /* .modal-card full-screen handled by shared modals.css */
  .lightbox__stage { min-height: 320px; padding: 8px; }
  .lightbox__stage img { max-height: 55vh; }
  .lightbox__nav { width: 38px; height: 38px; }
  .lightbox__nav--prev { left: 10px; }
  .lightbox__nav--next { right: 10px; }
}
</style>
