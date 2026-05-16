import { ref, watch } from 'vue'
import { useTheme as useVuetifyTheme } from 'vuetify'

export function useTheme() {
  const vuetifyTheme = useVuetifyTheme()

  const systemPreference = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  const theme = ref(localStorage.getItem('bv-theme') ?? systemPreference())

  const applyTheme = (t) => {
    document.documentElement.dataset.theme = t
    vuetifyTheme.global.name.value = t
    localStorage.setItem('bv-theme', t)
  }

  applyTheme(theme.value)

  watch(theme, applyTheme)

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return { theme, toggleTheme }
}
