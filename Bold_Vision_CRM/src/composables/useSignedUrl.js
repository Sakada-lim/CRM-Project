import { ref, watch, onUnmounted } from 'vue'
import { getSignedUrl } from '../services/mediaService'

export function useSignedUrl(storagePath, kind = 'photo') {
  const url = ref(null)
  const loading = ref(false)

  let refreshTimer = null

  async function fetchUrl(path) {
    if (!path) {
      url.value = null
      return
    }
    loading.value = true
    try {
      url.value = await getSignedUrl(path, kind)
      // Re-fetch 1 minute before the signed URL expires (TTL is 1 hour)
      clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => fetchUrl(path), 59 * 60 * 1000)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => (typeof storagePath === 'string' ? storagePath : storagePath?.value),
    (path) => fetchUrl(path),
    { immediate: true },
  )

  onUnmounted(() => clearTimeout(refreshTimer))

  return { url, loading }
}
