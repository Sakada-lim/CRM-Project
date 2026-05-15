import { defineStore } from 'pinia'
import { getSession, onAuthChange, signOut } from '../services/authService'
import { usePropertyStore } from './propertyStore'
import { useCustomerStore } from './customerStore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    loading: true,
  }),

  actions: {
    async init() {
      this.loading = true
      this.session = await getSession()
      this.user = this.session?.user ?? null
      this.loading = false

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
