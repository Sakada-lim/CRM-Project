-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 3: customer_feedback + property_interests
-- ─────────────────────────────────────────────────────────────────────────────

-- ── customer_feedback ────────────────────────────────────────────────────────
create table public.customer_feedback (
  id          uuid        primary key default gen_random_uuid(),
  auth_user_id uuid       not null,
  customer_id uuid        not null references public.customers(id) on delete cascade,
  note        text        not null,
  created_at  timestamptz not null default now()
);

create or replace function public.set_customer_feedback_auth_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.auth_user_id = auth.uid();
  return new;
end;
$$;

create trigger set_customer_feedback_auth_user_id
  before insert on public.customer_feedback
  for each row execute procedure public.set_customer_feedback_auth_user_id();

alter table public.customer_feedback enable row level security;

create policy "agent owns feedback"
  on public.customer_feedback
  using  (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- ── property_interests ───────────────────────────────────────────────────────
create table public.property_interests (
  id            uuid        primary key default gen_random_uuid(),
  auth_user_id  uuid        not null,
  property_id   uuid        not null references public.properties(id) on delete cascade,
  customer_id   uuid        not null references public.customers(id) on delete cascade,
  interest_level text       not null check (interest_level in ('Hot', 'Warm', 'Cold')),
  updated_at    timestamptz not null default now(),
  unique (property_id, customer_id)
);

create or replace function public.set_property_interests_auth_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.auth_user_id = auth.uid();
  return new;
end;
$$;

create trigger set_property_interests_auth_user_id
  before insert on public.property_interests
  for each row execute procedure public.set_property_interests_auth_user_id();

alter table public.property_interests enable row level security;

create policy "agent owns interests"
  on public.property_interests
  using  (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- ── grants ───────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.customer_feedback   to authenticated;
grant select, insert, update, delete on public.property_interests  to authenticated;
