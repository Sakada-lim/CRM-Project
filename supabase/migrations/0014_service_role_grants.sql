-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 8 Slice 2 hotfix — service_role grants for new send-telegram flow
--
-- The Slice 2 send-telegram rewrite moved recipient derivation server-side
-- (audit C11). The edge fn now does two things the old one didn't:
--   1) INSERT into message_recipients (derive from audience filter)
--   2) UPDATE recipient_count on messages (backfill after derivation)
--
-- Per [[supabase-config]] this project has auto-expose disabled, so every
-- service_role privilege must be granted explicitly. Migration 0005 only
-- granted SELECT, UPDATE on message_recipients (the old fn only updated
-- status). The new fn fails with `permission denied for table
-- message_recipients` on the first invocation.
--
-- All idempotent — safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- INSERT for the recipient-derivation upsert in send-telegram
GRANT INSERT ON public.message_recipients TO service_role;

-- SELECT + UPDATE on messages for the recipient_count backfill in send-telegram
-- (SELECT is for safety — Supabase clients sometimes need it for upsert
-- conflict resolution and other ops that secretly read.)
GRANT SELECT, UPDATE ON public.messages TO service_role;
