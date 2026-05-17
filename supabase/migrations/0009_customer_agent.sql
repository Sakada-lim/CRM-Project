-- ─────────────────────────────────────────────────────────────────────────────
-- Add `agent` (plain text) to customers
--
-- Each customer is owned by an agent. For now this is just a free-text name;
-- when multi-account support lands, this column will be backfilled / migrated
-- to a FK against auth.users (or similar). Keeping it as text means no
-- breaking change is required if/when that lands.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.customers
  add column if not exists agent text;

-- No new grants required: existing GRANT on public.customers covers new columns
-- (Supabase auto-expose is disabled per project policy).
