# Phase 8 Slice 2 — Telegram security cutover

Execute these in order. Each step is independently testable. **Don't skip the smoke tests at the end** — they prove the new posture is in place.

**Project ref:** `cvwlrsjxgegwwptkdlma`
**Supabase Dashboard URL:** https://supabase.com/dashboard/project/cvwlrsjxgegwwptkdlma

---

## Prerequisite — already done

- [x] Migration `0013_telegram_hardening.sql` applied in SQL editor.

---

## Step 1 — Set 2 env vars

**Dashboard → Project Settings → Edge Functions → Secrets** → **Add new secret** for each:

### `TELEGRAM_WEBHOOK_SECRET`
A 64-char hex string. Use this generated value (or generate your own — see note below):

```
8882426c0b18cba392f321905f5c0ae81b0110624b7cc570b739383350decae8
```

**Important:** Copy this exact value. You'll paste it into Telegram's `setWebhook` call in Step 5 — they MUST match.

**To regenerate** (if you prefer your own):
- PowerShell: `-join (1..32 | %{ '{0:x2}' -f (Get-Random -Max 256) })`
- Bash: `openssl rand -hex 32`

### `ALLOWED_ORIGINS`
For local dev:

```
http://localhost:5173
```

When you deploy to Vercel later, edit this to add the production origin (comma-separated, no spaces):

```
http://localhost:5173,https://your-vercel-domain.vercel.app
```

---

## Step 2 — Deploy `send-telegram`

1. **Dashboard → Edge Functions → `send-telegram` → Edit Function**.
2. Open the local file `supabase/functions/send-telegram/index.ts`, **select all + copy**.
3. Paste into the Dashboard editor, replacing everything.
4. Click **Deploy**.
5. Watch the deploy log for any module-load errors (a missing env var will show as `TELEGRAM_BOT_TOKEN env var missing` etc. — fix the secret and redeploy).

---

## Step 3 — Toggle `Verify JWT` ON for `send-telegram`

1. **Dashboard → Edge Functions → `send-telegram` → Settings (gear icon).**
2. Find **Verify JWT with legacy secret** (or just "Verify JWT") and toggle it **ON**.
3. Save.

**Result:** anonymous calls now get rejected by the Supabase gateway before your function runs. The function code's own auth check is the second layer.

**Don't toggle this on for `telegram-webhook`** — it must stay OFF (Telegram doesn't send Supabase JWTs).

---

## Step 4 — Deploy `telegram-webhook`

1. **Dashboard → Edge Functions → `telegram-webhook` → Edit Function**.
2. Copy `supabase/functions/telegram-webhook/index.ts`, paste, Deploy.
3. Verify `Verify JWT` is OFF for this one.

---

## Step 5 — Re-register the Telegram webhook with `secret_token`

This is the step that tells Telegram to start sending the `X-Telegram-Bot-Api-Secret-Token` header with the secret you set in Step 1.

