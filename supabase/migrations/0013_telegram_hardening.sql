-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 8 Slice 2: Telegram broadcast + webhook hardening
--
-- DB foundation for the edge-fn security work. All changes are idempotent.
-- Two parts:
--   A) PRE-FLIGHT  — read-only SELECTs. Run each block alone; if it returns
--                    ANY rows, fix manually before proceeding.
--   B) CONSTRAINTS — only after every pre-flight returns 0 rows.
--
-- Apply via Supabase Dashboard SQL editor — CLI is unreliable on this machine
-- per [[supabase-config]].
-- ─────────────────────────────────────────────────────────────────────────────


-- ============================================================
-- PART A  — PRE-FLIGHT  (run each query in isolation first)
-- ============================================================

-- 1. Customers sharing a telegram_chat_id (would block the partial UNIQUE
--    index in Part B). If this returns rows, decide which customer keeps
--    the chat_id and NULL out the others.
--
-- SELECT telegram_chat_id, count(*), array_agg(id) AS customer_ids
--   FROM public.customers
--  WHERE telegram_chat_id IS NOT NULL
--  GROUP BY 1
-- HAVING count(*) > 1;

-- 2. Duplicate (message_id, customer_id) in message_recipients (would block
--    the UNIQUE constraint). Shouldn't exist in practice — current client
--    inserts one row per recipient per message — but check anyway.
--
-- SELECT message_id, customer_id, count(*)
--   FROM public.message_recipients
--  GROUP BY 1, 2
-- HAVING count(*) > 1;

-- 3. Sanity check on existing enrollment tokens. We're about to backfill all
--    customers to 16-byte (128-bit) tokens. If any customer is already
--    enrolled (telegram_chat_id set), their token is irrelevant — the chat
--    is already bound. Pre-enrollment customers' tokens will rotate, so the
--    OLD link the agent sent them will stop working.
--
-- SELECT count(*) FILTER (WHERE telegram_chat_id IS NOT NULL) AS enrolled,
--        count(*) FILTER (WHERE telegram_chat_id IS NULL)     AS pending
--   FROM public.customers;


-- ============================================================
-- PART B  — CONSTRAINTS  (after every pre-flight is clean)
-- ============================================================

-- ── B1. customers.telegram_chat_id partial UNIQUE  (audit C4) ───────────────
--
-- Why partial? telegram_chat_id is nullable (most customers haven't enrolled).
-- A plain UNIQUE would treat each NULL as distinct, which works in Postgres,
-- but a partial index makes the intent explicit: "uniqueness only applies
-- when the value is set."
--
-- Why per-row, not per-agent? A Telegram chat is globally unique — no two
-- agents could legitimately bind the same chat_id to different customers
-- (that chat is one human). Per-row UNIQUE matches reality.
CREATE UNIQUE INDEX IF NOT EXISTS customers_telegram_chat_id_unique
  ON public.customers (telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;


-- ── B2. messages.idempotency_key + UNIQUE per agent  (audit C10) ────────────
--
-- The client generates a random UUID per Send-button click (NOT per retry).
-- If the same key shows up twice for the same agent, the second insert
-- collides — we treat that as "this broadcast was already created" and reuse
-- the existing message row instead of duplicating.
--
-- Scoped per (auth_user_id) because the UUID is generated client-side; two
-- different agents' UUIDs colliding is astronomically unlikely but the
-- per-agent scope also enables future "retry by idempotency_key" flows that
-- need to be auth-scoped anyway.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS messages_idempotency_key_unique_per_agent
  ON public.messages (auth_user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;


-- ── B3. message_recipients (message_id, customer_id) UNIQUE  (audit C10) ────
--
-- Even with idempotency_key on messages, a partial server-side retry could
-- in theory try to insert a recipient row that already exists. UNIQUE
-- here means the edge fn can use INSERT ... ON CONFLICT DO NOTHING and rely
-- on existing rows' status (queued/sent/failed) as the source of truth.
ALTER TABLE public.message_recipients
  ADD CONSTRAINT message_recipients_unique_per_message_customer
  UNIQUE (message_id, customer_id);


-- ── B4. Bump enrollment token entropy to 128 bits  (audit H15) ──────────────
--
-- 6 bytes = 48 bits. At a few thousand customers, brute-forcing a chat-hijack
-- via the webhook is borderline feasible (especially before secret-token
-- header verification lands in the same slice). 16 bytes = 128 bits puts it
-- in cryptographic-key territory — infeasible regardless of how many
-- customers exist.
--
-- BACKFILL behavior: every customer's token rotates to a new 128-bit value.
-- - Already-enrolled customers (telegram_chat_id set): unaffected. The bot
--   is keyed off chat_id, not the token, after enrollment.
-- - Pre-enrollment customers: any OLD invite link the agent sent will stop
--   working. The agent must re-send from the Customer detail page.

-- Default for new rows
ALTER TABLE public.customers
  ALTER COLUMN telegram_enrollment_token SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- One-shot backfill of all existing rows. We rotate everyone (even enrolled
-- customers) so the column has uniform width — keeps any future audit
-- "find weak tokens" query trivial.
UPDATE public.customers
   SET telegram_enrollment_token = encode(gen_random_bytes(16), 'hex');
