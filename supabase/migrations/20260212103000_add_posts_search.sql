-- Full-text search support for posts.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.compute_post_search_document(
  p_title text,
  p_content text,
  p_tags text[],
  p_doi text,
  p_arxiv_id text,
  p_company text
)
RETURNS tsvector
LANGUAGE sql
STABLE
AS $$
  SELECT
    setweight(to_tsvector('simple', coalesce(p_title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(p_content, '')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(p_tags, '{}'::text[]), ' ')), 'B') ||
    setweight(to_tsvector('simple', coalesce(p_doi, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(p_arxiv_id, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(p_company, '')), 'C');
$$;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS search_document tsvector;

CREATE OR REPLACE FUNCTION public.handle_post_search_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.search_document := public.compute_post_search_document(
    NEW.title,
    NEW.content,
    NEW.tags,
    NEW.doi,
    NEW.arxiv_id,
    NEW.company
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_post_search_document ON public.posts;
CREATE TRIGGER on_post_search_document
  BEFORE INSERT OR UPDATE OF title, content, tags, doi, arxiv_id, company
  ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_search_document();

UPDATE public.posts
SET search_document = public.compute_post_search_document(
  title,
  content,
  tags,
  doi,
  arxiv_id,
  company
)
WHERE search_document IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_search_document
  ON public.posts USING GIN (search_document);

CREATE INDEX IF NOT EXISTS idx_posts_title_trgm
  ON public.posts USING GIN (lower(title) gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_post_ids(
  p_query text,
  p_section text DEFAULT NULL,
  p_author_id uuid DEFAULT NULL,
  p_tag text DEFAULT NULL,
  p_sort text DEFAULT 'hot',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  post_id uuid,
  rank real,
  created_at timestamptz,
  vote_count integer
)
LANGUAGE sql
STABLE
AS $$
  WITH normalized AS (
    SELECT trim(regexp_replace(coalesce(p_query, ''), '\\s+', ' ', 'g')) AS query
  ),
  tsq AS (
    SELECT
      query,
      plainto_tsquery('simple', query) AS ts_query
    FROM normalized
  ),
  ranked AS (
    SELECT
      p.id AS post_id,
      ts_rank_cd(p.search_document, t.ts_query) AS rank,
      p.created_at,
      p.vote_count
    FROM public.posts p
    CROSS JOIN tsq t
    WHERE t.query <> ''
      AND (
        p.search_document @@ t.ts_query
        OR lower(p.title) % lower(t.query)
      )
      AND (p_section IS NULL OR p.section = p_section)
      AND (p_author_id IS NULL OR p.author_id = p_author_id)
      AND (p_tag IS NULL OR p.tags @> ARRAY[p_tag]::text[])
  )
  SELECT
    ranked.post_id,
    ranked.rank,
    ranked.created_at,
    ranked.vote_count
  FROM ranked
  ORDER BY
    CASE WHEN p_sort = 'new' THEN ranked.created_at END DESC,
    CASE WHEN p_sort = 'top' THEN ranked.vote_count END DESC,
    CASE WHEN p_sort <> 'new' AND p_sort <> 'top' THEN ranked.rank END DESC,
    ranked.vote_count DESC,
    ranked.created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 20), 1)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;
