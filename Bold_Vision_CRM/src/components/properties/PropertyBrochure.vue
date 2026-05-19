<template>
  <div class="brochure-btn-wrap">
    <v-menu offset="6" :close-on-content-click="true">
      <template #activator="{ props: menuProps }">
        <button
          v-bind="menuProps"
          type="button"
          class="btn btn-ghost"
          :disabled="busy"
        >
          <AppIcon name="document" :size="14" />
          {{ hasBrochure ? 'Brochure' : 'Add brochure' }}
          <AppIcon name="chevron" :size="12" class="brochure-btn-caret" />
        </button>
      </template>

      <v-list density="compact" class="brochure-menu">
        <template v-if="hasBrochure">
          <v-list-item @click="onView">
            <template #prepend><AppIcon name="eye" :size="14" /></template>
            <v-list-item-title>View PDF</v-list-item-title>
          </v-list-item>
          <v-list-item @click="triggerFilePicker">
            <template #prepend><AppIcon name="plus" :size="14" /></template>
            <v-list-item-title>Replace</v-list-item-title>
          </v-list-item>
          <v-list-item @click="onDelete" class="brochure-menu__delete">
            <template #prepend><AppIcon name="x" :size="14" /></template>
            <v-list-item-title>Delete</v-list-item-title>
          </v-list-item>
        </template>
        <template v-else>
          <v-list-item @click="triggerFilePicker">
            <template #prepend><AppIcon name="plus" :size="14" /></template>
            <v-list-item-title>Upload PDF</v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>

    <input
      ref="fileInput"
      type="file"
      accept="application/pdf"
      style="display: none"
      @change="onFileChange"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '../base/AppIcon.vue'
import {
  uploadPropertyBrochure,
  removePropertyBrochure,
  getBrochureSignedUrl,
} from '../../services/mediaService'
import { useFeedback } from '../../composables/useFeedback'
import { ValidationError } from '../../utils/validators'

const props = defineProps({
  propertyId: { type: String, required: true },
  brochurePath: { type: String, default: null },
})

const emit = defineEmits(['update:brochurePath'])

const { notifySuccess, notifyError } = useFeedback()

const fileInput = ref(null)
const busy = ref(false)

const hasBrochure = computed(() => !!props.brochurePath)

function triggerFilePicker() {
  fileInput.value?.click()
}

async function onFileChange(e) {
  const file = e.target.files?.[0]
  if (fileInput.value) fileInput.value.value = ''
  if (!file) return

  busy.value = true
  try {
    const newPath = await uploadPropertyBrochure(props.propertyId, file)
    emit('update:brochurePath', newPath)
    notifySuccess('Brochure uploaded')
  } catch (e) {
    const msg = e instanceof ValidationError
      ? Object.values(e.fields)[0]
      : (e.message || 'Upload failed')
    notifyError(msg)
  } finally {
    busy.value = false
  }
}

async function onView() {
  if (!props.brochurePath) return
  busy.value = true
  try {
    const url = await getBrochureSignedUrl(props.brochurePath)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (e) {
    notifyError(e.message || 'Could not open brochure')
  } finally {
    busy.value = false
  }
}

async function onDelete() {
  if (!props.brochurePath) return
  if (!window.confirm('Delete this brochure? You can upload a new one any time.')) return

  busy.value = true
  try {
    await removePropertyBrochure(props.propertyId)
    emit('update:brochurePath', null)
    notifySuccess('Brochure deleted')
  } catch (e) {
    notifyError(e.message || 'Delete failed')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.brochure-btn-wrap { display: inline-flex; }
.brochure-btn-caret { opacity: 0.6; margin-left: 2px; }

.brochure-menu :deep(.v-list-item) {
  min-height: 36px;
  font-size: 13.5px;
  color: var(--text);
  cursor: pointer;
}
.brochure-menu :deep(.v-list-item:hover) { background: var(--surface-2); }
.brochure-menu__delete :deep(.v-list-item-title) { color: var(--hot-ink); }
</style>
