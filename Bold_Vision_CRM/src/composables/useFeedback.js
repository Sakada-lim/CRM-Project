import { reactive } from 'vue'

// Module-scoped state — shared across every component that calls useFeedback().
// Read by the single <AppSnackbar /> mounted in App.vue.
const state = reactive({
  show: false,
  text: '',
  color: 'success',   // 'success' | 'error' | 'info' | 'warning'
  timeout: 4000,
})

function notify(text, color, timeout) {
  state.text = String(text ?? '')
  state.color = color
  state.timeout = timeout
  // Force re-trigger if the same message is sent twice in a row
  state.show = false
  // Defer to next tick so v-snackbar sees the transition
  Promise.resolve().then(() => { state.show = true })
}

export function useFeedback() {
  return {
    state,
    notifySuccess(text, timeout = 4000) { notify(text, 'success', timeout) },
    notifyError(text, timeout = -1)     { notify(text, 'error', timeout) },  // no auto-dismiss
    notifyInfo(text, timeout = 4000)    { notify(text, 'info', timeout) },
    notifyWarning(text, timeout = 6000) { notify(text, 'warning', timeout) },

    // Convenience: pull the human-readable message from any error and surface
    // as an error toast. Handles ValidationError specifically.
    notifyFromError(err, prefix = '') {
      const msg = err?.firstMessage ?? err?.message ?? String(err)
      notify(prefix ? `${prefix}: ${msg}` : msg, 'error', -1)
    },

    dismiss() { state.show = false },
  }
}
