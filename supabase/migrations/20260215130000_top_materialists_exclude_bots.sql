-- Exclude bot accounts from the Top Materialists leaderboard
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
  WHERE (a.post_count > 0 OR a.comment_count > 0)
    AND p.is_bot = false
  ORDER BY score DESC
  LIMIT GREATEST(COALESCE(p_limit, 5), 1);
$$;
