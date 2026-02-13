-- Global feed sort optimization for hot/top ordering.
CREATE INDEX IF NOT EXISTS idx_posts_vote_count_created_at
  ON public.posts(vote_count DESC, created_at DESC);
