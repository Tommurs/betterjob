-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('jobseeker', 'employer', 'admin')) default 'jobseeker',
  headline text,
  bio text,
  location text,
  website text,
  linkedin_url text,
  github_url text,
  skills text[] default '{}',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Job listings table
create table public.job_listings (
  id uuid default uuid_generate_v4() primary key,
  employer_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  company text not null,
  location text not null,
  type text not null check (type in ('full_time', 'part_time', 'contract', 'remote')),
  salary_min integer,
  salary_max integer,
  description text not null,
  requirements text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Applications table
create table public.applications (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.job_listings(id) on delete cascade not null,
  applicant_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('pending', 'reviewing', 'interviewed', 'offered', 'rejected')) default 'pending',
  cover_letter text,
  resume_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(job_id, applicant_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.job_listings enable row level security;
alter table public.applications enable row level security;

-- Profiles: users can read all, update their own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Jobs: everyone can read active listings, employers can manage their own
create policy "Active jobs are viewable by everyone" on public.job_listings for select using (is_active = true);
create policy "Employers can insert jobs" on public.job_listings for insert with check (auth.uid() = employer_id);
create policy "Employers can update own jobs" on public.job_listings for update using (auth.uid() = employer_id);
create policy "Employers can delete own jobs" on public.job_listings for delete using (auth.uid() = employer_id);

-- Applications: applicants see their own, employers see applications for their jobs
create policy "Applicants can view own applications" on public.applications for select using (auth.uid() = applicant_id);
create policy "Employers can view applications for their jobs" on public.applications for select
  using (exists (select 1 from public.job_listings where id = job_id and employer_id = auth.uid()));
create policy "Applicants can submit applications" on public.applications for insert with check (auth.uid() = applicant_id);
create policy "Applicants can withdraw applications" on public.applications for delete using (auth.uid() = applicant_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'jobseeker')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger handle_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.job_listings for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.applications for each row execute procedure public.handle_updated_at();
