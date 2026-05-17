import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Hex approximations of the OKLCH design tokens for Vuetify's color system
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary:    '#C2543A', // --accent  oklch(58% 0.13 35)
          background: '#F8F5EF', // --bg      oklch(98% 0.008 75)
          surface:    '#FFFFFF', // --surface
          error:      '#D94F35',
          success:    '#3E9068',
          warning:    '#C98A2A',
          info:       '#3B7EC0',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary:    '#D97B55', // --accent  oklch(72% 0.13 35)
          background: '#1B1815', // --bg      oklch(17% 0.012 60)
          surface:    '#25201C', // --surface oklch(22% 0.013 60)
          error:      '#E87B62',
          success:    '#5EAD86',
          warning:    '#DBA94A',
          info:       '#62A0DC',
        },
      },
    },
  },
})

export default vuetify
