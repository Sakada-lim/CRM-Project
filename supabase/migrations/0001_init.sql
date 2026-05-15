-- Bold Vision CRM — Phase 1 initial schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)

-- ───────────────────────────────────────────────
-- TABLES
-- ───────────────────────────────────────────────

create table if not exists public.properties (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid references auth.users on delete cascade not null,
  code             text,
  address          text not null default '',
  suburb           text default '',
  state            text default 'VIC',
  postcode         text default '',
  type             text check (type in ('House','Townhouse','Apartment','Villa')) default 'House',
  status           text check (status in ('On Market','Under Offer','Sold')) default 'On Market',
  price_guide      text default '',
  listed_at        timestamptz default now(),
  status_updated_at timestamptz default now(),
  status_timeline  jsonb default '{"listedAt":null,"offerReceivedAt":null,"soldAt":null}'::jsonb,
  bedrooms         int default 0,
  bathrooms        int default 0,
  car_spaces       int default 0,
  carpark_spaces   int default 0,
  carpark_type     text default 'Street parking',
  land_size_sqm    int,
  house_size_sqm   int,
  main_photo_path  text,
  description      text default '',
  notes            text default '',
  highlights       text[] default '{}',
  amenities        text[] default '{}',
  auto_broadcast   boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Photos + floorplans for properties (kind distinguishes them)
create table if not exists public.property_photos (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid references public.properties on delete cascade not null,
  kind         text check (kind in ('photo','floorplan')) not null default 'photo',
  storage_path text not null,
  sort_order   int default 0,
  caption      text default '',
  created_at   timestamptz default now()
);

create table if not exists public.customers (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid references auth.users on delete cascade not null,
  name             text not null default '',
  phone            text default '',
  email            text default '',
  channel          text check (channel in ('Call','SMS','Email','Telegram','WhatsApp')) default 'Call',
  category         text check (category in ('Cold','Warm','Hot')) default 'Cold',
  notes            text default '',
  telegram_chat_id text,
  messenger_psid   text,
  last_contacted_at timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ───────────────────────────────────────────────
-- TRIGGERS — auto-set auth_user_id on insert
-- ───────────────────────────────────────────────

create or replace function public.set_auth_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.auth_user_id = auth.uid();
  return new;
end;
$$;

create trigger set_properties_auth_user_id
  before insert on public.properties
  for each row execute function public.set_auth_user_id();

create trigger set_customers_auth_user_id
  before insert on public.customers
  for each row execute function public.set_auth_user_id();

-- TRIGGER — auto-update updated_at

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.handle_updated_at();

create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.handle_updated_at();

-- ───────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ───────────────────────────────────────────────

alter table public.properties enable row level security;
alter table public.property_photos enable row level security;
alter table public.customers enable row level security;

create policy "agent_full_access" on public.properties
  for all
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- property_photos are accessible when the parent property belongs to the agent
create policy "agent_full_access" on public.property_photos
  for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.auth_user_id = auth.uid()
    )
  );

create policy "agent_full_access" on public.customers
  for all
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- ───────────────────────────────────────────────
-- STORAGE BUCKETS
-- ───────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('property-photos',    'property-photos',    false, 10485760,  array['image/jpeg','image/png','image/webp']),
  ('property-floorplans','property-floorplans', false, 20971520, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Storage policies — files must be under the agent's uid prefix
create policy "agent_upload_photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-photos' and split_part(name,'/',1) = auth.uid()::text);

create policy "agent_read_photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'property-photos' and split_part(name,'/',1) = auth.uid()::text);

create policy "agent_update_photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'property-photos' and split_part(name,'/',1) = auth.uid()::text);

create policy "agent_delete_photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-photos' and split_part(name,'/',1) = auth.uid()::text);

create policy "agent_upload_floorplans" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-floorplans' and split_part(name,'/',1) = auth.uid()::text);

create policy "agent_read_floorplans" on storage.objects
  for select to authenticated
  using (bucket_id = 'property-floorplans' and split_part(name,'/',1) = auth.uid()::text);

create policy "agent_update_floorplans" on storage.objects
  for update to authenticated
  using (bucket_id = 'property-floorplans' and split_part(name,'/',1) = auth.uid()::text);

create policy "agent_delete_floorplans" on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-floorplans' and split_part(name,'/',1) = auth.uid()::text);

-- ───────────────────────────────────────────────
-- GRANTS — allow the authenticated role to use the tables
-- (RLS policies alone are not enough without table-level grants)
-- ───────────────────────────────────────────────

grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.property_photos to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
