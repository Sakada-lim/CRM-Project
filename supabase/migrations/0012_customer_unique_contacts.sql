-- ============================================================
-- Phase 8 — Slice 1: Input Validation
-- Per-agent UNIQUE constraints on customer phone + email.
--
-- Phone is normalized to digits-only ("0412 345 678" == "+61412345678"
-- when stripped). Email is lower-cased so "JOHN@x.com" == "john@x.com".
-- ============================================================

-- ── PRE-FLIGHT ─────────────────────────────────────────────────
-- Run each query in the Supabase SQL editor BEFORE the CREATE INDEX
-- block below. If either returns rows, fix the offending customers
-- (open one and change the phone/email or delete the duplicate)
-- before re-running. The CREATE INDEX will FAIL if dupes exist.
--
-- 1. Customers sharing a phone within the same agent
-- SELECT auth_user_id,
--        regexp_replace(phone, '\D', '', 'g') AS phone_digits,
--        count(*),
--        array_agg(id) AS customer_ids,
--        array_agg(name) AS names
-- FROM public.customers
-- WHERE coalesce(phone, '') <> ''
-- GROUP BY auth_user_id, phone_digits
-- HAVING count(*) > 1;
--
-- 2. Customers sharing an email within the same agent
-- SELECT auth_user_id,
--        lower(email) AS email_lower,
--        count(*),
--        array_agg(id) AS customer_ids,
--        array_agg(name) AS names
-- FROM public.customers
-- WHERE coalesce(email, '') <> ''
-- GROUP BY auth_user_id, email_lower
-- HAVING count(*) > 1;

-- ── CONSTRAINTS ────────────────────────────────────────────────
-- Idempotent via IF NOT EXISTS. Partial indexes — only enforce
-- uniqueness on non-blank values, so blank phone/email rows
-- coexist freely.
--
-- Scope: (auth_user_id, normalized value). Two different agents
-- can both have a customer with phone 0412 345 678; one agent
-- can't have two.

CREATE UNIQUE INDEX IF NOT EXISTS customers_unique_phone_per_agent
  ON public.customers (auth_user_id, (regexp_replace(phone, '\D', '', 'g')))
  WHERE coalesce(phone, '') <> '';

CREATE UNIQUE INDEX IF NOT EXISTS customers_unique_email_per_agent
  ON public.customers (auth_user_id, lower(email))
  WHERE coalesce(email, '') <> '';
