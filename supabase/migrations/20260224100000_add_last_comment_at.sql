-- Add last_comment_at to posts for "Active Discussions" discovery chip.
-- Tracks when the most recent comment was made on a post.

ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_comment_at timestamptz;

-- Index for getActiveDiscussions() query: NOT NULL filter + DESC ordering.
CREATE INDEX IF NOT EXISTS idx_posts_last_comment_at
  ON public.posts (last_comment_at DESC)
  WHERE last_comment_at IS NOT NULL;

-- Backfill: set last_comment_at to the most recent comment's created_at per post.
UPDATE posts p
SET last_comment_at = (
  SELECT MAX(c.created_at)
  FROM comments c
  WHERE c.post_id = p.id
)
WHERE EXISTS (
  SELECT 1 FROM comments c WHERE c.post_id = p.id
);

-- Trigger function: keep last_comment_at in sync on comment insert/delete.
CREATE OR REPLACE FUNCTION handle_last_comment_at()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET last_comment_at = NEW.created_at
    WHERE id = NEW.post_id
      AND (last_comment_at IS NULL OR last_comment_at < NEW.created_at);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET last_comment_at = (
      SELECT MAX(created_at) FROM public.comments WHERE post_id = OLD.post_id
    )
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

DROP TRIGGER IF EXISTS on_comment_last_comment_at ON comments;
CREATE TRIGGER on_comment_last_comment_at
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION handle_last_comment_at();
