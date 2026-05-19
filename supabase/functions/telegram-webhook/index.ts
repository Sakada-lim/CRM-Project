// @ts-nocheck — runs on Deno (Supabase Edge Functions). The Deno global +
// URL imports below aren't recognised by VS Code's built-in TS server.
// Standard Supabase workaround; runtime correctness is unaffected.
//
// ─────────────────────────────────────────────────────────────────────────────
// Phase 8 Slice 2 — Telegram webhook hardening
//
// Receives Update events from Telegram's Bot API. We use it for one thing:
// new customers DM `/start <enrollment_token>` to bind their Telegram chat
// to their CRM customer row.
//
// Security model:
// 1. `verify_jwt = false` MUST stay in Dashboard for this function (Telegram
//    won't send a Supabase JWT — it's an external service).
// 2. Instead, we verify `X-Telegram-Bot-Api-Secret-Token` matches our
//    `TELEGRAM_WEBHOOK_SECRET` env var. This secret is configured at the
//    same time as the webhook URL via Telegram's `setWebhook` call; only
//    Telegram (and us) know it. Missing/wrong header → 401.
// 3. Rate-limit `/start <token>` lookups per source IP (best-effort,
//    per-instance) to slow down brute-force enrollment-token guessing. The
//    real defense is the 128-bit token entropy from migration 0013; the
//    rate limiter is belt-and-suspenders.
//
// Operational safeguards:
// - All env vars asserted at module load.
// - Updates to customers wrapped in try/catch — the new partial UNIQUE on
//   telegram_chat_id (migration 0013) will reject re-binding an already-
//   used chat to a different customer. We catch that and reply with a
//   friendly "chat already bound" message instead of a 500.
// - Always returns 200 on successful processing (per Telegram's retry rule
//   — a non-200 triggers a 24-hour retry loop). 401 only on auth failure.
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Env wiring ──────────────────────────────────────────────────────────────
const BOT_TOKEN       = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')
const SERVICE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const WEBHOOK_SECRET  = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')

