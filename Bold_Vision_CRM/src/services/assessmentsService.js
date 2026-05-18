import { supabase } from './supabase'
import {
  validateAssessmentSection,
  validateMaxLength,
  validateDateMaxFuture,
  ValidationError,
  LIMITS,
} from '../utils/validators'

// Section payload shapes (JSONB columns on customer_assessments).
// PDF page 1 → personal/employment/income/assets/liabilities;
// PDF page 2 → discovery. notes covers free-text only — the four meta
// fields (consultant_name, broker_name, date_completed, next_appointment_at)
// live on top-level columns.
//
// personal:    { client1: { fullName, dob, age, maritalStatus, dependantsCount,
//                           dependantsAge, residency, residencyOther, phone, address,
//                           housingStatus, rentAmount, rentFreq, purposeLocation,
//                           purpose, isFhb }, client2: { same } }
// employment:  { client1: { occupation, employer, yearsInRole, workStatus, hours,
//                           probation, previousJobNote }, client2: { same } }
// income:      { client1: { salaryWages:{gross,freq}, bonus, currentJobPayAfterTax,
//                           centrelinkDva, rentInvestmentProperties:{amount,freq},
//                           other:{amount,details} }, client2: { same } }
// assets:      { principalResidence, homeContents, vehicle1, vehicle2,
//                cashBankAccounts, futureSavings, investmentProperty1..3,
//                otherLifestyle, directShares, managedFunds1, managedFunds2,
//                superannuation1, superannuation2, otherAsset }
// liabilities: { rows: [{ id, type, details, value, lender, remainingTerm,
//                         interestRate, repayment }] }
// discovery:   { q1_contactedBroker, q2_lookingDuration, q3_buyTimeline,
//                q4_talkedBuildersAgents, q5_purpose, q6_areaOfInterest,
//                q7_budgetMin, q7_budgetMax, q8_propertyType, q9_requirements,
//                q10_landSize, q11_landTitledDate, q12_mostImportant,
//                q13_biggestConcern, q14_depositAmount }
// notes:       { consultantNotes, brokerNotes }

const SECTION_KEYS = ['personal', 'employment', 'income', 'assets', 'liabilities', 'discovery', 'notes']

function mapRowToAssessment(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    status: row.status,
    consultantName: row.consultant_name ?? '',
    brokerName: row.broker_name ?? '',
    dateCompleted: row.date_completed ?? null,
    nextAppointmentAt: row.next_appointment_at ?? null,
    personal: row.personal ?? {},
    employment: row.employment ?? {},
    income: row.income ?? {},
    assets: row.assets ?? {},
    liabilities: row.liabilities ?? {},
    discovery: row.discovery ?? {},
    notes: row.notes ?? {},
    touchedSections: Array.isArray(row.touched_sections) ? row.touched_sections : [],
    startedAt: row.started_at,
    submittedAt: row.submitted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getLatestForCustomer(customerId) {
  const { data, error } = await supabase
    .from('customer_assessments')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? mapRowToAssessment(data) : null
}

export async function createDraft(customerId) {
  const { data, error } = await supabase
    .from('customer_assessments')
    .insert({ customer_id: customerId })
    .select('*')
    .single()
  if (error) throw error
  return mapRowToAssessment(data)
}

export async function updateSection(assessmentId, sectionKey, payload, touchedSections) {
  if (!SECTION_KEYS.includes(sectionKey)) {
    throw new Error(`Unknown assessment section: ${sectionKey}`)
  }
  // Validate the section payload before sending. Throws ValidationError on
  // length / format / range violations so the autosave halts and the store
  // surfaces a toast rather than silently writing garbage.
  const errs = validateAssessmentSection(sectionKey, payload)
  if (errs) throw new ValidationError(errs, `Invalid ${sectionKey} section`)

  const patch = { [sectionKey]: payload }
  if (Array.isArray(touchedSections)) patch.touched_sections = touchedSections
  const { data, error } = await supabase
    .from('customer_assessments')
    .update(patch)
    .eq('id', assessmentId)
    .select('*')
    .single()
  if (error) throw error
  return mapRowToAssessment(data)
}

export async function updateMeta(assessmentId, partial) {
  // Validate top-level meta fields the same way
  const errors = {}
  if (partial.consultantName !== undefined) {
    const e = validateMaxLength(partial.consultantName, LIMITS.assessmentText.max, 'Consultant')
    if (e) errors.consultantName = e
  }
  if (partial.brokerName !== undefined) {
    const e = validateMaxLength(partial.brokerName, LIMITS.assessmentText.max, 'Broker')
    if (e) errors.brokerName = e
  }
  if (partial.nextAppointmentAt !== undefined && partial.nextAppointmentAt) {
    const e = validateDateMaxFuture(partial.nextAppointmentAt, 5, 'Next appointment')
    if (e) errors.nextAppointmentAt = e
  }
  if (Object.keys(errors).length) throw new ValidationError(errors)

  const patch = {}
  if (partial.consultantName !== undefined) patch.consultant_name = partial.consultantName
  if (partial.brokerName !== undefined) patch.broker_name = partial.brokerName
  if (partial.dateCompleted !== undefined) patch.date_completed = partial.dateCompleted
  if (partial.nextAppointmentAt !== undefined) patch.next_appointment_at = partial.nextAppointmentAt
  const { data, error } = await supabase
    .from('customer_assessments')
    .update(patch)
    .eq('id', assessmentId)
    .select('*')
    .single()
  if (error) throw error
  return mapRowToAssessment(data)
}

export async function submitAssessment(assessmentId) {
  const { data, error } = await supabase
    .from('customer_assessments')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', assessmentId)
    .select('*')
    .single()
  if (error) throw error
  return mapRowToAssessment(data)
}
