-- Add fresh graduate policy to job_listings
-- Values: null = not set, 'fresh_grad' = open to fresh graduates only, 'fresh_grad_plus' = open to fresh graduates + some experience
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS fresh_grad_policy TEXT
  CHECK (fresh_grad_policy IN ('fresh_grad', 'fresh_grad_plus'));
