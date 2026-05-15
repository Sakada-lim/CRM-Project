import { defineStore } from 'pinia'
import {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../services/propertiesService'
import {
  uploadPropertyImage,
  deletePropertyImage,
  reorderPhotos as reorderPhotoRows,
} from '../services/mediaService'
import {
  listForProperty,
  upsertInterest,
  removeInterest,
} from '../services/interestsService'
import { computeBadge, sortByInterestLevel } from '../utils/property'

export const usePropertyStore = defineStore('properties', {
  state: () => ({
    properties: [],
    interests: {},
    loading: false,
    error: null,
    loaded: false,
  }),

  actions: {
    async fetchProperties() {
      this.loading = true
      this.error = null
      try {
        this.properties = await listProperties()
        this.loaded = true
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },

    async fetchProperty(id) {
      try {
        const property = await getProperty(id)
        const index = this.properties.findIndex((p) => p.id === id)
        if (index !== -1) {
          this.properties[index] = property
        } else {
          this.properties.unshift(property)
        }
        return property
      } catch (e) {
        this.error = e.message
      }
    },

    async addProperty(payload) {
      this.error = null
      try {
        const property = await createProperty(payload)
        this.properties.unshift(property)
        return property
      } catch (e) {
        this.error = e.message
        throw e
      }
    },

    async updateProperty(id, updates) {
      this.error = null
      const index = this.properties.findIndex((p) => p.id === id)
      const previous = index !== -1 ? { ...this.properties[index] } : null

      if (index !== -1) {
        this.properties[index] = {
          ...this.properties[index],
          ...updates,
          statusBadge: computeBadge(
            updates.listedAt ?? this.properties[index].listedAt,
            updates.status ?? this.properties[index].status,
          ),
        }
      }

      try {
        const merged = previous ? { ...previous, ...updates } : updates
        const updated = await updateProperty(id, merged)
        if (index !== -1) this.properties[index] = updated
        return updated
      } catch (e) {
        if (index !== -1 && previous) this.properties[index] = previous
        this.error = e.message
        throw e
      }
    },

    async deleteProperty(id) {
      this.error = null
      try {
        await deleteProperty(id)
        this.properties = this.properties.filter((p) => p.id !== id)
      } catch (e) {
        this.error = e.message
        throw e
      }
    },

    async uploadPhoto(propertyId, file, kind) {
      await uploadPropertyImage(propertyId, file, { kind })
      await this.fetchProperty(propertyId)
    },

    async removePhoto(propertyId, photoId) {
      await deletePropertyImage(photoId)
      await this.fetchProperty(propertyId)
    },

    async reorderPhotos(propertyId, orderedIds) {
      await reorderPhotoRows(orderedIds)
      await this.fetchProperty(propertyId)
    },

    async setMainPhoto(propertyId, storagePath) {
      await this.updateProperty(propertyId, { mainPhoto: storagePath })
    },

    async fetchInterests(propertyId) {
      const data = await listForProperty(propertyId)
      this.interests[propertyId] = sortByInterestLevel(data)
    },

    async addInterestedCustomer(propertyId, customerId, interestLevel = 'Warm') {
      await upsertInterest(propertyId, customerId, interestLevel)
      await this.fetchInterests(propertyId)
    },

    async updateInterestLevel(propertyId, customerId, interestLevel) {
      await upsertInterest(propertyId, customerId, interestLevel)
      await this.fetchInterests(propertyId)
    },

    async removeInterestedCustomer(propertyId, customerId) {
      await removeInterest(propertyId, customerId)
      await this.fetchInterests(propertyId)
    },
  },
})
