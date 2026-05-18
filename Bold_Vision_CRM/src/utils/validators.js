// Shared validators used by forms (inline error display) and services (throw
// before DB write). Each validator returns null on success or an error string
// on failure. Composite validators return { field: errorString } or null.
//
// Defense in depth: forms call these on @blur + on save click; services call
// the composite validator and throw ValidationError if any field fails; the
// DB has matching CHECK constraints as the last line.

import { parsePriceInput } from './formatters'

// ── Error type ──────────────────────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(errors, message = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
    // `errors` is either { field: msg, ... } for composite or a single string
    this.errors = typeof errors === 'string' ? { _: errors } : errors
    // Convenience for toast display: first error message
    this.field = Object.keys(this.errors)[0] ?? null
    this.firstMessage = this.field ? this.errors[this.field] : message
  }
}

// ── Constants ───────────────────────────────────────────────────────────────

const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE  = /^[+\d\s\-()]{6,20}$/
const AU_POST_RE = /^\d{4}$/
const TG_CHAT_RE = /^-?\d{6,16}$/

// Sane outer bounds. Anything beyond these is almost certainly bad input.
export const LIMITS = Object.freeze({
  name:           { min: 1, max: 100 },
  email:          { max: 254 },
  phone:          { min: 6, max: 20 },
  notes:          { max: 5000 },
  agent:          { max: 100 },
  address:        { min: 1, max: 200 },
  suburb:         { max: 100 },
  description:    { max: 5000 },
  propertyCode:   { max: 50 },
  bedrooms:       { max: 50 },
  bathrooms:      { max: 50 },
  carSpaces:      { max: 100 },
  landSize:       { max: 1_000_000 },
  houseSize:      { max: 100_000 },
  priceMax:       { max: 999_000_000 },
  messageBody:    { min: 1, max: 4096 },
  recipientCap:   { max: 200 },
  callDuration:   { max: 600 },
  assessmentCurrency: { max: 99_000_000 },
  budgetCurrency:     { max: 999_000_000 },
  liabilityRowCap:    { max: 50 },
  assessmentText:     { max: 100 },
  assessmentLongText: { max: 1000 },
  assessmentNote:     { max: 5000 },
  photoSizeBytes:     { max: 10 * 1024 * 1024 },
  photoBatch:         { max: 20 },
})

const PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

// ── Atomic validators ───────────────────────────────────────────────────────

export function validateRequired(value, label = 'Field') {
  if (value === null || value === undefined) return `${label} is required`
  if (typeof value === 'string' && value.trim() === '') return `${label} is required`
  return null
}

export function validateMaxLength(value, max, label = 'Field') {
  if (value == null || value === '') return null
  if (String(value).length > max) return `${label} must be ${max} characters or fewer`
  return null
}

export function validateMinLength(value, min, label = 'Field') {
  if (value == null || value === '') return null
  if (String(value).trim().length < min) return `${label} must be at least ${min} characters`
  return null
}

export function validateEmail(value) {
  if (value == null || value === '') return null   // blank is allowed; caller enforces required separately
  const v = String(value).trim()
  if (v.length > LIMITS.email.max) return `Email must be ${LIMITS.email.max} characters or fewer`
  if (!EMAIL_RE.test(v)) return 'Invalid email format'
  return null
}

export function validatePhone(value) {
  if (value == null || value === '') return null
  const v = String(value).trim()
  if (!PHONE_RE.test(v)) {
    return 'Phone can only contain digits, +, spaces, dashes, parentheses (6–20 chars)'
  }
  return null
}

export function validatePostcode(value) {
  if (value == null || value === '') return null
  if (!AU_POST_RE.test(String(value).trim())) return 'Postcode must be 4 digits'
  return null
}

export function validateTelegramChatId(value) {
  if (value == null || value === '') return null
  if (!TG_CHAT_RE.test(String(value).trim())) {
    return 'Telegram chat ID must be 6–16 digits (optional leading −)'
  }
  return null
}

// Integer range. Empty/null/undefined are treated as 0 (callers can wrap with
// validateRequired if blank is forbidden).
export function validatePositiveInt(value, max, label = 'Field') {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return `${label} must be a number`
  if (!Number.isInteger(n)) return `${label} must be a whole number`
  if (n < 0) return `${label} can't be negative`
  if (n > max) return `${label} must be ${max} or less`
  return null
}

