import { supabase } from './supabase'
import { validatePhotoFile, ValidationError } from '../utils/validators'

const BUCKET = { photo: 'property-photos', floorplan: 'property-floorplans' }
const SIGNED_URL_TTL = 3600

// Simple in-memory cache so repeated renders don't re-request the same URL.
// Keys are storage paths; values are { url, expiresAt } where expiresAt is a JS timestamp.
const urlCache = new Map()

export async function uploadPropertyImage(propertyId, file, { kind = 'photo' } = {}) {
  // Service-layer guard: callers can bypass the UI (devtools, programmatic
  // upload) — enforce size/type here too. Bucket policy is the final net.
  const err = validatePhotoFile(file)
  if (err) throw new ValidationError({ file: err })

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

// Lists all photos + floor plans for a property (sorted by sort_order).
// Used by BroadcastPanel to count media and by messagesService to build the
// Telegram album.
export async function listPropertyMedia(propertyId) {
  const { data, error } = await supabase
    .from('property_photos')
    .select('id, kind, storage_path, sort_order')
    .eq('property_id', propertyId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

// Generates short-TTL signed URLs for the property's media, suitable for
// passing to Telegram's sendMediaGroup. Photos come first, then floor plans
// (both internally ordered by sort_order). Capped at `limit` items.
export async function getPropertyMediaSignedUrls(propertyId, limit = 10) {
  const items = await listPropertyMedia(propertyId)
  const sorted = [...items].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'photo' ? -1 : 1
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })
  const top = sorted.slice(0, limit)

  const urls = []
  for (const item of top) {
    const bucket = BUCKET[item.kind] ?? BUCKET.photo
    // 600s TTL — enough headroom for Telegram to fetch even if the broadcast
    // takes a couple minutes to flush through all recipients.
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(item.storage_path, 600)
    if (!error && data?.signedUrl) urls.push(data.signedUrl)
  }
  return urls
}
