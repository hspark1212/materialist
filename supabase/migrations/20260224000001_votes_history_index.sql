-- Index for vote history queries (profile Votes tab)
-- Covers: WHERE user_id = ? AND target_type = 'post' AND vote_direction > 0 ORDER BY created_at DESC
CREATE INDEX idx_votes_user_history
  ON votes (user_id, target_type, created_at DESC)
  WHERE vote_direction > 0;
