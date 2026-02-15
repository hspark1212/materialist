-- Add deadline field to posts table for job listings
ALTER TABLE public.posts ADD COLUMN deadline TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN public.posts.deadline IS 'Application deadline for job postings';
