import { supabase } from './supabase'

const CADENCE = { Hot: 'Every 3 months', Warm: 'Every 6 months', Cold: 'Every 12 months' }

function mapRowToCustomer(row) {
  return {
    id: row.id,
    name: row.name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    channel: row.channel ?? 'Call',
    category: row.category ?? 'Cold',
    notes: row.notes ?? '',
    interestedProperty: '',
    createdAt: row.created_at,
    lastContactedAt: row.last_contacted_at ?? null,
    followUpCadence: CADENCE[row.category] ?? CADENCE.Cold,
    feedback: [],
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
