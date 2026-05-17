-- ─────────────────────────────────────────────────────────────────────────────
-- Add `telegram` to the customer_feedback.type check constraint
--
-- Telegram is now a first-class interaction channel alongside Call / Email /
-- SMS / Note, since it's the primary broadcast channel in this CRM.
-- Idempotent (DROP / ADD pattern).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.customer_feedback
  drop constraint if exists customer_feedback_type_check;

alter table public.customer_feedback
  add constraint customer_feedback_type_check
  check (type in ('call', 'email', 'sms', 'note', 'telegram'));
