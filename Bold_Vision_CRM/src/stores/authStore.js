import { defineStore } from 'pinia'
import { getSession, onAuthChange, signOut } from '../services/authService'
import { usePropertyStore } from './propertyStore'
import { useCustomerStore } from './customerStore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    loading: true,
    // C8: set when init() fails (e.g. Supabase unreachable). LoginView surfaces
    // it so the user knows it's a connectivity issue, not bad credentials.
    initError: null,
  }),

  actions: {
    // Called once at app boot from main.js, BEFORE mount (C12). Resolves the
    // session synchronously from the app's perspective so the router guard
    // can read `session` without re-querying. Never throws — errors surface
    // via `initError`. The onAuthChange listener wires up the long-lived
    // subscription for future sign-in / sign-out / token-refresh events.
    async init() {
      this.loading = true
      this.initError = null
      try {
        this.session = await getSession()
        this.user = this.session?.user ?? null
      } catch (e) {
        // Auth service unreachable. Stay logged out; surface to LoginView.
        this.session = null
        this.user = null
        this.initError = e?.message || 'Could not reach the authentication service. Check your connection and try again.'
        console.error('authStore.init() failed:', e)
      } finally {
        this.loading = false
      }

      if (this.session) {
        usePropertyStore().fetchProperties()
        useCustomerStore().fetchCustomers()
      }

      onAuthChange((session) => {
        this.session = session
        this.user = session?.user ?? null
        if (session) {
          usePropertyStore().fetchProperties()
          useCustomerStore().fetchCustomers()
        }
      })
    },

    async signOut() {
      await signOut()
      this.user = null
      this.session = null
      usePropertyStore().$reset()
      useCustomerStore().$reset()
    },
  },
})
