import { defineStore } from 'pinia'
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  setLastContacted,
} from '../services/customersService'

const CADENCE = { Hot: 'Every 3 months', Warm: 'Every 6 months', Cold: 'Every 12 months' }

export const useCustomerStore = defineStore('customers', {
  state: () => ({
    customers: [],
    loading: false,
    error: null,
    loaded: false,
  }),

  actions: {
    async fetchCustomers() {
      this.loading = true
      this.error = null
      try {
        this.customers = await listCustomers()
        this.loaded = true
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async addCustomer(payload) {
      this.error = null
      try {
        const customer = await createCustomer(payload)
        this.customers.unshift(customer)
        return customer
      } catch (e) {
        this.error = e.message
        throw e
      }
    },

    async updateCustomer(id, updates) {
      this.error = null
      const index = this.customers.findIndex((c) => c.id === id)
      const previous = index !== -1 ? { ...this.customers[index] } : null

      if (index !== -1) {
        this.customers[index] = {
          ...this.customers[index],
          ...updates,
          followUpCadence:
            CADENCE[updates.category ?? this.customers[index].category] ?? CADENCE.Cold,
        }
      }

      try {
        const merged = previous ? { ...previous, ...updates } : updates
        const updated = await updateCustomer(id, merged)
        if (index !== -1) this.customers[index] = updated
        return updated
      } catch (e) {
        if (index !== -1 && previous) this.customers[index] = previous
        this.error = e.message
        throw e
      }
    },

    async deleteCustomer(id) {
      this.error = null
      try {
        await deleteCustomer(id)
        this.customers = this.customers.filter((c) => c.id !== id)
      } catch (e) {
        this.error = e.message
        throw e
      }
    },

    async setLastContacted(id, dateIso) {
      const c = this.customers.find((c) => c.id === id)
      if (c) c.lastContactedAt = dateIso
      try {
        await setLastContacted(id, dateIso)
      } catch (e) {
        if (c) c.lastContactedAt = null
        this.error = e.message
      }
    },

    // Shimmed until Phase 3 wires real persistence
    addFeedback(id, note, dateIso = new Date().toISOString()) {
      const c = this.customers.find((c) => c.id === id)
      if (!c) return
      if (!c.feedback) c.feedback = []
      c.feedback.unshift({ id: Date.now(), date: dateIso, note })
    },
  },
})
