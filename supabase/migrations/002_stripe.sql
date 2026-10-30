-- Stripe online payments (2026-10-30). Run once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to re-run. Already included in schema.sql for new projects.
alter table public.orders add column if not exists paid_via text;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists stripe_session_id text;
