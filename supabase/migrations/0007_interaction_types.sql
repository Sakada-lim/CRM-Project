-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 7 (UI): typed interaction history
-- Adds `type` (call/email/sms/note) + optional `duration_minutes` to
-- customer_feedback so the timeline can categorise touchpoints and the
-- Mark-contacted dialog can capture *how* a customer was contacted.
--
-- Idempotent: uses IF NOT EXISTS + DROP/ADD constraint pattern. Safe to
-- re-run; safe to apply to a populated table (existing rows backfill to
-- 'note' before NOT NULL is enforced).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.customer_feedback
  add column if not exists type             text,
  add column if not exists duration_minutes integer;

-- Backfill any pre-existing rows so the NOT NULL + CHECK can apply cleanly.
update public.customer_feedback
   set type = 'note'
 where type is null;

-- Replace the constraint (drop first so re-runs don't fail).
alter table public.customer_feedback
  drop constraint if exists customer_feedback_type_check;

alter table public.customer_feedback
  add constraint customer_feedback_type_check
  check (type in ('call', 'email', 'sms', 'note'));

-- Enforce NOT NULL once everything is backfilled.
alter table public.customer_feedback
  alter column type set not null;

-- Sensible default for new rows that don't specify a type.
alter table public.customer_feedback
  alter column type set default 'note';

-- duration_minutes is only meaningful for type = 'call', but kept nullable
-- so other types simply leave it null. Optional sanity CHECK:
alter table public.customer_feedback
  drop constraint if exists customer_feedback_duration_minutes_check;

alter table public.customer_feedback
  add constraint customer_feedback_duration_minutes_check
  check (duration_minutes is null or duration_minutes >= 0);

-- No new grants needed: existing GRANT on customer_feedback covers
-- new columns. (Supabase auto-expose is disabled per project policy.)