export function validatePositiveNumber(value, max, label = 'Field') {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  if (!Number.isFinite(n)) return `${label} must be a number`
  if (n < 0) return `${label} can't be negative`
  if (n > max) return `${label} must be ${max.toLocaleString()} or less`
  return null
}

export function validateDateNotInPast(value, label = 'Date') {
  if (!value) return null
  const t = Date.parse(value)
  if (Number.isNaN(t)) return `${label} is not a valid date`
  // Compare on day boundary in local TZ — being a few hours off today is fine
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (t < now.getTime()) return `${label} can't be in the past`
  return null
}

export function validateDateMaxFuture(value, maxYears, label = 'Date') {
  if (!value) return null
  const t = Date.parse(value)
  if (Number.isNaN(t)) return `${label} is not a valid date`
  const cap = Date.now() + maxYears * 365 * 24 * 60 * 60 * 1000
  if (t > cap) return `${label} can't be more than ${maxYears} year${maxYears === 1 ? '' : 's'} away`
  return null
}

// ── Duplicate detection (phone / email) ─────────────────────────────────────

// Reduce a phone string to digits-only so different formattings
// ("0412 345 678", "+61412345678", "0412-345-678") compare equal.
// Returns null for blank input.
export function normalizePhone(value) {
  if (value == null) return null
  const digits = String(value).replace(/\D/g, '')
  return digits.length ? digits : null
}

// Lower-case + trim email for case-insensitive comparison. Returns null for blank.
export function normalizeEmail(value) {
  if (value == null) return null
  const v = String(value).trim().toLowerCase()
  return v.length ? v : null
}

// Lower-case + trim name for case-insensitive comparison.
function normalizeName(value) {
  if (value == null) return null
  const v = String(value).trim().toLowerCase()
  return v.length ? v : null
}

// Given a candidate customer and a list of existing customers, return any that
// match on normalized phone, email, or name. Excludes `excludeId` (used when
// editing — don't flag the customer themselves).
//
// Returns { phone?: customer, email?: customer, name?: customer } — at most
// one match per field. Phone/email are intended for hard block; name is a
// soft warn (different people can share names legitimately).
export function findDuplicateCustomers({ phone, email, name }, customers, { excludeId } = {}) {
  const out = {}
  const targetPhone = normalizePhone(phone)
  const targetEmail = normalizeEmail(email)
  const targetName  = normalizeName(name)
  if (!targetPhone && !targetEmail && !targetName) return out

  for (const c of customers || []) {
    if (excludeId && c.id === excludeId) continue
    if (!out.phone && targetPhone && normalizePhone(c.phone) === targetPhone) {
      out.phone = c
    }
    if (!out.email && targetEmail && normalizeEmail(c.email) === targetEmail) {
      out.email = c
    }
    if (!out.name && targetName && normalizeName(c.name) === targetName) {
      out.name = c
    }
    if (out.phone && out.email && out.name) break
  }
  return out
}

// ── Currency parser (hardened wrapper around formatters.parsePriceInput) ────

// Returns { value: number|null, error: string|null }. Single source of truth
// for currency parsing across assessment + property forms.
export function parseCurrency(raw, { max = LIMITS.priceMax.max, label = 'Amount' } = {}) {
  if (raw == null || String(raw).trim() === '') return { value: null, error: null }
  const n = parsePriceInput(raw)
  if (n == null) return { value: null, error: `${label} is not a valid number` }
  if (n < 0) return { value: null, error: `${label} can't be negative` }
  if (n > max) return { value: null, error: `${label} must be ${max.toLocaleString()} or less` }
  return { value: n, error: null }
}

// ── Composite validators (return { field: errMsg } or null) ─────────────────

// Customer form: AddCustomerDialog + CustomerDetailView basic info.
export function validateCustomerForm(form) {
  const errors = {}
  const nameErr = validateRequired(form.name, 'Name')
    ?? validateMaxLength(form.name, LIMITS.name.max, 'Name')
  if (nameErr) errors.name = nameErr

  const phoneErr = validatePhone(form.phone)
  if (phoneErr) errors.phone = phoneErr

  const emailErr = validateEmail(form.email)
  if (emailErr) errors.email = emailErr

  const tgErr = validateTelegramChatId(form.telegramChatId)
  if (tgErr) errors.telegramChatId = tgErr

  const agentErr = validateMaxLength(form.agent, LIMITS.agent.max, 'Agent')
  if (agentErr) errors.agent = agentErr

  const notesErr = validateMaxLength(form.notes, LIMITS.notes.max, 'Notes')
  if (notesErr) errors.notes = notesErr

  // At-least-one-contact-method (form-level error)
  const hasPhone = form.phone != null && String(form.phone).trim() !== ''
  const hasEmail = form.email != null && String(form.email).trim() !== ''
  const hasTg    = form.telegramChatId != null && String(form.telegramChatId).trim() !== ''
  if (!hasPhone && !hasEmail && !hasTg) {
    errors._ = 'At least one of phone, email, or Telegram chat ID is required'
  }

  return Object.keys(errors).length ? errors : null
}

