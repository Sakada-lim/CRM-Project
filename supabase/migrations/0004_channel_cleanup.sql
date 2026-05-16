-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 5 cleanup: add Telegram channel, drop WhatsApp, drop dead auto_broadcast
-- ─────────────────────────────────────────────────────────────────────────────

-- Migrate existing WhatsApp customers to Telegram
update public.customers
set channel = 'Telegram'
where channel = 'WhatsApp';

-- Drop old constraint and replace with updated channel list
alter table public.customers drop constraint if exists customers_channel_check;
alter table public.customers
  add constraint customers_channel_check
  check (channel in ('Call', 'Telegram', 'SMS', 'Email'));

-- Drop auto_broadcast — column was never wired up in app code
alter table public.properties drop column if exists auto_broadcast;
