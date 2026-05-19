import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// Phase 8 Stage 1:
// - C6: `base: '/'` so production-built assets resolve at the site root
//   (previously '/CRM-Project/' for GitHub Pages preview; would 404 every
//   asset on Vercel / any non-subpath host).
// - C9: vueDevTools loads only in dev. Shipping the Vue + Pinia state
//   inspector to production bundle is a bundle-size + info-leak cost
//   (internal store state visible via the devtools panel).
//
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ...(process.env.NODE_ENV === 'development' ? [vueDevTools()] : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: '/',
})
