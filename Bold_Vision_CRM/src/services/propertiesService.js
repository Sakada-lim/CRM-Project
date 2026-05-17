import { supabase } from './supabase'
import { computeBadge } from '../utils/property'
import { formatSqm, parsePriceGuideString } from '../utils/formatters'

const DAY_MS = 24 * 60 * 60 * 1000

function mapRowToProperty(row) {
  const listedAt = row.listed_at
  const status = row.status
  const landSizeSqm = row.land_size_sqm
  const houseSizeSqm = row.house_size_sqm
  const listedAtMs = listedAt ? new Date(listedAt).getTime() : Date.now()
  const soldAt = row.status_timeline?.soldAt
  const parsedPrice = parsePriceGuideString(row.price_guide)

  return {
    id: row.id,
    address: row.address ?? '',
    suburb: row.suburb ?? '',
    state: row.state ?? '',
    postcode: row.postcode ?? '',
    type: row.type ?? 'House',
    status,
    statusBadge: computeBadge(listedAt, status),
    priceGuide: row.price_guide ?? '',
    priceMin: parsedPrice.min,
    priceMax: parsedPrice.max,
    listedAt,
    statusUpdatedAt: row.status_updated_at,
    createdAt: row.created_at,
    statusTimeline: row.status_timeline ?? {
      listedAt,
      offerReceivedAt: null,
      soldAt: null,
    },
    bedrooms: row.bedrooms ?? 0,
    bathrooms: row.bathrooms ?? 0,
    carSpaces: row.car_spaces ?? 0,
    carparkSpaces: row.carpark_spaces ?? row.car_spaces ?? 0,
    carparkType: row.carpark_type ?? 'Street parking',
    landSizeSqm,
    landSize: formatSqm(landSizeSqm),
    houseSizeSqm,
    houseSize: formatSqm(houseSizeSqm),
    mainPhoto: row.main_photo_path ?? null,
    photos: (row.property_photos ?? [])
      .filter((p) => p.kind === 'photo')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({ id: p.id, storagePath: p.storage_path, caption: p.caption })),
    floorplans: (row.property_photos ?? [])
      .filter((p) => p.kind === 'floorplan')
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({ id: p.id, storagePath: p.storage_path, caption: p.caption })),
    description: row.description ?? '',
    notes: row.notes ?? '',
    highlights: row.highlights ?? [],
    amenities: row.amenities ?? [],
    agentName:  row.agent_name  ?? null,
    agentPhone: row.agent_phone ?? null,
    agentEmail: row.agent_email ?? null,
    interestedCustomers: [],
    daysOnMarket: Math.max(
      1,
      Math.round(
        ((soldAt ? new Date(soldAt).getTime() : Date.now()) - listedAtMs) / DAY_MS,
      ),
    ),
  }
}

function mapPropertyToRow(property) {
  const row = {}
  const fields = {
    address: property.address,
    suburb: property.suburb,
    state: property.state,
    postcode: property.postcode,
    type: property.type,
    status: property.status,
    price_guide: property.priceGuide,
    listed_at: property.listedAt,
    status_updated_at: property.statusUpdatedAt,
    status_timeline: property.statusTimeline,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    car_spaces: property.carSpaces,
    carpark_spaces: property.carparkSpaces,
    carpark_type: property.carparkType,
    land_size_sqm: property.landSizeSqm || null,
    house_size_sqm: property.houseSizeSqm || null,
    main_photo_path: property.mainPhoto || null,
    description: property.description,
    notes: property.notes,
    highlights: property.highlights ?? [],
    amenities: property.amenities ?? [],
    agent_name:  property.agentName  || null,
    agent_phone: property.agentPhone || null,
    agent_email: property.agentEmail || null,
  }
  // Only include defined fields
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) row[key] = value
  }
  return row
}

export async function listProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapRowToProperty)
}

export async function getProperty(id) {
  const { data, error } = await supabase
    .from('properties')
    .select('*, property_photos(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return mapRowToProperty(data)
}

export async function createProperty(payload) {
  const row = mapPropertyToRow(payload)
  const { data, error } = await supabase.from('properties').insert(row).select().single()
  if (error) throw error
  return mapRowToProperty(data)
}

export async function updateProperty(id, payload) {
  const row = mapPropertyToRow(payload)
  const { data, error } = await supabase
    .from('properties')
    .update(row)
    .eq('id', id)
    .select('*, property_photos(*)')
    .single()
  if (error) throw error
  return mapRowToProperty(data)
}

export async function deleteProperty(id) {
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw error
}
