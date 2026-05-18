// @ts-nocheck — runs on Deno (Supabase Edge Functions). The Deno global +
// URL imports below aren't recognised by VS Code's built-in TS server.
// Standard Supabase workaround; runtime correctness is unaffected.
//
// ─────────────────────────────────────────────────────────────────────────────
// Phase 8 Slice 2 — Telegram broadcast hardening
//
// This function is callable from the Bold Vision CRM frontend to dispatch a
// previously-created `messages` row to its queued `message_recipients`.
//
// Security model:
// 1. `verify_jwt = true` is set in Supabase Dashboard for this function, so
//    the gateway rejects anonymous calls before they even reach this code.
// 2. We pull the caller's JWT from the Authorization header and build a
//    user-scoped Supabase client. RLS then enforces that the caller can only
//    read messages + recipients they own.
// 3. We DO NOT trust any recipient list from the request body. The client
//    sends only `messageId` (+ media URLs). We derive recipients server-side
//    from `message_recipients` rows that the client created under RLS.
// 4. Idempotency: recipients already marked `status='sent'` are skipped, so
//    retrying the same broadcast (double-click, network blip) only resends
//    the previously-failed ones.
// 5. CORS is restricted to an env-configured allowlist instead of `*`.
//
// Operational safeguards:
// - Per-fetch timeout (10s) prevents the whole function from hanging when
//   Telegram is slow.
// - Recipients sent in batches of 25 with a 1.1s pause between batches to
//   respect Telegram's ~30 msg/sec global rate limit.
// - Errors are mapped to an enum of public codes (auth / not_found /
//   recipient_cap / rate_limited / telegram_unreachable / internal) so we
//   don't leak internal details to a malicious caller. Structured JSON
//   logging on the server side preserves the raw cause for debugging.
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Env wiring ──────────────────────────────────────────────────────────────
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ANON_KEY      = Deno.env.get('SUPABASE_ANON_KEY')
const BOT_TOKEN     = Deno.env.get('TELEGRAM_BOT_TOKEN')
// Comma-separated origins, e.g. "http://localhost:5173,https://crm.example.com"
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',').map((s) => s.trim()).filter(Boolean)

