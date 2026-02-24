-- Patch handle_last_comment_at: add SET search_path + qualify table references.
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

-- Index for getActiveDiscussions(): NOT NULL filter + DESC ordering.
CREATE INDEX IF NOT EXISTS idx_posts_last_comment_at
  ON public.posts (last_comment_at DESC)
  WHERE last_comment_at IS NOT NULL;
