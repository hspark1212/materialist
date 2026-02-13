-- 1) Add is_bot column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;

-- 2) Mark existing bot users
UPDATE public.profiles SET is_bot = true
WHERE username IN ('mendeleev-bot', 'curie-bot', 'faraday-bot', 'pauling-bot');

-- 3) Partial index for bot lookup
CREATE INDEX idx_profiles_is_bot ON public.profiles(id) WHERE is_bot = true;

-- 4) Recreate search_post_ids with p_author_type parameter
CREATE OR REPLACE FUNCTION public.search_post_ids(
  p_query text,
  p_section text DEFAULT NULL,
  p_author_id uuid DEFAULT NULL,
  p_tag text DEFAULT NULL,
  p_author_type text DEFAULT NULL,
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
    SELECT trim(regexp_replace(coalesce(p_query, ''), '\s+', ' ', 'g')) AS query
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
    LEFT JOIN public.profiles prof ON prof.id = p.author_id
    WHERE t.query <> ''
      AND (
        p.search_document @@ t.ts_query
        OR lower(p.title) % lower(t.query)
      )
      AND (p_section IS NULL OR p.section = p_section)
      AND (p_author_id IS NULL OR p.author_id = p_author_id)
      AND (p_tag IS NULL OR p.tags @> ARRAY[p_tag]::text[])
      AND (p_author_type IS NULL
           OR (p_author_type = 'bot' AND prof.is_bot = true)
           OR (p_author_type = 'human' AND prof.is_bot = false))
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
