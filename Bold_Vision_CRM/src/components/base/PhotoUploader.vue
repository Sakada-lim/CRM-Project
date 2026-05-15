<template>
  <div>
    <!-- Drop zone -->
    <div
      class="uploader-dropzone rounded-lg pa-4 mb-3 d-flex flex-column align-center justify-center"
      :class="{ 'uploader-dropzone--active': isDraggingOver }"
      @dragover.prevent="isDraggingOver = true"
      @dragleave="isDraggingOver = false"
      @drop.prevent="onFileDrop"
      @click="fileInput.click()"
    >
      <v-icon size="36" color="grey-darken-1">mdi-cloud-upload-outline</v-icon>
      <p class="text-body-2 text-grey-darken-1 mt-2 mb-0">
        Drag & drop or <span class="text-primary">click to upload</span>
      </p>
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        style="display: none"
        @change="onFileInputChange"
      />
    </div>

    <!-- Preview grid -->
    <div v-if="items.length" class="uploader-grid">
      <div
        v-for="(item, i) in items"
        :key="item.id"
        class="uploader-item"
        :class="{
          'uploader-item--dragging': dragFrom === i,
          'uploader-item--over': dragOver === i,
        }"
        draggable="true"
        @dragstart="onDragStart(i)"
        @dragover.prevent="dragOver = i"
        @drop.prevent="onItemDrop(i)"
        @dragend="onDragEnd"
      >
        <v-img
          :src="signedUrls[item.storagePath] || ''"
          aspect-ratio="1"
          cover
          class="rounded"
        >
          <template #placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular indeterminate size="20" />
            </div>
          </template>
        </v-img>

        <v-btn
          icon="mdi-close"
          size="x-small"
          color="error"
          class="uploader-item__delete"
          @click.stop="emit('remove', item.id)"
        />
        <v-btn
          icon="mdi-star"
          size="x-small"
          :color="mainPhotoPath === item.storagePath ? 'amber-darken-1' : 'grey-lighten-1'"
          class="uploader-item__main"
          :title="mainPhotoPath === item.storagePath ? 'Main photo' : 'Set as main photo'"
          @click.stop="emit('select', item.storagePath)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onUnmounted } from 'vue'
import { getSignedUrl } from '../../services/mediaService'

const props = defineProps({
  items: { type: Array, default: () => [] },
  kind: { type: String, default: 'photo' },
  mainPhotoPath: { type: String, default: null },
  accept: { type: String, default: 'image/jpeg,image/png,image/webp' },
  multiple: { type: Boolean, default: true },
})

const emit = defineEmits(['add', 'remove', 'reorder', 'select'])

const fileInput = ref(null)
const isDraggingOver = ref(false)
const dragFrom = ref(null)
const dragOver = ref(null)

// storagePath → signed URL mapping, populated lazily as items arrive
const signedUrls = reactive({})

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

watch(() => props.items, resolveUrls, { immediate: true, deep: true })

onUnmounted(() => {
  // revoke any blob URLs created from local file previews
  Object.values(signedUrls).forEach((url) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  })
})

// ── file upload ────────────────────────────────────────────────

function onFileDrop(e) {
  isDraggingOver.value = false
  const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
  if (files.length) emit('add', files)
}

function onFileInputChange(e) {
  const files = Array.from(e.target.files)
  if (files.length) emit('add', files)
  e.target.value = ''
}

// ── drag-to-reorder within grid ────────────────────────────────

function onDragStart(index) {
  dragFrom.value = index
}

function onItemDrop(toIndex) {
  if (dragFrom.value === null || dragFrom.value === toIndex) return
  const reordered = [...props.items]
  const [moved] = reordered.splice(dragFrom.value, 1)
  reordered.splice(toIndex, 0, moved)
  emit('reorder', reordered.map((item) => item.id))
}

function onDragEnd() {
  dragFrom.value = null
  dragOver.value = null
}
</script>

<style scoped>
.uploader-dropzone {
  border: 2px dashed #cbd5e1;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  min-height: 96px;
}
.uploader-dropzone--active {
  border-color: #4f46e5;
  background: #f0f0ff;
}

.uploader-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.uploader-item {
  position: relative;
  border-radius: 8px;
  overflow: visible;
  cursor: grab;
  opacity: 1;
  transition: opacity 0.15s;
}
.uploader-item--dragging {
  opacity: 0.4;
}
.uploader-item--over {
  outline: 2px solid #4f46e5;
  border-radius: 8px;
}

.uploader-item__delete {
  position: absolute;
  top: -8px;
  right: -8px;
}
.uploader-item__main {
  position: absolute;
  bottom: -8px;
  right: -8px;
}
</style>