// Property form: PropertiesForm (used by add + edit).
export function validatePropertyForm(form) {
  const errors = {}

  const addrErr = validateRequired(form.address, 'Address')
    ?? validateMaxLength(form.address, LIMITS.address.max, 'Address')
  if (addrErr) errors.address = addrErr

  const suburbErr = validateMaxLength(form.suburb, LIMITS.suburb.max, 'Suburb')
  if (suburbErr) errors.suburb = suburbErr

  const postErr = validatePostcode(form.postcode)
  if (postErr) errors.postcode = postErr

  const codeErr = validateMaxLength(form.code, LIMITS.propertyCode.max, 'Code')
  if (codeErr) errors.code = codeErr

  for (const [field, max, label] of [
    ['bedrooms',  LIMITS.bedrooms.max,  'Bedrooms'],
    ['bathrooms', LIMITS.bathrooms.max, 'Bathrooms'],
    ['carSpaces', LIMITS.carSpaces.max, 'Car spaces'],
    ['carparkSpaces', LIMITS.carSpaces.max, 'Carpark spaces'],
  ]) {
    const e = validatePositiveInt(form[field], max, label)
    if (e) errors[field] = e
  }

  for (const [field, max, label] of [
    ['landSizeSqm',  LIMITS.landSize.max,  'Land size'],
    ['houseSizeSqm', LIMITS.houseSize.max, 'House size'],
  ]) {
    const e = validatePositiveNumber(form[field], max, label)
    if (e) errors[field] = e
  }

  if (form.priceMin != null) {
    const e = validatePositiveNumber(form.priceMin, LIMITS.priceMax.max, 'Price min')
    if (e) errors.priceMin = e
  }
  if (form.priceMax != null) {
    const e = validatePositiveNumber(form.priceMax, LIMITS.priceMax.max, 'Price max')
    if (e) errors.priceMax = e
  }
  if (form.priceMin != null && form.priceMax != null
      && Number(form.priceMax) < Number(form.priceMin)) {
    errors.priceMax = 'Price max must be greater than or equal to Price min'
  }

  const descErr = validateMaxLength(form.description, LIMITS.description.max, 'Description')
  if (descErr) errors.description = descErr

  const notesErr = validateMaxLength(form.notes, LIMITS.notes.max, 'Notes')
  if (notesErr) errors.notes = notesErr

  if (form.agentEmail) {
    const e = validateEmail(form.agentEmail)
    if (e) errors.agentEmail = e
  }
  if (form.agentPhone) {
    const e = validatePhone(form.agentPhone)
    if (e) errors.agentPhone = e
  }
  const agentNameErr = validateMaxLength(form.agentName, LIMITS.agent.max, 'Agent name')
  if (agentNameErr) errors.agentName = agentNameErr

  return Object.keys(errors).length ? errors : null
}

// Broadcast: body + recipient list.
export function validateBroadcast({ body, recipients }) {
  const errors = {}
  const bodyErr = validateRequired(body, 'Message')
    ?? validateMaxLength(body, LIMITS.messageBody.max, 'Message')
  if (bodyErr) errors.body = bodyErr

  if (!Array.isArray(recipients) || recipients.length === 0) {
    errors.recipients = 'No eligible recipients'
  } else if (recipients.length > LIMITS.recipientCap.max) {
    errors.recipients = `Too many recipients (max ${LIMITS.recipientCap.max} per broadcast)`
  }
  return Object.keys(errors).length ? errors : null
}

// Photo upload pre-checks.
export function validatePhotoFile(file) {
  if (!file) return 'No file'
  if (!PHOTO_MIME.has(file.type)) return 'Only JPEG, PNG, or WebP images allowed'
  if (file.size > LIMITS.photoSizeBytes.max) return 'File must be 10 MB or smaller'
  return null
}

