-- ─────────────────────────────────────────────────────────────────────────────
-- Customer financial assessment form
--
-- Captures the 7-section paper "Financial Assessment" PDF as a digital form
-- per customer. One working row per customer (latest wins); the schema does
-- not enforce uniqueness so a future versioned-history feature can be added
-- without a backwards-incompatible migration.
--
-- Storage model: top-level columns for the queryable bits (status, meta,
-- consultant/broker name, dates) + seven JSONB sections so the form fields
-- can evolve without per-field schema churn.
--
-- Idempotent (IF NOT EXISTS + CREATE OR REPLACE).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.customer_assessments (
  id                  uuid        primary key default gen_random_uuid(),
  auth_user_id        uuid        not null,
  customer_id         uuid        not null references public.customers(id) on delete cascade,
  status              text        not null default 'draft'
                                  check (status in ('draft', 'submitted')),

  -- Meta (top-level so they can be queried for dashboards / lists)
  consultant_name     text,
  broker_name         text,
  date_completed      date,
  next_appointment_at timestamptz,

  -- Section payloads (PDF source-of-truth; shape documented in
  -- src/services/assessmentsService.js)
  personal            jsonb       not null default '{}'::jsonb,
  employment          jsonb       not null default '{}'::jsonb,
  income              jsonb       not null default '{}'::jsonb,
  assets              jsonb       not null default '{}'::jsonb,
  liabilities         jsonb       not null default '{}'::jsonb,
  discovery           jsonb       not null default '{}'::jsonb,
  notes               jsonb       not null default '{}'::jsonb,

  -- Nav-rail progress tracker: which section IDs the user has edited.
  touched_sections    text[]      not null default '{}',

  started_at          timestamptz not null default now(),
  submitted_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Stamp auth_user_id from the JWT (mirrors existing tables' trigger pattern).
create or replace function public.set_customer_assessments_auth_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.auth_user_id = auth.uid();
  return new;
end;
$$;

drop trigger if exists set_customer_assessments_auth_user_id on public.customer_assessments;
create trigger set_customer_assessments_auth_user_id
  before insert on public.customer_assessments
  for each row execute function public.set_customer_assessments_auth_user_id();

-- Keep updated_at fresh (reuses the existing public.handle_updated_at()).
drop trigger if exists handle_updated_at_customer_assessments on public.customer_assessments;
create trigger handle_updated_at_customer_assessments
  before update on public.customer_assessments
  for each row execute function public.handle_updated_at();

-- Lookup "latest assessment for this customer" — used on every visit.
create index if not exists customer_assessments_customer_id_idx
  on public.customer_assessments (customer_id, created_at desc);

-- RLS: agent owns their assessments.
alter table public.customer_assessments enable row level security;

drop policy if exists "agent owns customer_assessments" on public.customer_assessments;
create policy "agent owns customer_assessments"
  on public.customer_assessments for all
  using  (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- Explicit grants (Supabase auto-expose is disabled per project policy).
grant select, insert, update, delete on public.customer_assessments to authenticated;
