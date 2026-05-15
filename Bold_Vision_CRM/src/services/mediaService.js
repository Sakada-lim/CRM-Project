import { supabase } from './supabase'

const BUCKET = { photo: 'property-photos', floorplan: 'property-floorplans' }
const SIGNED_URL_TTL = 3600

// Simple in-memory cache so repeated renders don't re-request the same URL.
// Keys are storage paths; values are { url, expiresAt } where expiresAt is a JS timestamp.
const urlCache = new Map()

export async function uploadPropertyImage(propertyId, file, { kind = 'photo' } = {}) {
  const { data: { user } } = await supabase.auth.getUser()
  const ext = file.name.split('.').pop()
  const path = `${user.id}/${propertyId}/${Date.now()}.${ext}`
  const bucket = BUCKET[kind]

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('property_photos')
    .insert({ property_id: propertyId, kind, storage_path: path, sort_order: 0 })
    .select()
    .single()
  if (error) throw error

  return data
}

export async function deletePropertyImage(photoId) {
  const { data: photo, error: fetchError } = await supabase
    .from('property_photos')
    .select('storage_path, kind')
    .eq('id', photoId)
    .single()
  if (fetchError) throw fetchError

  const { error: storageError } = await supabase.storage
    .from(BUCKET[photo.kind])
    .remove([photo.storage_path])
  if (storageError) throw storageError

  urlCache.delete(photo.storage_path)

  const { error } = await supabase.from('property_photos').delete().eq('id', photoId)
  if (error) throw error
}

export async function getSignedUrl(storagePath, kind = 'photo') {
  const cached = urlCache.get(storagePath)
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.url

  const { data, error } = await supabase.storage
    .from(BUCKET[kind])
    .createSignedUrl(storagePath, SIGNED_URL_TTL)
  if (error) throw error

  urlCache.set(storagePath, { url: data.signedUrl, expiresAt: Date.now() + SIGNED_URL_TTL * 1000 })
  return data.signedUrl
}

export async function reorderPhotos(orderedIds) {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('property_photos').update({ sort_order: index }).eq('id', id),
    ),
  )
}