// Assessment section validator. Each section is loose-text by design (the
// agent should be able to type "DD/MM/YYYY · Age" in a single field), so we
// enforce length caps and parse currency rather than format-perfect input.
//
// N/A flags (Slice 1b): each section payload may carry an `na` map of fields
// the agent has explicitly marked Not Applicable. For client-split sections
// (personal/employment/income) it lives at `payload.client1.na = { rentAmount:
// true, ... }`. For flat sections (assets/discovery/notes) it lives at
// `payload.na = { vehicle2: true, ... }`. Liabilities has its own
// `payload.naSection: true` (whole-section toggle).
//
// Print contract (deferred render layer, data ready today):
//   - na[field] === true      → render literal "N/A"
//   - value is non-empty      → render the value
//   - otherwise (true blank)  → render "—" (signals agent left it blank
//                                without an explicit decision)
const ASSESSMENT_LIMITS = {
  shortText:    LIMITS.assessmentText.max,    // 100
  longText:     LIMITS.assessmentLongText.max, // 1000
  noteText:     LIMITS.assessmentNote.max,    // 5000
  currency:     LIMITS.assessmentCurrency.max, // 99M
  budget:       LIMITS.budgetCurrency.max,    // 999M
}

// Reads `payload.na[key]` (flat sections) or `payload[side].na[key]`
// (client-split sections). Returns true iff the field has been explicitly
// marked Not Applicable. Used to skip validation on N/A'd fields.
function isFieldNA(payload, key, side = null) {
  if (!payload) return false
  if (side) return payload[side]?.na?.[key] === true
  return payload.na?.[key] === true
}

