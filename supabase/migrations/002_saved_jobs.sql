-- Saved jobs table
create table public.saved_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.job_listings(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, job_id)
);

-- Row Level Security
alter table public.saved_jobs enable row level security;

create policy "Users can view their own saved jobs"
  on public.saved_jobs for select using (auth.uid() = user_id);

create policy "Users can save jobs"
  on public.saved_jobs for insert with check (auth.uid() = user_id);

create policy "Users can unsave jobs"
  on public.saved_jobs for delete using (auth.uid() = user_id);
