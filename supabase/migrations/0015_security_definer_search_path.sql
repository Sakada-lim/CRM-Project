-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 8 Stage 1 — audit C3: SECURITY DEFINER hardening
--
-- Supabase Security Advisor flags three issues against our trigger functions:
--
-- 1. "Function Search Path Mutable" — applies to ANY function (not just
--    SECURITY DEFINER) without a pinned `search_path`. A malicious schema
--    could shadow unqualified function references like `now()` if a caller
--    manipulated their session search_path.
--    Fix: bake `SET search_path = public, pg_temp` into each definition.
--
-- 2. "Public Can Execute SECURITY DEFINER Function" — SECURITY DEFINER
--    functions run as their owner (postgres), so a public-callable one is a
--    privilege-escalation vector. Our 5 trigger functions are ONLY invoked
--    by BEFORE INSERT triggers, never by user code.
--    Fix: REVOKE EXECUTE FROM public + anon. Triggers fire regardless of
--    EXECUTE grants (they run as the table owner).
--
-- 3. "Signed-In Users Can Execute SECURITY DEFINER Function" — same concern
--    extended to the `authenticated` role.
--    Fix: REVOKE EXECUTE FROM authenticated too.
--
-- Out of scope (advisor flags but not ours to fix):
-- - `public.rls_auto_enable()` — Supabase platform function, not in our
--   codebase. Whatever they ship as defaults is their concern.
-- - "Leaked Password Protection Disabled" — Auth-level setting toggled in
--   Dashboard → Authentication → Settings → Password protection. One click.
--
-- All idempotent via `CREATE OR REPLACE FUNCTION` + idempotent REVOKE.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_auth_user_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.auth_user_id = auth.uid();
  return new;
end;
$$;

create or replace function public.set_customer_feedback_auth_user_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.auth_user_id = auth.uid();
  return new;
end;
$$;

create or replace function public.set_property_interests_auth_user_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.auth_user_id = auth.uid();
  return new;
end;
$$;

create or replace function public.set_messages_auth_user_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.auth_user_id = auth.uid();
  return new;
end;
$$;

create or replace function public.set_customer_assessments_auth_user_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.auth_user_id = auth.uid();
  return new;
end;
$$;

-- ── handle_updated_at — not SECURITY DEFINER, but flagged for mutable
-- search_path. Pinning is cheap defense + clears the advisor warning. ────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Lock down execute permissions on the 5 SECURITY DEFINER trigger
-- functions. They're trigger-only — fired by BEFORE INSERT triggers running
-- as the table owner. No legitimate user code path calls them directly, so
-- there's no reason for `public`, `anon`, or `authenticated` to have EXECUTE.
-- Revoking closes the advisor warnings + tightens privilege surface. ────────
revoke execute on function public.set_auth_user_id()                       from public, anon, authenticated;
revoke execute on function public.set_customer_feedback_auth_user_id()     from public, anon, authenticated;
revoke execute on function public.set_property_interests_auth_user_id()    from public, anon, authenticated;
revoke execute on function public.set_messages_auth_user_id()              from public, anon, authenticated;
revoke execute on function public.set_customer_assessments_auth_user_id()  from public, anon, authenticated;
