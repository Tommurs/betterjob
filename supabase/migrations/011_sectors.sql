-- supabase/migrations/011_sectors.sql
-- Add sector field to employer profiles and job listings

alter table public.profiles
  add column if not exists sector text;

alter table public.job_listings
  add column if not exists sector text;
