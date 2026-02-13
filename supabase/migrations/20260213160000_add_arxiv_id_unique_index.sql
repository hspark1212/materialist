-- Unique partial index on arxiv_id for bot duplicate prevention.
-- Partial (WHERE arxiv_id IS NOT NULL) so regular posts without arxiv_id are unaffected.
CREATE UNIQUE INDEX idx_posts_arxiv_id
  ON public.posts(arxiv_id)
  WHERE arxiv_id IS NOT NULL;
