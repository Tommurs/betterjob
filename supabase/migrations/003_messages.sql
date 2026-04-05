-- Conversations between an employer and a job applicant, tied to a job
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.job_listings(id) on delete cascade not null,
  employer_id uuid references public.profiles(id) on delete cascade not null,
  applicant_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(job_id, employer_id, applicant_id)
);

-- Individual messages within a conversation
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversations: visible to both participants
create policy "Participants can view their conversations"
  on public.conversations for select
  using (auth.uid() = employer_id or auth.uid() = applicant_id);

create policy "Employer or applicant can start a conversation"
  on public.conversations for insert
  with check (auth.uid() = employer_id or auth.uid() = applicant_id);

-- Messages: visible to both participants in the conversation
create policy "Participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.employer_id = auth.uid() or c.applicant_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.employer_id = auth.uid() or c.applicant_id = auth.uid())
    )
  );

create policy "Recipients can mark messages as read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.employer_id = auth.uid() or c.applicant_id = auth.uid())
    )
  );