// Fail loudly at module load if any required env is missing — much easier to
// diagnose than a runtime null-deref deep inside the handler.
if (!SUPABASE_URL)  throw new Error('SUPABASE_URL env var missing')
if (!SERVICE_KEY)   throw new Error('SUPABASE_SERVICE_ROLE_KEY env var missing')
if (!ANON_KEY)      throw new Error('SUPABASE_ANON_KEY env var missing')
if (!BOT_TOKEN)     throw new Error('TELEGRAM_BOT_TOKEN env var missing')

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`

// ── Tunables ────────────────────────────────────────────────────────────────
const DEFAULT_CAPTION_LIMIT = 1024     // Telegram cap on media-album captions
const RECIPIENT_CAP         = 200      // Mirror of client LIMITS.recipientCap.max
const BATCH_SIZE            = 25       // Recipients per fan-out batch
const BATCH_PAUSE_MS        = 1100     // Pause between batches (~30 msg/sec global limit)
const TELEGRAM_TIMEOUT_MS   = 10_000   // Per-fetch timeout to prevent hangs

// ── CORS helpers ────────────────────────────────────────────────────────────
function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || ''
  // Echo the origin back if it's allowlisted, otherwise omit the header so
  // the browser blocks the response.
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ''
  return {
    'Access-Control-Allow-Origin':  allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function json(req: Request, payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

function jsonError(req: Request, code: string, status: number) {
  return json(req, { ok: false, error: code }, status)
}

// ── Structured log helper ───────────────────────────────────────────────────
// One JSON object per line, filterable in Supabase Function Logs by any field.
function log(level: 'info' | 'warn' | 'error', message: string, extra: Record<string, unknown> = {}) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level,
    fn: 'send-telegram',
    message,
    ...extra,
  }))
}

// ── Telegram error mapping ──────────────────────────────────────────────────
// Map Telegram API errors to one of our public codes. We log the raw error
// server-side but only show the enum to callers.
function mapTelegramError(data: { description?: string; error_code?: number }): string {
  const code = data.error_code
  if (code === 429) return 'rate_limited'
  if (code === 403) return 'blocked_by_user'      // user blocked the bot
  if (code === 400) return 'invalid_chat'         // chat doesn't exist / wrong id
  return 'telegram_error'
}

// ── Main handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) })
  }
  if (req.method !== 'POST') {
    return jsonError(req, 'method_not_allowed', 405)
  }

  // The Authorization header carries the caller's JWT. With verify_jwt=true
  // in Dashboard the gateway already rejected missing/invalid tokens before
  // we got here — but we still need the raw string to build a user-scoped
  // client below.
  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return jsonError(req, 'auth', 401)
  }
  const jwt = authHeader.slice(7)

  let payload: { messageId?: string; mediaUrls?: string[]; captionLimit?: number }
  try {
    payload = await req.json()
  } catch {
    return jsonError(req, 'bad_request', 400)
  }
  const { messageId, mediaUrls = [], captionLimit = DEFAULT_CAPTION_LIMIT } = payload
  if (!messageId || typeof messageId !== 'string') {
    return jsonError(req, 'bad_request', 400)
  }

  // User-scoped client: RLS applies. Used for reads where the policy must
  // confirm the caller owns the data (message + recipients).
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  })

  // Service-role client: bypasses RLS. Used ONLY for the recipient-row
  // status UPDATE after we've verified ownership above. Required because
  // status writes happen in an async batch loop and re-checking RLS on
  // every row would be wasted work — ownership is established once at the
  // top of the request.
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  })

  // 1. Ownership check — read the message via the user-scoped client. RLS
  //    blocks rows not owned by the caller, so a 0-row result == "not yours."
  //    audience_filter drives the server-side recipient derivation below.
  const { data: message, error: msgErr } = await userClient
    .from('messages')
    .select('id, body, audience_filter')
    .eq('id', messageId)
    .maybeSingle()
  if (msgErr) {
    log('error', 'message lookup failed', { messageId, err: msgErr.message })
    return jsonError(req, 'internal', 500)
  }
  if (!message) {
    log('warn', 'message not found or not owned by caller', { messageId })
    return jsonError(req, 'not_found', 404)
  }

  // 2. Recipients (audit C11). The TRUTH is: a client must never pick the
  //    target customer list itself — it picks an audience filter, and the
  //    server expands that filter into recipient rows.
  //
  //    Two paths:
  //    a) First call — no message_recipients rows yet. Query the caller's
  //       customers via RLS (auth-scoped userClient), filter by audience +
  //       presence of telegram_chat_id, INSERT one queued row per customer.
  //       The (message_id, customer_id) UNIQUE from migration 0013 means a
  //       race with a concurrent call collapses cleanly.
  //    b) Retry call — rows exist. Read them; skip any with status='sent'
  //       so we resend only the failed/queued ones (audit C10 idempotency).
  //
  //    Either way we end up with a `recipients` array to dispatch.
  const { data: existing, error: existingErr } = await userClient
    .from('message_recipients')
    .select('id, customer_id, telegram_chat_id, status')
    .eq('message_id', messageId)
  if (existingErr) {
    log('error', 'recipient lookup failed', { messageId, err: existingErr.message })
    return jsonError(req, 'internal', 500)
  }

  let recipients: Array<{ id: string; customer_id: string; telegram_chat_id: string | null; status: string }>
  if (existing && existing.length > 0) {
    // Retry path — use what's there.
    recipients = existing.filter((r) => r.status !== 'sent')
    log('info', 'retry path', { messageId, existing: existing.length, toSend: recipients.length })
  } else {
    // First call — derive from audience filter via RLS-scoped customer query.
    let q = userClient
      .from('customers')
      .select('id, telegram_chat_id')
      .not('telegram_chat_id', 'is', null)
    const audience = message.audience_filter
    if (audience && audience !== 'All') {
      q = q.eq('category', audience)
    }
    const { data: targetCustomers, error: custErr } = await q
    if (custErr) {
      log('error', 'customer derivation failed', { messageId, err: custErr.message })
      return jsonError(req, 'internal', 500)
    }
    if (!targetCustomers || targetCustomers.length === 0) {
      log('info', 'no eligible customers', { messageId, audience })
      return json(req, { ok: true, sent: 0, failed: 0, skipped: 0, results: [] })
    }
    if (targetCustomers.length > RECIPIENT_CAP) {
      log('warn', 'recipient cap exceeded', { messageId, count: targetCustomers.length })
      return jsonError(req, 'recipient_cap', 400)
    }

    // Insert via admin client (service role bypasses RLS) — ownership was
    // established by the message lookup above. ON CONFLICT DO NOTHING covers
    // the rare case where two concurrent invocations race past the message
    // lookup and both try to insert.
    const insertRows = targetCustomers.map((c) => ({
      message_id: messageId,
      customer_id: c.id,
      telegram_chat_id: c.telegram_chat_id,
      status: 'queued',
    }))
    const { data: inserted, error: insertErr } = await adminClient
      .from('message_recipients')
      .upsert(insertRows, {
        onConflict: 'message_id,customer_id',
        ignoreDuplicates: true,
      })
      .select('id, customer_id, telegram_chat_id, status')
    if (insertErr) {
      log('error', 'recipient insert failed', { messageId, err: insertErr.message })
      return jsonError(req, 'internal', 500)
    }
    recipients = (inserted ?? []).filter((r) => r.status !== 'sent')
    log('info', 'derived recipients', { messageId, audience, count: recipients.length })

    // Backfill recipient_count on the message for the history view.
    await adminClient
      .from('messages')
      .update({ recipient_count: recipients.length })
      .eq('id', messageId)
  }

  if (recipients.length === 0) {
    log('info', 'nothing to send', { messageId, reason: 'all_sent_or_no_recipients' })
    return json(req, { ok: true, sent: 0, failed: 0, skipped: 0, results: [] })
  }

  log('info', 'broadcast start', {
    messageId,
    pending: recipients.length,
    hasMedia: mediaUrls.length > 0,
  })

  // 3. Batched fan-out. Telegram global cap is ~30 msg/sec — sending 25 in
  //    parallel then pausing 1.1s keeps us comfortably under.
  const results: Array<{ customerId: string; status: 'sent' | 'failed'; error: string | null }> = []
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map((r) => sendOne(r, message.body, mediaUrls, captionLimit, adminClient)),
    )
    results.push(...batchResults)
    // Don't pause after the last batch.
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((r) => setTimeout(r, BATCH_PAUSE_MS))
    }
  }

  const sent   = results.filter((r) => r.status === 'sent').length
  const failed = results.filter((r) => r.status === 'failed').length
  log('info', 'broadcast done', { messageId, sent, failed })

  return json(req, { ok: true, sent, failed, results })
})

// ── Per-recipient send ──────────────────────────────────────────────────────
// Returns one result row + updates the recipient's status in the DB. All
// network calls have a 10s timeout; an AbortError gets mapped to a `timeout`
// status so the agent can retry just the failed ones later.
async function sendOne(
  r: { id: string; customer_id: string; telegram_chat_id: string | null },
  body: string,
  mediaUrls: string[],
  captionLimit: number,
  adminClient: ReturnType<typeof createClient>,
) {
  const chatId = r.telegram_chat_id
  if (!chatId) {
    await adminClient.from('message_recipients').update({
      status: 'failed', error: 'no_chat_id',
    }).eq('id', r.id)
    return { customerId: r.customer_id, status: 'failed' as const, error: 'no_chat_id' }
  }

  try {
    const hasMedia = mediaUrls.length > 0
    let ok = false
    let errorMsg: string | null = null

    if (hasMedia) {
      // sendMediaGroup accepts up to 10 InputMedia items; caption goes on
      // the first item only. Overflow caption is sent as a follow-up text.
      const caption = body.slice(0, captionLimit)
      const captionOverflow = body.length > captionLimit ? body.slice(captionLimit) : null
      const media = mediaUrls.slice(0, 10).map((url, i) =>
        i === 0 ? { type: 'photo', media: url, caption } : { type: 'photo', media: url },
      )

      const albumRes = await fetch(`${TELEGRAM_API}/sendMediaGroup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, media }),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      })
      const albumData = await albumRes.json()

      if (albumData.ok) {
        ok = true
        if (captionOverflow) {
          await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: captionOverflow }),
            signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
          })
        }
      } else {
        // Media failed → fall back to text-only so the customer at least
        // gets the message body. Annotate the error so the history view
        // shows what happened.
        const albumErr = mapTelegramError(albumData)
        const textRes = await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: body }),
          signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
        })
        const textData = await textRes.json()
        if (textData.ok) {
          ok = true
          errorMsg = `media-failed-fallback-sent:${albumErr}`
        } else {
          errorMsg = `media-failed:${albumErr};text-failed:${mapTelegramError(textData)}`
        }
      }
    } else {
      const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: body }),
        signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
      })
      const data = await res.json()
      if (data.ok) ok = true
      else errorMsg = mapTelegramError(data)
    }

    // Persist the outcome. Service-role write — ownership was already
    // established at the top of the request.
    if (ok) {
      await adminClient.from('message_recipients').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        error: errorMsg,
      }).eq('id', r.id)
      return { customerId: r.customer_id, status: 'sent' as const, error: errorMsg }
    } else {
      await adminClient.from('message_recipients').update({
        status: 'failed',
        error: errorMsg ?? 'unknown',
      }).eq('id', r.id)
      return { customerId: r.customer_id, status: 'failed' as const, error: errorMsg }
    }
  } catch (e: any) {
    // AbortError from AbortSignal.timeout → mark recipient as timed out so
    // the agent can retry just this one later via the (future) Messages
    // history "Resend failed" action.
    const errorMsg = e?.name === 'AbortError' ? 'timeout' : 'internal'
    log('error', 'sendOne crashed', { recipientId: r.id, errName: e?.name, errMsg: String(e?.message ?? e) })
    await adminClient.from('message_recipients').update({
      status: 'failed', error: errorMsg,
    }).eq('id', r.id)
    return { customerId: r.customer_id, status: 'failed' as const, error: errorMsg }
  }
}
