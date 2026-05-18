import { supabase } from './supabase'
import {
  validateCustomerForm,
  validateFeedback,
  validateRequired,
  validateMaxLength,
  validatePhone,
  validateEmail,
  validateTelegramChatId,
  ValidationError,
  LIMITS,
} from '../utils/validators'

// Trim string fields. Mutates a shallow copy.
function trimStringFields(obj, keys) {
  const out = { ...obj }
  for (const k of keys) {
    if (typeof out[k] === 'string') out[k] = out[k].trim()
  }
  return out
}

// Full-payload validation (used by createCustomer).
function normalizeCustomerCreate(payload) {
  const clean = trimStringFields(payload, ['name', 'phone', 'email', 'notes', 'agent'])
  const errors = validateCustomerForm(clean)
  if (errors) throw new ValidationError(errors)
  return clean
}

// Partial-payload validation (used by updateCustomer). Only fields present in
// the patch are checked; the "at least one contact" rule is enforced by the
// DB CHECK rather than re-derived here (the patch may not include all three).
function normalizeCustomerUpdate(payload) {
  const clean = trimStringFields(payload, ['name', 'phone', 'email', 'notes', 'agent'])
  const errors = {}
  if ('name' in clean) {
    const e = validateRequired(clean.name, 'Name')
      ?? validateMaxLength(clean.name, LIMITS.name.max, 'Name')
    if (e) errors.name = e
  }
  if ('phone' in clean) {
    const e = validatePhone(clean.phone)
    if (e) errors.phone = e
  }
  if ('email' in clean) {
    const e = validateEmail(clean.email)
    if (e) errors.email = e
  }
  if ('telegramChatId' in clean) {
    const e = validateTelegramChatId(clean.telegramChatId)
    if (e) errors.telegramChatId = e
  }
  if ('agent' in clean) {
    const e = validateMaxLength(clean.agent, LIMITS.agent.max, 'Agent')
    if (e) errors.agent = e
  }
  if ('notes' in clean) {
    const e = validateMaxLength(clean.notes, LIMITS.notes.max, 'Notes')
    if (e) errors.notes = e
  }
  if (Object.keys(errors).length) throw new ValidationError(errors)
  return clean
}

function mapRowToCustomer(row) {
  return {
    id: row.id,
    name: row.name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    channel: row.channel ?? 'Call',
    category: row.category ?? 'Cold',
    notes: row.notes ?? '',
    agent: row.agent ?? '',
    createdAt: row.created_at,
    lastContactedAt: row.last_contacted_at ?? null,
    nextContactAt: row.next_contact_at ?? null,
    telegramChatId: row.telegram_chat_id ?? null,
    telegramEnrollmentToken: row.telegram_enrollment_token ?? null,
  }
}

function mapCustomerToRow(customer) {
  const fields = {
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    channel: customer.channel,
    category: customer.category,
    notes: customer.notes,
    agent: customer.agent,
  }
  const row = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) row[key] = value
  }
  return row
}

export async function listCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapRowToCustomer)
}

export async function getCustomer(id) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return mapRowToCustomer(data)
}

export async function createCustomer(payload) {
  const clean = normalizeCustomerCreate(payload)
  const row = mapCustomerToRow(clean)
  const { data, error } = await supabase.from('customers').insert(row).select().single()
  if (error) throw error
  return mapRowToCustomer(data)
}

export async function updateCustomer(id, payload) {
  const clean = normalizeCustomerUpdate(payload)
  const row = mapCustomerToRow(clean)
  const { data, error } = await supabase
    .from('customers')
    .update(row)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapRowToCustomer(data)
}

export async function deleteCustomer(id) {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

export async function setLastContacted(id, dateIso) {
  const { error } = await supabase
    .from('customers')
    .update({ last_contacted_at: dateIso })
    .eq('id', id)
  if (error) throw error
}

export async function setNextContactAt(id, dateIso) {
  const { error } = await supabase
    .from('customers')
    .update({ next_contact_at: dateIso })
    .eq('id', id)
  if (error) throw error
}

const FEEDBACK_TYPES = new Set(['call', 'email', 'sms', 'note', 'telegram'])

function mapFeedbackRow(row) {
  return {
    id: row.id,
    note: row.note,
    date: row.created_at,
    type: row.type ?? 'note',
    durationMinutes: row.duration_minutes ?? null,
  }
}

function normalizeFeedbackPayload(input) {
  if (input == null) return { note: '', type: 'note', durationMinutes: null }
  if (typeof input === 'string') {
    return { note: input, type: 'note', durationMinutes: null }
  }
  const type = FEEDBACK_TYPES.has(input.type) ? input.type : 'note'
  const durationMinutes =
    type === 'call' && Number.isFinite(Number(input.durationMinutes))
      ? Number(input.durationMinutes)
      : null
  return {
    note: input.note ?? '',
    type,
    durationMinutes,
  }
}

export async function listFeedback(customerId) {
  const { data, error } = await supabase
    .from('customer_feedback')
    .select('id, note, created_at, type, duration_minutes')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapFeedbackRow)
}

export async function addFeedback(customerId, input) {
  const { note, type, durationMinutes } = normalizeFeedbackPayload(input)
  // Final safety check: enforce note length + duration/type coupling
  const errors = validateFeedback({ note, type, durationMinutes })
  if (errors) throw new ValidationError(errors)
  const { data, error } = await supabase
    .from('customer_feedback')
    .insert({
      customer_id: customerId,
      note,
      type,
      duration_minutes: durationMinutes,
    })
    .select('id, note, created_at, type, duration_minutes')
    .single()
  if (error) throw error
  return mapFeedbackRow(data)
}
