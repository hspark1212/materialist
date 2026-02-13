-- Allow different users to post the same paper (same arxiv_id).
-- Only prevent the same author from posting the same arxiv_id twice.
DROP INDEX IF EXISTS idx_posts_arxiv_id;

CREATE UNIQUE INDEX idx_posts_arxiv_id_author
  ON public.posts(arxiv_id, author_id)
  WHERE arxiv_id IS NOT NULL;
