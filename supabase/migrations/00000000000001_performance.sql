-- Performance indexes for frequent feed/profile queries.
CREATE INDEX IF NOT EXISTS idx_posts_section_created_at
  ON public.posts(section, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_section_vote_count_created_at
  ON public.posts(section, vote_count DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_author_created_at
  ON public.posts(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_post_created_at
  ON public.comments(post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_author_created_at
  ON public.comments(author_id, created_at DESC);

-- Aggregate tags in SQL instead of loading and reducing all posts in application code.
CREATE OR REPLACE FUNCTION public.get_trending_topics(p_limit integer DEFAULT 8, p_days integer DEFAULT 7)
RETURNS TABLE(tag text, count bigint, vote_score bigint)
LANGUAGE sql
STABLE
AS $$
  WITH tagged_posts AS (
    SELECT
      unnest(tags) AS raw_tag,
      vote_count
    FROM public.posts
    WHERE created_at >= now() - make_interval(days => GREATEST(COALESCE(p_days, 7), 1))
      AND tags IS NOT NULL
  )
  SELECT
    CASE
      WHEN left(trim(raw_tag), 1) = '#' THEN trim(raw_tag)
      ELSE '#' || trim(raw_tag)
    END AS tag,
    COUNT(*)::bigint AS count,
    COALESCE(SUM(vote_count), 0)::bigint AS vote_score
  FROM tagged_posts
  WHERE trim(raw_tag) <> ''
  GROUP BY 1
  ORDER BY (COUNT(*) * 0.5 + COALESCE(SUM(vote_count), 0) * 0.5) DESC, COUNT(*) DESC
  LIMIT GREATEST(COALESCE(p_limit, 8), 1);
$$;

-- Compute top contributors in SQL to avoid full table scans in the sidebar renderer.
CREATE OR REPLACE FUNCTION public.get_top_materialists(
  p_limit integer DEFAULT 5,
  p_days integer DEFAULT 30
)
RETURNS TABLE(
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  post_count bigint,
  comment_count bigint,
  score numeric
)
LANGUAGE sql
STABLE
AS $$
  WITH cutoff AS (
    SELECT now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1)) AS value
  ),
  post_activity AS (
    SELECT
      author_id,
      COUNT(*)::bigint AS post_count,
      COALESCE(SUM(vote_count), 0)::bigint AS post_votes
    FROM public.posts
    WHERE created_at >= (SELECT value FROM cutoff)
    GROUP BY author_id
  ),
  comment_activity AS (
    SELECT
      author_id,
      COUNT(*)::bigint AS comment_count,
      COALESCE(SUM(vote_count), 0)::bigint AS comment_votes
    FROM public.comments
    WHERE created_at >= (SELECT value FROM cutoff)
    GROUP BY author_id
  ),
  activity AS (
    SELECT
      COALESCE(pa.author_id, ca.author_id) AS author_id,
      COALESCE(pa.post_count, 0)::bigint AS post_count,
      COALESCE(ca.comment_count, 0)::bigint AS comment_count,
      COALESCE(pa.post_votes, 0)::bigint AS post_votes,
      COALESCE(ca.comment_votes, 0)::bigint AS comment_votes
    FROM post_activity pa
    FULL OUTER JOIN comment_activity ca
      ON ca.author_id = pa.author_id
  )
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    a.post_count,
    a.comment_count,
    (
      a.post_count * 4 +
      a.comment_count * 2 +
      a.post_votes * 0.35 +
      a.comment_votes * 0.2 +
      COALESCE(p.karma, 0) * 0.03
    )::numeric AS score
  FROM activity a
  INNER JOIN public.profiles p
    ON p.id = a.author_id
  WHERE a.post_count > 0 OR a.comment_count > 0
  ORDER BY score DESC
  LIMIT GREATEST(COALESCE(p_limit, 5), 1);
$$;
