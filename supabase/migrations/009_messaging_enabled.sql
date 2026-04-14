-- Allow employers to opt-in to applicant messaging per job listing
alter table job_listings
  add column if not exists messaging_enabled boolean not null default false;
