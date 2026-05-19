import { supabase } from './supabase'
import { getPropertyMediaSignedUrls } from './mediaService'
import {
  validateRequired,
  validateMaxLength,
  LIMITS,
  ValidationError,
} from '../utils/validators'

const TELEGRAM_CAPTION_LIMIT = 1024  // hard limit on caption length per Telegram API

// ─────────────────────────────────────────────────────────────────────────────
// createBroadcast — Phase 8 Slice 2 contract
//
// What the client sends:
//   - propertyId
//   - body
//   - audienceFilter ('All' | 'Hot' | 'Warm' | 'Cold')
//   - includeMedia
//   - idempotencyKey  (optional — caller pins it across retries; auto-gen if absent)
//
// What the client does NOT send anymore (vs Slice 1 / Phase 6):
//   - recipients list  → the edge fn derives it from audienceFilter via RLS
//   - per-recipient telegramChatId / body in the invoke payload  → server-derived
//
// Why: audit C11 — a tampered client could previously insert message_recipients
// rows for any customer they own regardless of audience filter. With the new
// flow, audience_filter on the message is the only knob; the edge fn does the
// customer query under the caller's JWT.
//
// Idempotency (audit C10): if the same idempotencyKey is submitted twice, the
// second insert collides (UNIQUE on `messages (auth_user_id, idempotency_key)`
// from migration 0013). We catch the 23505, look up the existing message, and
// invoke the edge fn with that id — it follows the retry path and only resends
// previously-failed recipients.
// ─────────────────────────────────────────────────────────────────────────────
export async function createBroadcast({
  propertyId,
  body,
  audienceFilter,
  includeMedia = false,
  idempotencyKey,
}) {
  // 1) Client-side pre-flight (defense in depth — edge fn re-validates).
  //    Recipient gate is BroadcastPanel's job (it has the live count); here we
  //    just validate the body length.
  const bodyErr = validateRequired(body, 'Message')
    ?? validateMaxLength(body, LIMITS.messageBody.max, 'Message')
  if (bodyErr) throw new ValidationError({ body: bodyErr })

  // 2) Stable idempotency key. If the caller didn't pin one, generate now —
  //    a single createBroadcast invocation is one logical broadcast.
  const key = idempotencyKey ?? crypto.randomUUID()

  // 3) Optionally build the signed media URLs the edge fn forwards to
  //    Telegram's sendMediaGroup. Failure → fall back to text-only.
  let mediaUrls = []
  if (includeMedia && propertyId) {
    try {
      mediaUrls = await getPropertyMediaSignedUrls(propertyId, 10)
    } catch (e) {
      console.warn('Failed to build media URLs, sending text-only:', e)
      mediaUrls = []
    }
  }
  const willSendMedia = mediaUrls.length > 0

  // 4) Insert the message row. Most calls are first-time; the catch handles
  //    the rare retry case where the same idempotency_key was already inserted.
  let message
  const { data: inserted, error: msgError } = await supabase
    .from('messages')
    .insert({
      property_id: propertyId || null,
      body,
      channel: 'Telegram',
      audience_filter: audienceFilter,
      // recipient_count is backfilled by the edge fn after it derives the
      // audience. Default 0 so the column is never null.
      recipient_count: 0,
      includes_media: willSendMedia,
      idempotency_key: key,
    })
    .select()
    .single()

  if (msgError) {
    // 23505 = unique_violation. We've already inserted a message with this
    // idempotency_key for this agent — it's a retry. Look it up and reuse.
    if (msgError.code === '23505') {
      const { data: existing, error: lookupErr } = await supabase
        .from('messages')
        .select('id')
        .eq('idempotency_key', key)
        .maybeSingle()
      if (lookupErr || !existing) {
        throw lookupErr ?? new Error('idempotency collision but lookup returned no row')
      }
      message = existing
    } else {
      throw msgError
    }
  } else {
    message = inserted
  }

  // 5) Invoke the edge function. The fn derives recipients server-side (first
  //    call) or resends previously-failed ones (retry call) — the client
  //    payload is the same either way.
  const { data: result, error: fnError } = await supabase.functions.invoke('send-telegram', {
    body: {
      messageId: message.id,
      mediaUrls,                          // shared across all recipients
      captionLimit: TELEGRAM_CAPTION_LIMIT,
    },
  })

  if (fnError) throw fnError
  if (result && result.ok === false) {
    // Edge fn returned a structured error code (auth / not_found /
    // recipient_cap / internal etc.). Surface it as a thrown error so the
    // BroadcastPanel toast catches it.
    throw new Error(result.error || 'Broadcast failed')
  }

  return {
    ok: true,
    sent:           result?.sent   ?? 0,
    failed:         result?.failed ?? 0,
    results:        result?.results ?? [],
    includedMedia:  willSendMedia,
    idempotencyKey: key,
  }
}

export async function listBroadcastsForProperty(propertyId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, body, audience_filter, recipient_count, sent_at, includes_media, message_recipients(id, status)')
    .eq('property_id', propertyId)
    .order('sent_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return data.map(mapMessage)
}

export async function listAllBroadcasts() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, body, channel, audience_filter, recipient_count, sent_at, includes_media, property_id, properties(address, suburb)')
    .order('sent_at', { ascending: false })

  if (error) throw error
  return data.map(mapMessage)
}

function mapMessage(row) {
  const recipients = row.message_recipients ?? []
  return {
    id: row.id,
    body: row.body,
    channel: row.channel,
    audienceFilter: row.audience_filter ?? 'All',
    recipientCount: row.recipient_count,
    sentAt: row.sent_at,
    includesMedia: !!row.includes_media,
    propertyId: row.property_id,
    propertyAddress: row.properties
      ? `${row.properties.address}${row.properties.suburb ? ', ' + row.properties.suburb : ''}`
      : null,
    sentCount:   recipients.filter((r) => r.status === 'sent').length,
    failedCount: recipients.filter((r) => r.status === 'failed').length,
  }
}
