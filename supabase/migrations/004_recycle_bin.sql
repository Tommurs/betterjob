-- Add soft-delete column to job_listings
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_job_listings_deleted_at ON job_listings(deleted_at);
