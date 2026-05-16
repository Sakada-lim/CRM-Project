-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 6: messaging tables + Telegram enrollment token
-- ─────────────────────────────────────────────────────────────────────────────

-- Add Telegram fields to customers
alter table public.customers
  add column if not exists telegram_chat_id          text,
  add column if not exists telegram_enrollment_token text;

-- Backfill enrollment tokens for existing customers (12-char hex)
update public.customers
set telegram_enrollment_token = encode(gen_random_bytes(6), 'hex')
where telegram_enrollment_token is null;

-- Ensure new customers always get a token automatically
alter table public.customers
  alter column telegram_enrollment_token set default encode(gen_random_bytes(6), 'hex');

-- ── messages ──────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id               uuid        primary key default gen_random_uuid(),
  auth_user_id     uuid        not null,
  property_id      uuid        references public.properties(id) on delete set null,
  body             text        not null,
  channel          text        not null default 'Telegram',
  audience_filter  text,       -- 'All' | 'Hot' | 'Warm' | 'Cold'
  recipient_count  int         not null default 0,
  sent_at          timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create or replace function public.set_messages_auth_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.auth_user_id = auth.uid();
  return new;
end;
$$;

create trigger set_messages_auth_user_id
  before insert on public.messages
  for each row execute function public.set_messages_auth_user_id();

-- ── message_recipients ────────────────────────────────────────────────────────
create table if not exists public.message_recipients (
  id               uuid        primary key default gen_random_uuid(),
  message_id       uuid        not null references public.messages(id) on delete cascade,
  customer_id      uuid        not null references public.customers(id) on delete cascade,
  telegram_chat_id text,
  status           text        not null default 'queued'
                               check (status in ('queued', 'sent', 'failed')),
  error            text,
  sent_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.messages           enable row level security;
alter table public.message_recipients enable row level security;

create policy "agent owns messages"
  on public.messages for all
  using  (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

create policy "agent owns message_recipients"
  on public.message_recipients for all
  using  (exists (
    select 1 from public.messages m
    where m.id = message_id and m.auth_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.messages m
    where m.id = message_id and m.auth_user_id = auth.uid()
  ));

-- ── grants ────────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.messages           to authenticated;
grant select, insert, update, delete on public.message_recipients to authenticated;

-- Edge functions run as service_role; auto-grant is disabled on this project
grant select, update on public.customers          to service_role;
grant select, update on public.message_recipients to service_role;