export function validateAssessmentSection(sectionKey, payload) {
  if (payload == null || typeof payload !== 'object') return null
  const errors = {}

  const checkText = (val, key, max, label) => {
    const e = validateMaxLength(val, max, label)
    if (e) errors[key] = e
  }
  const checkCurrency = (val, key, max, label) => {
    const { error } = parseCurrency(val, { max, label })
    if (error) errors[key] = error
  }

  switch (sectionKey) {
    case 'personal': {
      for (const side of ['client1', 'client2']) {
        const c = payload[side]
        if (!c) continue
        const naFor = (k) => isFieldNA(payload, k, side)
        checkText(c.fullName,    `${side}.fullName`,    ASSESSMENT_LIMITS.shortText, 'Full name')
        // Legacy single-field DOB (kept for back-compat). New split fields below.
        if (!naFor('dobDate')) checkText(c.dob, `${side}.dob`, 30, 'DOB')
        // Split DOB: dobDate (YYYY-MM-DD, not in future) + age (0–120)
        if (!naFor('dobDate') && c.dobDate) {
          const today = new Date().toISOString().slice(0, 10)
          if (c.dobDate > today) errors[`${side}.dobDate`] = 'Date of birth can\'t be in the future'
        }
        if (!naFor('dobDate') && c.age !== undefined && c.age !== '' && c.age !== null) {
          const ageErr = validatePositiveInt(c.age, 120, 'Age')
          if (ageErr) errors[`${side}.age`] = ageErr
        }
        if (!naFor('dependants')) {
          checkText(c.dependants, `${side}.dependants`, ASSESSMENT_LIMITS.shortText, 'Dependants')
        }
        // residencyOther only meaningful when residency === 'Other', but cap
        // length whenever it has a value so stale values don't grow.
        checkText(c.residencyOther, `${side}.residencyOther`, ASSESSMENT_LIMITS.shortText, 'Residency (specify)')
        if (!naFor('address')) {
          checkText(c.address, `${side}.address`, LIMITS.address.max, 'Address')
        }
        const phoneErr = validatePhone(c.phone); if (phoneErr) errors[`${side}.phone`] = phoneErr
        if (!naFor('rentAmount')) {
          checkCurrency(c.rentAmount, `${side}.rentAmount`, ASSESSMENT_LIMITS.currency, 'Rent')
        }
      }
      break
    }
    case 'employment': {
      for (const side of ['client1', 'client2']) {
        const c = payload[side]
        if (!c) continue
        const naFor = (k) => isFieldNA(payload, k, side)
        if (!naFor('occupation'))      checkText(c.occupation,      `${side}.occupation`,      ASSESSMENT_LIMITS.shortText, 'Occupation')
        if (!naFor('employer'))        checkText(c.employer,        `${side}.employer`,        ASSESSMENT_LIMITS.shortText, 'Employer')
        if (!naFor('previousJobNote')) checkText(c.previousJobNote, `${side}.previousJobNote`, ASSESSMENT_LIMITS.longText,  'Previous job notes')
        // yearsInRole is now type=number (0–99, step 0.5)
        if (!naFor('yearsInRole') && c.yearsInRole !== undefined && c.yearsInRole !== '' && c.yearsInRole !== null) {
          const e = validatePositiveNumber(c.yearsInRole, 99, 'Years in role')
          if (e) errors[`${side}.yearsInRole`] = e
        }
      }
      break
    }
    case 'income': {
      for (const side of ['client1', 'client2']) {
        const c = payload[side]
        if (!c) continue
        const naFor = (k) => isFieldNA(payload, k, side)
        for (const [rowKey, label] of [
          ['salaryWages',    'Salary/Wages'],
          ['bonus',          'Bonus'],
          ['afterTax',       'After-tax pay'],
          ['centrelink',     'Centrelink/DVA'],
          ['investmentRent', 'Investment rent'],
          ['other',          'Other income'],
        ]) {
          if (naFor(rowKey)) continue
          const row = c[rowKey]
          if (row && row.amount !== undefined) {
            checkCurrency(row.amount, `${side}.${rowKey}.amount`, ASSESSMENT_LIMITS.currency, label)
          }
        }
        // Free-text description for "Other (specify)" — only validate if not NA'd
        if (!naFor('other') && c.other?.details !== undefined) {
          checkText(c.other.details, `${side}.other.details`, 200, 'Other income — description')
        }
      }
      break
    }
    case 'assets': {
      for (const key of [
        'principalResidence', 'homeContents', 'vehicle1', 'vehicle2',
        'cashBankAccounts', 'futureSavings',
        'investmentProperty1', 'investmentProperty2', 'investmentProperty3',
        'otherLifestyle', 'directShares', 'managedFunds1', 'managedFunds2',
        'superannuation1', 'superannuation2', 'otherAsset',
      ]) {
        if (isFieldNA(payload, key)) continue
        if (payload[key] !== undefined) {
          checkCurrency(payload[key], key, ASSESSMENT_LIMITS.currency, 'Asset value')
        }
      }
      break
    }
    case 'liabilities': {
      // Whole-section N/A skips row validation entirely.
      if (payload.naSection === true) break
      const rows = Array.isArray(payload.rows) ? payload.rows : []
      if (rows.length > LIMITS.liabilityRowCap.max) {
        errors.rows = `Too many liabilities (max ${LIMITS.liabilityRowCap.max})`
      }
      rows.forEach((row, i) => {
        checkText(row.details, `rows[${i}].details`, ASSESSMENT_LIMITS.shortText, 'Details')
        checkText(row.lender,  `rows[${i}].lender`,  ASSESSMENT_LIMITS.shortText, 'Lender')
        checkText(row.remainingTerm, `rows[${i}].remainingTerm`, 20, 'Remaining term')
        checkText(row.interestRate,  `rows[${i}].interestRate`,  10, 'Interest rate')
        checkCurrency(row.value,     `rows[${i}].value`,     ASSESSMENT_LIMITS.currency, 'Outstanding')
        checkCurrency(row.repayment, `rows[${i}].repayment`, ASSESSMENT_LIMITS.currency, 'Repayment')
      })
      break
    }
    case 'discovery': {
      const naFor = (k) => isFieldNA(payload, k)
      if (!naFor('q2_lookingDuration')) checkText(payload.q2_lookingDuration, 'q2_lookingDuration', LIMITS.address.max, 'Looking duration')
      checkText(payload.q3_buyTimeline,     'q3_buyTimeline',     LIMITS.address.max, 'Buy timeline')
      if (!naFor('q6_areaOfInterest'))  checkText(payload.q6_areaOfInterest,  'q6_areaOfInterest',  LIMITS.address.max, 'Area of interest')
      if (!naFor('q8_propertyType'))    checkText(payload.q8_propertyType,    'q8_propertyType',    ASSESSMENT_LIMITS.shortText, 'Property type')
      if (!naFor('q8b_minBedrooms') && payload.q8b_minBedrooms !== undefined && payload.q8b_minBedrooms !== '' && payload.q8b_minBedrooms !== null) {
        const e = validatePositiveInt(payload.q8b_minBedrooms, 50, 'Min bedrooms')
        if (e) errors.q8b_minBedrooms = e
      }
      if (!naFor('q10_landSize'))       checkText(payload.q10_landSize,       'q10_landSize',       ASSESSMENT_LIMITS.shortText, 'Land size')
      if (!naFor('q11_landTitledDate')) checkText(payload.q11_landTitledDate, 'q11_landTitledDate', ASSESSMENT_LIMITS.shortText, 'Land titled date')
      if (!naFor('q9_requirements'))    checkText(payload.q9_requirements,    'q9_requirements',    ASSESSMENT_LIMITS.longText,  'Requirements')
      if (!naFor('q13_biggestConcern')) checkText(payload.q13_biggestConcern, 'q13_biggestConcern', ASSESSMENT_LIMITS.longText,  'Biggest concern')
      if (!naFor('q7_budgetMin'))       checkCurrency(payload.q7_budgetMin,   'q7_budgetMin',   ASSESSMENT_LIMITS.budget,   'Budget min')
      if (!naFor('q7_budgetMax'))       checkCurrency(payload.q7_budgetMax,   'q7_budgetMax',   ASSESSMENT_LIMITS.budget,   'Budget max')
      if (!naFor('q14_depositAmount'))  checkCurrency(payload.q14_depositAmount, 'q14_depositAmount', ASSESSMENT_LIMITS.currency, 'Deposit')
      break
    }
    case 'notes': {
      const naFor = (k) => isFieldNA(payload, k)
      checkText(payload.consultantName,    'consultantName',    ASSESSMENT_LIMITS.shortText, 'Consultant')
      if (!naFor('brokerName'))        checkText(payload.brokerName,        'brokerName',        ASSESSMENT_LIMITS.shortText, 'Broker')
      if (!naFor('preApprovalLender')) checkText(payload.preApprovalLender, 'preApprovalLender', ASSESSMENT_LIMITS.shortText, 'Pre-approval lender')
      checkText(payload.consultantNotes,   'consultantNotes',   ASSESSMENT_LIMITS.noteText,  'Consultant notes')
      if (!naFor('brokerNotes'))       checkText(payload.brokerNotes,       'brokerNotes',       ASSESSMENT_LIMITS.noteText,  'Broker notes')
      if (!naFor('preApprovalAmount')) checkCurrency(payload.preApprovalAmount, 'preApprovalAmount', ASSESSMENT_LIMITS.currency, 'Pre-approval amount')
      break
    }
    default:
      // Unknown section keys are caught upstream in assessmentsService.updateSection
      break
  }

  return Object.keys(errors).length ? errors : null
}

