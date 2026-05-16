import { defineStore } from 'pinia'
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  setLastContacted,
  setNextContactAt as setNextContactAtService,
  listFeedback,
  addFeedback as addFeedbackService,
} from '../services/customersService'
import {
  listForCustomer,
  upsertInterest,
  removeInterest,
} from '../services/interestsService'


export const useCustomerStore = defineStore('customers', {
  state: () => ({
    customers: [],
    feedback: {},
    propertyInterests: {},
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
        this.customers[index] = { ...this.customers[index], ...updates }
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

    async setNextContactAt(id, dateIso) {
      const c = this.customers.find((c) => c.id === id)
      const prev = c?.nextContactAt ?? null
      if (c) c.nextContactAt = dateIso
      try {
        await setNextContactAtService(id, dateIso)
      } catch (e) {
        if (c) c.nextContactAt = prev
        this.error = e.message
      }
    },

    async logContact(id, lastContactedIso, nextContactIso) {
      await this.setLastContacted(id, lastContactedIso)
      await this.setNextContactAt(id, nextContactIso)
      await this.addFeedback(id, 'Contacted')
    },

    async fetchFeedback(customerId) {
      const data = await listFeedback(customerId)
      this.feedback[customerId] = data
    },

    async addFeedback(customerId, note) {
      const entry = await addFeedbackService(customerId, note)
      if (!this.feedback[customerId]) this.feedback[customerId] = []
      this.feedback[customerId].unshift(entry)
    },

    async fetchPropertyInterests(customerId) {
      const data = await listForCustomer(customerId)
      this.propertyInterests[customerId] = data
    },

    async addPropertyInterest(customerId, propertyId, interestLevel = 'Warm') {
      await upsertInterest(propertyId, customerId, interestLevel)
      await this.fetchPropertyInterests(customerId)
    },

    async removePropertyInterest(customerId, propertyId) {
      await removeInterest(propertyId, customerId)
      await this.fetchPropertyInterests(customerId)
    },
  },
})
