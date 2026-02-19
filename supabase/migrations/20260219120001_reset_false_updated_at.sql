-- One-time data fix: reset updated_at that was incorrectly bumped by
-- denormalized counter updates (vote_count, comment_count) before
-- the trigger was scoped to content columns only.

UPDATE public.posts SET updated_at = created_at
WHERE updated_at > created_at + interval '1 second';

UPDATE public.comments SET updated_at = created_at
WHERE updated_at > created_at + interval '1 second';
