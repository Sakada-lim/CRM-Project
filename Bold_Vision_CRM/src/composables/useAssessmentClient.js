import { ref, onMounted, onUnmounted } from 'vue'

// Active client (shared across all multi-client assessment sections so that
// switching to "Client 2" in Personal also flips Employment + Income).
// Module-scoped ref = single source of truth across the open assessment.
const activeClient = ref('client1')

export function useActiveClient() {
  return activeClient
}

export function setActiveClient(value) {
  activeClient.value = value
}

// Phone-only viewport flag. We use this to swap the side-by-side two-client
// layout for a tabbed one when the column space gets too tight to read.
export function useIsPhoneView() {
  const isPhone = ref(false)
  let mql = null
  const update = () => { isPhone.value = mql?.matches ?? false }
  onMounted(() => {
    mql = window.matchMedia('(max-width: 720px)')
    isPhone.value = mql.matches
    mql.addEventListener('change', update)
  })
  onUnmounted(() => mql?.removeEventListener('change', update))
  return isPhone
}
