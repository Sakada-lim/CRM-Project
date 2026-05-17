import { defineStore } from 'pinia'
import {
  getLatestForCustomer,
  createDraft,
  updateSection as updateSectionService,
  updateMeta as updateMetaService,
  submitAssessment,
} from '../services/assessmentsService'

const SECTION_DEBOUNCE_MS = 1000

// Per-section debounce timers, keyed by `${customerId}::${sectionKey}` or
// `${customerId}::__meta`. Module-scope so timers survive across store
// invocations within the same tab.
const pendingTimers = new Map()

function timerKey(customerId, sectionKey) {
  return `${customerId}::${sectionKey ?? '__meta'}`
}

function cancelTimer(key) {
  const existing = pendingTimers.get(key)
  if (existing) {
    clearTimeout(existing)
    pendingTimers.delete(key)
  }
}

export const useAssessmentStore = defineStore('assessments', {
  state: () => ({
    byCustomer: {},   // { [customerId]: assessment | null }
    loading: false,
    saving: false,
    error: null,
  }),

  getters: {
    forCustomer: (state) => (customerId) => state.byCustomer[customerId] ?? null,
    progressForCustomer: (state) => (customerId) => {
      const a = state.byCustomer[customerId]
      if (!a) return { touched: 0, total: 7 }
      return { touched: a.touchedSections.length, total: 7 }
    },
  },

  actions: {
    async fetchForCustomer(customerId) {
      this.loading = true
      this.error = null
      try {
        const assessment = await getLatestForCustomer(customerId)
        this.byCustomer[customerId] = assessment
        return assessment
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async ensureDraft(customerId) {
      const existing = this.byCustomer[customerId]
      if (existing) return existing
      const fetched = await this.fetchForCustomer(customerId)
      if (fetched) return fetched
      this.saving = true
      try {
        const draft = await createDraft(customerId)
        this.byCustomer[customerId] = draft
        return draft
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.saving = false
      }
    },

    // Optimistic in-memory merge + debounced network write.
    updateSection(customerId, sectionKey, payload) {
      const assessment = this.byCustomer[customerId]
      if (!assessment) return

      // 1) optimistic local update
      assessment[sectionKey] = payload
      if (!assessment.touchedSections.includes(sectionKey)) {
        assessment.touchedSections = [...assessment.touchedSections, sectionKey]
      }

      // 2) debounce the network call so rapid keystrokes coalesce
      const key = timerKey(customerId, sectionKey)
      cancelTimer(key)
      const timer = setTimeout(async () => {
        pendingTimers.delete(key)
        this.saving = true
        try {
          const updated = await updateSectionService(
            assessment.id,
            sectionKey,
            payload,
            assessment.touchedSections,
          )
          this.byCustomer[customerId] = updated
        } catch (e) {
          this.error = e.message
        } finally {
          this.saving = false
        }
      }, SECTION_DEBOUNCE_MS)
      pendingTimers.set(key, timer)
    },

    updateMeta(customerId, partial) {
      const assessment = this.byCustomer[customerId]
      if (!assessment) return

      // optimistic
      Object.assign(assessment, partial)

      const key = timerKey(customerId, null)
      cancelTimer(key)
      const timer = setTimeout(async () => {
        pendingTimers.delete(key)
        this.saving = true
        try {
          const updated = await updateMetaService(assessment.id, partial)
          this.byCustomer[customerId] = updated
        } catch (e) {
          this.error = e.message
        } finally {
          this.saving = false
        }
      }, SECTION_DEBOUNCE_MS)
      pendingTimers.set(key, timer)
    },

    // Flush all debounced timers for this customer (call on submit / unmount).
    async flushPending(customerId) {
      const prefix = `${customerId}::`
      const keys = Array.from(pendingTimers.keys()).filter((k) => k.startsWith(prefix))
      for (const key of keys) {
        const timer = pendingTimers.get(key)
        if (timer) {
          clearTimeout(timer)
          pendingTimers.delete(key)
          // Fire its callback immediately by re-invoking the save inline.
          // Easiest path: just re-call updateSection / updateMeta with the
          // current state — they'll set a new 1000ms timer, which defeats the
          // purpose. Instead, do the write directly here.
          const sectionKey = key.slice(prefix.length)
          const assessment = this.byCustomer[customerId]
          if (!assessment) continue
          this.saving = true
          try {
            if (sectionKey === '__meta') {
              const updated = await updateMetaService(assessment.id, {
                consultantName: assessment.consultantName,
                brokerName: assessment.brokerName,
                dateCompleted: assessment.dateCompleted,
                nextAppointmentAt: assessment.nextAppointmentAt,
              })
              this.byCustomer[customerId] = updated
            } else {
              const updated = await updateSectionService(
                assessment.id,
                sectionKey,
                assessment[sectionKey],
                assessment.touchedSections,
              )
              this.byCustomer[customerId] = updated
            }
          } catch (e) {
            this.error = e.message
          } finally {
            this.saving = false
          }
        }
      }
    },

    async submit(customerId) {
      const assessment = this.byCustomer[customerId]
      if (!assessment) throw new Error('No assessment to submit')
      await this.flushPending(customerId)
      this.saving = true
      try {
        const updated = await submitAssessment(assessment.id)
        this.byCustomer[customerId] = updated
        return updated
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.saving = false
      }
    },
  },
})
