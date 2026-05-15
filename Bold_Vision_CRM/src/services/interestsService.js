import { supabase } from './supabase'

export async function listForProperty(propertyId) {
  const { data, error } = await supabase
    .from('property_interests')
    .select('id, interest_level, updated_at, customer:customers(id, name, phone, email, category)')
    .eq('property_id', propertyId)
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    interestLevel: row.interest_level,
    updatedAt: row.updated_at,
    customerId: row.customer.id,
    customerName: row.customer.name,
    customerPhone: row.customer.phone,
    customerEmail: row.customer.email,
    customerCategory: row.customer.category,
  }))
}

export async function listForCustomer(customerId) {
  const { data, error } = await supabase
    .from('property_interests')
    .select('id, interest_level, updated_at, property:properties(id, address, suburb, status, price_guide, type)')
    .eq('customer_id', customerId)
  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    interestLevel: row.interest_level,
    updatedAt: row.updated_at,
    propertyId: row.property.id,
    propertyAddress: row.property.address,
    propertySuburb: row.property.suburb,
    propertyStatus: row.property.status,
    propertyPriceGuide: row.property.price_guide,
    propertyType: row.property.type,
  }))
}

export async function upsertInterest(propertyId, customerId, interestLevel) {
  const { error } = await supabase
    .from('property_interests')
    .upsert(
      {
        property_id: propertyId,
        customer_id: customerId,
        interest_level: interestLevel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'property_id,customer_id' },
    )
  if (error) throw error
}

export async function removeInterest(propertyId, customerId) {
  const { error } = await supabase
    .from('property_interests')
    .delete()
    .eq('property_id', propertyId)
    .eq('customer_id', customerId)
  if (error) throw error
}
