-- Settings preferences: notification toggles, privacy/visibility, job preferences

alter table public.profiles
  add column if not exists notification_preferences jsonb
    default '{"messages":true,"application_updates":true,"job_recommendations":true,"new_applications":true,"weekly_digest":false,"marketing":false}'::jsonb,
  add column if not exists profile_visibility text
    default 'public'
    check (profile_visibility in ('public','employers_only','private')),
  add column if not exists open_to_work boolean default false,
  add column if not exists invite_to_apply boolean default true,
  add column if not exists job_search_status text
    default 'open'
    check (job_search_status in ('active','open','not_looking')),
  add column if not exists job_preferences jsonb default '{}'::jsonb;