**Replace `<BOT_TOKEN>` with your Telegram bot token** (find it in your Supabase Edge Function secrets — it's `TELEGRAM_BOT_TOKEN`).

### PowerShell one-liner

```powershell
$body = @{
  url = "https://cvwlrsjxgegwwptkdlma.supabase.co/functions/v1/telegram-webhook"
  secret_token = "8882426c0b18cba392f321905f5c0ae81b0110624b7cc570b739383350decae8"
} | ConvertTo-Json
Invoke-RestMethod -Uri "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" -Method Post -ContentType "application/json" -Body $body
```

### Or curl (Git Bash / WSL)

**Important — Git Bash gotcha:** multi-line curls with backslash continuations + `-s` (silent) reliably hang or swallow output on MinGW64. Use the **one-line + write-to-file** pattern below. It always shows the response.

**Set the webhook:**

```bash
curl -o resp.json -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" -H "Content-Type: application/json" -d '{"url":"https://cvwlrsjxgegwwptkdlma.supabase.co/functions/v1/telegram-webhook","secret_token":"8882426c0b18cba392f321905f5c0ae81b0110624b7cc570b739383350decae8"}'; cat resp.json; echo; rm resp.json
```

**Expected response:**

```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

A response of `{"ok":true,"result":true,"description":"Webhook is already set"}` is **also fine** — it means the URL + secret + cert combo matches what's already configured (nothing to change).

**Verify it took:**

```bash
curl -o info.json "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"; cat info.json; echo; rm info.json
```

Look for in the JSON output:
- `"url":"https://cvwlrsjxgegwwptkdlma.supabase.co/functions/v1/telegram-webhook"` ← confirms it points at YOUR function
- `"has_custom_certificate":false`
- `"pending_update_count":0` (or a small number)
- **No** `"last_error_date"` / `"last_error_message"` fields. If those exist, that's Telegram telling you it couldn't deliver the last update — common cause: the webhook fn is returning a non-200 (e.g. wrong secret env var, code error).

The response won't echo the secret (Telegram never reveals it back) but you'll see the URL is set.

---

## Step 6 — Smoke tests

Run all of these. Anything red here means stop and diagnose before claiming Slice 2 done.

All three curl-based smoke tests use the **one-line, write-to-file** pattern (same gotcha as Step 5 — multi-line `\` curls don't work reliably in MinGW64 Git Bash). The `-w "\nHTTP %{http_code}\n"` prints the status code on its own line at the end so you can see it without `-i`.

### 6.1 — Anonymous call to `send-telegram` is rejected

```bash
curl -o resp.txt -w "\nHTTP %{http_code}\n" -X POST "https://cvwlrsjxgegwwptkdlma.supabase.co/functions/v1/send-telegram" -H "Content-Type: application/json" -d '{"messageId":"00000000-0000-0000-0000-000000000000"}'; cat resp.txt; echo; rm resp.txt
```

**Expected:** `HTTP 401` from Supabase gateway (because Verify JWT is now ON). Body will mention `Missing authorization header` or similar.

### 6.2 — Webhook without secret header is rejected

```bash
curl -o resp.txt -w "\nHTTP %{http_code}\n" -X POST "https://cvwlrsjxgegwwptkdlma.supabase.co/functions/v1/telegram-webhook" -H "Content-Type: application/json" -d '{}'; cat resp.txt; echo; rm resp.txt
```

**Expected:** `HTTP 401`, body `unauthorized`.

### 6.3 — Webhook with wrong secret is rejected

```bash
curl -o resp.txt -w "\nHTTP %{http_code}\n" -X POST "https://cvwlrsjxgegwwptkdlma.supabase.co/functions/v1/telegram-webhook" -H "X-Telegram-Bot-Api-Secret-Token: wrongsecret" -H "Content-Type: application/json" -d '{}'; cat resp.txt; echo; rm resp.txt
```

**Expected:** `HTTP 401`, body `unauthorized`.

### 6.4 — Authenticated broadcast still works

In the app:

1. Sign in
2. Open a Property detail → Broadcast
3. Pick "All" audience
4. Confirm a non-zero recipient count is shown
5. Click **Send**
6. **Expected:** "Sent to N customers" toast. The N value matches what was shown pre-send. Check Telegram on a test customer's account — message arrives.

### 6.5 — Double-click doesn't double-broadcast (idempotency)

In the app:

1. Open Broadcast for the same property (fresh dialog).
2. Open browser devtools → Network tab.
3. Click **Send** TWICE rapidly (within the disabled-button window if you can).
4. **Expected:** Test customer receives the message **once**, not twice. The Network tab may show one or two `send-telegram` invocations, but both share the same `idempotencyKey`. The second one (if it lands) finds `status='sent'` rows and reports `sent: 0`.

### 6.6 — Webhook enrollment still works

1. Pick a customer who has not yet enrolled (find one in your DB or create a test customer with `telegram_chat_id IS NULL`).
2. Click the **Telegram invite link** on their Customer detail page.
3. Inside Telegram, click **Start** on the bot.
4. **Expected:** Bot replies "You're now enrolled, {name}!" and the customer row's `telegram_chat_id` is populated.

### 6.7 — Second `/start` with same token shows correct message

In the same Telegram chat that just enrolled, send `/start <same-token>` again.

**Expected:** Bot replies "You're already enrolled, {name}!"

### 6.8 — `/start` with bad token

Send `/start abc123` (invalid token).

**Expected:** Bot replies "Invalid enrollment code. Please ask your agent for a new link."

### 6.9 — Function logs show structured output

**Dashboard → Edge Functions → `send-telegram` → Logs**.

After triggering the broadcast in 6.4, you should see JSON log lines like:

```json
{"ts":"2026-05-18T...","level":"info","fn":"send-telegram","message":"broadcast start","messageId":"...","pending":5,"hasMedia":false}
{"ts":"2026-05-18T...","level":"info","fn":"send-telegram","message":"broadcast done","messageId":"...","sent":5,"failed":0}
```

Same for `telegram-webhook` after enrollment in 6.6.

---

## Rollback plan

If something goes wrong after Steps 1-4 and broadcasts break for the agent:

1. **Dashboard → Edge Functions → `send-telegram` → Settings**: toggle **Verify JWT** back **OFF**.
2. Paste the OLD function code (find it in git history: `git show 25af33b:supabase/functions/send-telegram/index.ts`).
3. Re-deploy.
4. For the webhook: `git show 25af33b:supabase/functions/telegram-webhook/index.ts`, paste, Deploy.
5. Re-run `setWebhook` WITHOUT the `secret_token` field (Telegram will revert to no header).

The migration `0013` itself is non-destructive (adds columns + indexes; doesn't drop anything) and doesn't need to be rolled back.

---

## After the cutover

- [ ] Mark Slice 2 done in `[[deferred-work]]` memory
- [ ] Update `[[phase8-slice1-handoff]]` (or rename to slice2 if we keep going)
- [ ] Commit the Slice 2 code (`Phase 8 Slice 2: edge function security`) on this branch
- [ ] Decide: merge `Feature/Phase8-InputValidation` to main now, or keep going into Slice 3 (Vercel deploy prep)?

The recommended next slice after this lands is **Vercel deploy prep** (C6 + C7 + C9 + C12) — last big chunk before the app can go to production.
