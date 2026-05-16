import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOT_TOKEN   = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

serve(async (req) => {
  // Telegram sends POST; anything else is a misconfiguration check
  if (req.method !== 'POST') {
    return new Response('ok')
  }

  try {
    const update = await req.json()
    const message = update?.message
    if (!message?.text) return new Response('ok')

    const chatId: number = message.chat.id
    const text: string   = message.text.trim()

    if (!text.startsWith('/start')) return new Response('ok')

    const token = text.split(' ')[1]?.trim()

    if (!token) {
      await sendMessage(chatId, 'Welcome to Bold Vision Properties! Contact your agent for an enrollment link.')
      return new Response('ok')
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, name, telegram_chat_id')
      .eq('telegram_enrollment_token', token)
      .single()

    if (error || !customer) {
      await sendMessage(chatId, 'Invalid enrollment code. Please ask your agent for a new link.')
      return new Response('ok')
    }

    if (customer.telegram_chat_id) {
      await sendMessage(chatId, `You're already enrolled, ${customer.name}! You'll receive property updates here.`)
      return new Response('ok')
    }

    await supabase
      .from('customers')
      .update({ telegram_chat_id: String(chatId) })
      .eq('id', customer.id)

    await sendMessage(chatId, `You're now enrolled, ${customer.name}! You'll receive property updates from Bold Vision Properties here.`)

    return new Response('ok')
  } catch (e) {
    console.error('telegram-webhook error:', e)
    return new Response('ok') // always 200 to Telegram to prevent retries
  }
})
