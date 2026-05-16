<template>
  <img
    v-if="url"
    :src="url"
    :alt="alt"
    loading="lazy"
    @error="failed = true"
  />
  <div v-else class="ph">
    <AppIcon name="house" :size="28" />
    <span>No photo yet</span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSignedUrl } from '../../composables/useSignedUrl'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  storagePath: { type: String, default: null },
  alt: { type: String, default: '' },
})

const failed = ref(false)
const pathRef = computed(() => (failed.value ? null : props.storagePath))
const { url } = useSignedUrl(pathRef)
</script>
