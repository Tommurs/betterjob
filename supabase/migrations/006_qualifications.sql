-- Add qualification fields to job_listings
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS required_degree TEXT;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS preferred_degree TEXT;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS preferred_qualifications TEXT[] DEFAULT '{}';
