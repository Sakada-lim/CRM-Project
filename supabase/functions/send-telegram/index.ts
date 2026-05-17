// @ts-nocheck — this file runs on Deno (Supabase Edge Functions). The Deno
// global + URL imports below aren't recognised by VS Code's built-in TS
// server. Disabling type-checking here is the standard Supabase workaround;
// runtime correctness is unaffected.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}`
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_CAPTION_LIMIT = 1024

interface Recipient {
  recipientId: string
  customerId: string
  telegramChatId: string
  body: string
}

interface RequestBody {
  messageId: string
  recipients: Recipient[]
  mediaUrls?: string[]
  captionLimit?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messageId: _messageId, recipients, mediaUrls = [], captionLimit = DEFAULT_CAPTION_LIMIT } =
      (await req.json()) as RequestBody

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
    const hasMedia = mediaUrls.length > 0

    const results = await Promise.all(
      recipients.map(async (r) => {
        try {
          let ok = false
          let errorMsg: string | null = null

          if (hasMedia) {
            // ── Send as media album with caption ───────────────────────────
            const caption = r.body.slice(0, captionLimit)
            const captionOverflow = r.body.length > captionLimit ? r.body.slice(captionLimit) : null

            // sendMediaGroup accepts up to 10 InputMedia items. Caption goes
            // on the first item; the rest are unlabeled.
            const media = mediaUrls.slice(0, 10).map((url, i) =>
              i === 0
                ? { type: 'photo', media: url, caption }
                : { type: 'photo', media: url },
            )

            const albumRes = await fetch(`${TELEGRAM_API}/sendMediaGroup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: r.telegramChatId, media }),
            })
            const albumData = await albumRes.json()

            if (albumData.ok) {
              ok = true
              // Overflow caption → send as a follow-up text message
              if (captionOverflow) {
                await fetch(`${TELEGRAM_API}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: r.telegramChatId, text: captionOverflow }),
                })
              }
            } else {
              // ── Media failed → fall back to text-only so the customer at
              //    least gets the message body. Annotate the error so the
              //    history view shows what happened.
              const albumErr = albumData.description ?? 'sendMediaGroup failed'
              const textRes = await fetch(`${TELEGRAM_API}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: r.telegramChatId, text: r.body }),
              })
              const textData = await textRes.json()
              if (textData.ok) {
                ok = true
                errorMsg = `media-failed: ${albumErr} (text-only fallback sent)`
              } else {
                errorMsg = `media-failed: ${albumErr}; text-fallback-failed: ${textData.description ?? 'unknown'}`
              }
            }
          } else {
            // ── Plain text broadcast ───────────────────────────────────────
            const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: r.telegramChatId, text: r.body }),
            })
            const data = await res.json()
            if (data.ok) {
              ok = true
            } else {
              errorMsg = data.description ?? 'Unknown error'
            }
          }

          // ── Update recipient row ─────────────────────────────────────────
          if (ok) {
            await supabase.from('message_recipients').update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              error: errorMsg,   // null if no error, or the media-fallback note
            }).eq('id', r.recipientId)
            return { customerId: r.customerId, status: 'sent', error: errorMsg }
          } else {
            await supabase.from('message_recipients').update({
              status: 'failed',
              error: errorMsg ?? 'Unknown error',
            }).eq('id', r.recipientId)
            return { customerId: r.customerId, status: 'failed', error: errorMsg }
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          await supabase.from('message_recipients').update({
            status: 'failed',
            error: msg,
          }).eq('id', r.recipientId)
          return { customerId: r.customerId, status: 'failed', error: msg }
        }
      }),
    )

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
