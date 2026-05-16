-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 5: customers.next_contact_at
-- Agency-managed "when to follow up next" date+time. Source of truth for
-- overdue/approaching/no-schedule status. Nullable; no backfill — agents will
-- populate manually as they review each customer.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.customers
  add column if not exists next_contact_at timestamptz;

-- Index for Follow-ups Kanban range queries (week/month buckets).
create index if not exists customers_next_contact_at_idx
  on public.customers (next_contact_at)
  where next_contact_at is not null;

-- Note: table-level GRANT on public.customers (from 0001_init.sql) already
-- covers this new column — no extra grant needed.
