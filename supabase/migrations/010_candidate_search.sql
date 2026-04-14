-- supabase/migrations/010_candidate_search.sql

-- 1. Replace profile_visibility with searchable on profiles
alter table public.profiles
  add column if not exists searchable boolean not null default true;

-- Preserve privacy intent: users who restricted visibility become non-searchable
update public.profiles
  set searchable = false
  where profile_visibility in ('employers_only', 'private');

alter table public.profiles
  drop column if exists profile_visibility;

-- 2. Create work_experience table
create table public.work_experience (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  company text not null,
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz default now()
);

alter table public.work_experience enable row level security;

create policy "Work experience is viewable when profile is searchable"
  on public.work_experience for select
  using (
    auth.uid() = profile_id
    or exists (
      select 1 from public.profiles p
      where p.id = profile_id and p.searchable = true
    )
  );

create policy "Users can insert own work experience"
  on public.work_experience for insert
  with check (auth.uid() = profile_id);

create policy "Users can update own work experience"
  on public.work_experience for update
  using (auth.uid() = profile_id);

create policy "Users can delete own work experience"
  on public.work_experience for delete
  using (auth.uid() = profile_id);

-- 3. Make conversations.job_id nullable (for direct employer→candidate messages)
alter table public.conversations
  alter column job_id drop not null;

-- Drop the inline unique constraint created in migration 003
alter table public.conversations
  drop constraint if exists conversations_job_id_employer_id_applicant_id_key;

-- Re-add as two partial unique indexes
create unique index if not exists conversations_job_unique
  on public.conversations (job_id, employer_id, applicant_id)
  where job_id is not null;

create unique index if not exists conversations_direct_unique
  on public.conversations (employer_id, applicant_id)
  where job_id is null;