if (!BOT_TOKEN)      throw new Error('TELEGRAM_BOT_TOKEN env var missing')
if (!SUPABASE_URL)   throw new Error('SUPABASE_URL env var missing')
if (!SERVICE_KEY)    throw new Error('SUPABASE_SERVICE_ROLE_KEY env var missing')
if (!WEBHOOK_SECRET) throw new Error('TELEGRAM_WEBHOOK_SECRET env var missing')

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`

// ── Tunables ────────────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000   // 1 minute
const RATE_LIMIT_MAX       = 10       // /start lookups per IP per window
const TELEGRAM_TIMEOUT_MS  = 10_000

// ── Structured log helper ───────────────────────────────────────────────────
function log(level: 'info' | 'warn' | 'error', message: string, extra: Record<string, unknown> = {}) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level,
    fn: 'telegram-webhook',
    message,
    ...extra,
  }))
}

// ── Rate limiter (in-memory, per-instance) ──────────────────────────────────
// Best-effort defense. Edge fns are stateless + short-lived so attackers
// spread across instances bypass this. The real defense is 128-bit tokens
// from migration 0013 — this just slows down loud brute-force attempts to
// a single instance.
const rateMap = new Map<string, { count: number; resetAt: number }>()
function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

function clientIp(req: Request): string {
  // Supabase edge fns sit behind Cloudflare. Prefer cf-connecting-ip; fall
  // back to the first IP in x-forwarded-for. 'unknown' if neither is set
  // (only happens for direct localhost dev calls).
  return req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown'
}

// ── Telegram helper ─────────────────────────────────────────────────────────
async function sendMessage(chatId: number, text: string) {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
    })
  } catch (e: any) {
    // Don't crash the handler if Telegram is unreachable — log + move on.
    log('warn', 'sendMessage failed', { chatId, errName: e?.name, errMsg: String(e?.message ?? e) })
  }
}

// ── Main handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  // Telegram only sends POST. Anything else is misconfig or scanning.
  if (req.method !== 'POST') {
    return new Response('ok')
  }

  // 1. Secret-token header check. Telegram sends this header on every
  //    webhook call IF we set `secret_token` when registering the webhook
  //    via setWebhook. Without this check, anyone with the function URL
  //    could fake /start commands and hijack enrollment tokens.
  const givenSecret = req.headers.get('X-Telegram-Bot-Api-Secret-Token')
  if (givenSecret !== WEBHOOK_SECRET) {
    log('warn', 'secret-token mismatch', { ip: clientIp(req), hasHeader: !!givenSecret })
    return new Response('unauthorized', { status: 401 })
  }

  try {
    const update = await req.json()
    const message = update?.message
    if (!message?.text) return new Response('ok')

    const chatId: number = message.chat.id
    const text: string   = String(message.text).trim()

    if (!text.startsWith('/start')) return new Response('ok')

    const token = text.split(/\s+/)[1]?.trim()

    // Bare /start (no token) — friendly welcome, no DB hit, no rate limit
    if (!token) {
      await sendMessage(chatId, 'Welcome to Bold Vision Properties! Contact your agent for an enrollment link.')
      return new Response('ok')
    }

    // 2. Rate limit ONLY the token-lookup path. Bare /start is free.
    const ip = clientIp(req)
    if (!checkRate(ip)) {
      log('warn', 'rate limit hit', { ip })
      await sendMessage(chatId, 'Too many attempts. Please wait a minute and try again.')
      return new Response('ok')
    }

    // 3. Reject obviously malformed tokens before hitting the DB. After
    //    migration 0013 all tokens are 32 hex chars (16 bytes). Old tokens
    //    in flight before the migration are 12 chars (6 bytes) — we accept
    //    either width so any link an agent sent right before the migration
    //    still works for a short transition period.
    if (!/^[0-9a-f]{12}$|^[0-9a-f]{32}$/i.test(token)) {
      log('info', 'malformed token', { ip, length: token.length })
      await sendMessage(chatId, 'Invalid enrollment code. Please ask your agent for a new link.')
      return new Response('ok')
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    })

    const { data: customer, error: lookupErr } = await supabase
      .from('customers')
      .select('id, name, telegram_chat_id')
      .eq('telegram_enrollment_token', token)
      .maybeSingle()

    if (lookupErr) {
      log('error', 'customer lookup failed', { errMsg: lookupErr.message })
      await sendMessage(chatId, 'Something went wrong. Please try again or contact your agent.')
      return new Response('ok')
    }

    if (!customer) {
      log('info', 'token not found', { ip })
      await sendMessage(chatId, 'Invalid enrollment code. Please ask your agent for a new link.')
      return new Response('ok')
    }

    // Already enrolled — same customer hitting /start again. Friendly nudge.
    if (customer.telegram_chat_id === String(chatId)) {
      await sendMessage(chatId, `You're already enrolled, ${customer.name}! You'll receive property updates here.`)
      return new Response('ok')
    }

    // Customer was previously bound to a different chat — block re-binding.
    // (Edge case: agent re-issued a token to a customer who already enrolled
    // from a different Telegram account. Force them to talk to the agent
    // rather than silently swap.)
    if (customer.telegram_chat_id && customer.telegram_chat_id !== String(chatId)) {
      log('warn', 'enrollment attempt on different chat', { customerId: customer.id, ip })
      await sendMessage(chatId, 'This enrollment link has already been used. Contact your agent for help.')
      return new Response('ok')
    }

    // 4. Bind chat_id → customer. Wrapped in try/catch to handle the new
    //    partial UNIQUE index from migration 0013 — if another customer
    //    already has this chat_id, the UPDATE fails with 23505.
    const { error: updateErr } = await supabase
      .from('customers')
      .update({ telegram_chat_id: String(chatId) })
      .eq('id', customer.id)

    if (updateErr) {
      if (updateErr.code === '23505') {
        log('warn', 'chat already bound to another customer', { customerId: customer.id, ip })
        await sendMessage(chatId, 'This Telegram account is already linked to another customer. Contact your agent.')
        return new Response('ok')
      }
      log('error', 'enrollment update failed', { customerId: customer.id, errMsg: updateErr.message })
      await sendMessage(chatId, 'Something went wrong saving your enrollment. Please try again or contact your agent.')
      return new Response('ok')
    }

    log('info', 'enrollment success', { customerId: customer.id })
    await sendMessage(chatId, `You're now enrolled, ${customer.name}! You'll receive property updates from Bold Vision Properties here.`)
    return new Response('ok')
  } catch (e: any) {
    log('error', 'webhook crashed', { errName: e?.name, errMsg: String(e?.message ?? e) })
    // Always 200 to Telegram to skip its 24-hour retry loop.
    return new Response('ok')
  }
})
