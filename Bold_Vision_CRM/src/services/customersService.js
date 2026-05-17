import { supabase } from './supabase'

function mapRowToCustomer(row) {
  return {
    id: row.id,
    name: row.name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    channel: row.channel ?? 'Call',
    category: row.category ?? 'Cold',
    notes: row.notes ?? '',
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
  const row = mapCustomerToRow(payload)
  const { data, error } = await supabase.from('customers').insert(row).select().single()
  if (error) throw error
  return mapRowToCustomer(data)
}

export async function updateCustomer(id, payload) {
  const row = mapCustomerToRow(payload)
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

const FEEDBACK_TYPES = new Set(['call', 'email', 'sms', 'note'])

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
