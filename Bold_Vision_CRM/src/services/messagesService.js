import { supabase } from './supabase'
import { getPropertyMediaSignedUrls } from './mediaService'

const TELEGRAM_CAPTION_LIMIT = 1024  // hard limit on caption length per Telegram API

export async function createBroadcast({ propertyId, body, audienceFilter, customers, includeMedia = false }) {
  const recipientCustomers = customers.filter((c) => c.telegramChatId)

  // 1) Optionally build the media album (signed URLs the edge fn forwards
  //    to Telegram's sendMediaGroup). Same URLs reused for all recipients.
  let mediaUrls = []
  if (includeMedia && propertyId) {
    try {
      mediaUrls = await getPropertyMediaSignedUrls(propertyId, 10)
    } catch (e) {
      // Don't block the broadcast on a media-fetch failure — fall back to text.
      console.warn('Failed to build media URLs, sending text-only:', e)
      mediaUrls = []
    }
  }
  const willSendMedia = mediaUrls.length > 0

  // 2) Create the message record
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      property_id: propertyId || null,
      body,
      channel: 'Telegram',
      audience_filter: audienceFilter,
      recipient_count: recipientCustomers.length,
      includes_media: willSendMedia,
    })
    .select()
    .single()

  if (msgError) throw msgError

  if (recipientCustomers.length === 0) {
    return { ok: true, sent: 0, failed: 0, results: [] }
  }

  // 3) Create queued recipient rows
  const { data: recipients, error: recipError } = await supabase
    .from('message_recipients')
    .insert(
      recipientCustomers.map((c) => ({
        message_id: message.id,
        customer_id: c.id,
        telegram_chat_id: c.telegramChatId,
        status: 'queued',
      })),
    )
    .select()

  if (recipError) throw recipError

  // 4) Invoke edge function — sends messages and updates statuses
  const { data: result, error: fnError } = await supabase.functions.invoke('send-telegram', {
    body: {
      messageId: message.id,
      recipients: recipients.map((r) => ({
        recipientId: r.id,
        customerId: r.customer_id,
        telegramChatId: r.telegram_chat_id,
        body,
      })),
      mediaUrls,                              // shared across all recipients
      captionLimit: TELEGRAM_CAPTION_LIMIT,
    },
  })

  if (fnError) throw fnError

  const sent   = result.results?.filter((r) => r.status === 'sent').length  ?? 0
  const failed = result.results?.filter((r) => r.status === 'failed').length ?? 0

  return { ok: true, sent, failed, results: result.results ?? [], includedMedia: willSendMedia }
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