// ── Section completion (Slice 1b) ───────────────────────────────────────────
//
// Three-state nav rendering for the assessment form:
//   - 'untouched'    → section not in touched_sections (handled by caller)
//   - 'in-progress'  → touched but at least one optional field is blank-without-NA
//   - 'complete'     → every optional field is either filled or explicitly N/A'd
//
// Caller uses touched_sections for untouched/in-progress split, then calls
// `computeSectionStatus(sectionKey, assessment)` to distinguish in-progress
// from complete.
//
// Why pass the whole `assessment` and not just the section payload? The Notes
// section's `dateCompleted`, `consultantName`, `brokerName`, and
// `nextAppointmentAt` live on top-level columns (mirrored from the customer or
// stored separately), not in the notes JSONB. The N/A flags for those fields
// still live in `notes.na` for consistency.

function isFilledValue(v) {
  if (v == null) return false
  if (typeof v === 'string') return v.trim() !== ''
  return true
}

// "Filled-or-N/A": the agent has made an explicit decision about this field —
// either typed a value, or clicked the N/A button.
function isFilledOrNA(value, naMap, key) {
  if (naMap?.[key] === true) return true
  return isFilledValue(value)
}

export function computeSectionStatus(sectionKey, assessment) {
  if (!assessment) return 'in-progress'

  switch (sectionKey) {
    case 'personal': {
      const c1 = assessment.personal?.client1 ?? {}
      const na = c1.na ?? {}
      // Optional client1 fields the agent should explicitly decide on
      const fields = ['dobDate', 'dependants', 'address', 'rentAmount']
      return fields.every((f) => isFilledOrNA(c1[f], na, f)) ? 'complete' : 'in-progress'
    }
    case 'employment': {
      const c1 = assessment.employment?.client1 ?? {}
      const na = c1.na ?? {}
      const fields = ['occupation', 'employer', 'yearsInRole']
      return fields.every((f) => isFilledOrNA(c1[f], na, f)) ? 'complete' : 'in-progress'
    }
    case 'income': {
      const c1 = assessment.income?.client1 ?? {}
      const na = c1.na ?? {}
      const rows = ['salaryWages', 'bonus', 'afterTax', 'centrelink', 'investmentRent', 'other']
      return rows.every((r) => {
        if (na[r] === true) return true
        return isFilledValue(c1[r]?.amount)
      }) ? 'complete' : 'in-progress'
    }
    case 'assets': {
      const payload = assessment.assets ?? {}
      const na = payload.na ?? {}
      const fields = [
        'principalResidence', 'homeContents', 'vehicle1', 'vehicle2',
        'cashBankAccounts', 'futureSavings',
        'investmentProperty1', 'investmentProperty2', 'investmentProperty3',
        'otherLifestyle', 'directShares', 'managedFunds1', 'managedFunds2',
        'superannuation1', 'superannuation2', 'otherAsset',
      ]
      return fields.every((f) => isFilledOrNA(payload[f], na, f)) ? 'complete' : 'in-progress'
    }
    case 'liabilities': {
      const payload = assessment.liabilities ?? {}
      if (payload.naSection === true) return 'complete'
      const rows = Array.isArray(payload.rows) ? payload.rows : []
      return rows.length >= 1 ? 'complete' : 'in-progress'
    }
    case 'discovery': {
      const payload = assessment.discovery ?? {}
      const na = payload.na ?? {}
      // Required (never N/A'able — seg-controls / picks)
      const required = ['q1_contactedBroker', 'q3_buyTimeline', 'q5_purpose', 'q12_mostImportant']
      const reqOk = required.every((f) => isFilledValue(payload[f]))
      // Optional (N/A-eligible)
      const optional = [
        'q2_lookingDuration', 'q4_talkedBuildersAgents', 'q6_areaOfInterest',
        'q7_budgetMin', 'q7_budgetMax', 'q8_propertyType', 'q8b_minBedrooms',
        'q9_requirements', 'q10_landSize', 'q11_landTitledDate',
        'q13_biggestConcern', 'q14_depositAmount',
      ]
      const optOk = optional.every((f) => isFilledOrNA(payload[f], na, f))
      return reqOk && optOk ? 'complete' : 'in-progress'
    }
    case 'notes': {
      const payload = assessment.notes ?? {}
      const na = payload.na ?? {}
      // Required: dateCompleted (top-level), consultantNotes (JSONB)
      if (!isFilledValue(assessment.dateCompleted)) return 'in-progress'
      if (!isFilledValue(payload.consultantNotes)) return 'in-progress'
      // Optional: brokerName (top), preApprovalAmount/Lender + brokerNotes (JSONB),
      // nextAppointmentAt (top)
      const optionalChecks = [
        ['brokerName',        assessment.brokerName],
        ['preApprovalAmount', payload.preApprovalAmount],
        ['preApprovalLender', payload.preApprovalLender],
        ['brokerNotes',       payload.brokerNotes],
        ['nextAppointmentAt', assessment.nextAppointmentAt],
      ]
      return optionalChecks.every(([k, v]) => na[k] === true || isFilledValue(v))
        ? 'complete' : 'in-progress'
    }
    default:
      return 'in-progress'
  }
}

// Feedback entry (typed log activity).
export function validateFeedback({ note, type, durationMinutes }) {
  const errors = {}
  const noteErr = validateRequired(note, 'Note')
    ?? validateMaxLength(note, LIMITS.notes.max, 'Note')
  if (noteErr) errors.note = noteErr

  const VALID_TYPES = new Set(['call', 'email', 'sms', 'telegram', 'note'])
  if (type && !VALID_TYPES.has(type)) errors.type = 'Invalid interaction type'

  if (durationMinutes != null && durationMinutes !== '') {
    if (type !== 'call') errors.durationMinutes = 'Duration only applies to calls'
    else {
      const e = validatePositiveInt(durationMinutes, LIMITS.callDuration.max, 'Duration')
      if (e) errors.durationMinutes = e
    }
  }
  return Object.keys(errors).length ? errors : null
}
