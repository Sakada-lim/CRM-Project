-- ─────────────────────────────────────────────────────────────────────────────
-- Track whether a broadcast included property photos / floor plans
--
-- The audit answer: "for this broadcast, did we send a Telegram media album
-- in addition to the body text, or text-only?" Surfaces in the Messages
-- history view and helps diagnose any "they didn't see the photos" reports.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.messages
  add column if not exists includes_media boolean not null default false;
