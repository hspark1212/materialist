-- Remove unused PII columns from profiles.
-- These fields were either never displayed (department, website_url, research_interests)
-- or are no longer collected (institution, position, country, anon_bio).
-- bio is intentionally kept for user self-introductions.
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS institution,
  DROP COLUMN IF EXISTS position,
  DROP COLUMN IF EXISTS department,
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS website_url,
  DROP COLUMN IF EXISTS research_interests,
  DROP COLUMN IF EXISTS anon_bio;
