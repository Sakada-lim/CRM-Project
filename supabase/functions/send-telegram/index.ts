import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = `https://api.telegram.org/bot${Deno.env.get('TELEGRAM_BOT_TOKEN')}`
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messageId, recipients } = await req.json() as {
      messageId: string
      recipients: { recipientId: string; customerId: string; telegramChatId: string; body: string }[]
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    const results = await Promise.all(
      recipients.map(async (r) => {
        try {
          const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: r.telegramChatId, text: r.body }),
          })
          const data = await res.json()

          if (data.ok) {
            await supabase.from('message_recipients').update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            }).eq('id', r.recipientId)
            return { customerId: r.customerId, status: 'sent' }
          } else {
            await supabase.from('message_recipients').update({
              status: 'failed',
              error: data.description ?? 'Unknown error',
            }).eq('id', r.recipientId)
            return { customerId: r.customerId, status: 'failed', error: data.description }
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          await supabase.from('message_recipients').update({
            status: 'failed',
            error: msg,
          }).eq('id', r.recipientId)
          return { customerId: r.customerId, status: 'failed', error: msg }
        }
      })
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
