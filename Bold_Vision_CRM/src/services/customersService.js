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

export async function listFeedback(customerId) {
  const { data, error } = await supabase
    .from('customer_feedback')
    .select('id, note, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map((row) => ({ id: row.id, note: row.note, date: row.created_at }))
}

export async function addFeedback(customerId, note) {
  const { data, error } = await supabase
    .from('customer_feedback')
    .insert({ customer_id: customerId, note })
    .select('id, note, created_at')
    .single()
  if (error) throw error
  return { id: data.id, note: data.note, date: data.created_at }
}
