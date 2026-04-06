-- Replace 'remote' with 'temporary' in the type constraint
ALTER TABLE job_listings DROP CONSTRAINT IF EXISTS job_listings_type_check;
ALTER TABLE job_listings ADD CONSTRAINT job_listings_type_check
  CHECK (type IN ('full_time', 'part_time', 'contract', 'temporary'));

-- Update any existing 'remote' listings to 'contract' as closest match
UPDATE job_listings SET type = 'contract' WHERE type = 'remote';

-- Add experience range columns
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS experience_min TEXT;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS experience_max TEXT;
