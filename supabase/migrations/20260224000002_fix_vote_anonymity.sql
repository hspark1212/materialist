-- Fix #1: Correct the mis-backfilled is_anonymous column.
-- The original migration incorrectly set all pre-existing votes to is_anonymous = true.
-- Pre-migration votes were cast in verified mode and must be false.
-- New votes inserted after the migration are already correct (set explicitly by the app).
--
-- Some users may have also cast a verified vote (is_anonymous=false) on the same target
-- after the migration, creating a duplicate pair. The backfilled is_anonymous=true record
-- is the stale one; delete it before resetting, to avoid a unique constraint violation.
DELETE FROM votes
WHERE is_anonymous = true
  AND (user_id, target_type, target_id) IN (
    SELECT user_id, target_type, target_id FROM votes WHERE is_anonymous = false
  );

-- Reset remaining lone is_anonymous=true votes (no verified duplicate) back to false.
UPDATE votes SET is_anonymous = false WHERE is_anonymous = true;

-- Fix #2: Restrict the votes SELECT policy to protect anonymous vote privacy.
-- The previous policy (USING true) allowed any unauthenticated client to enumerate
-- anonymous votes by querying user_id + is_anonymous = true, defeating anonymity.
-- Verified votes remain public; anonymous votes are only visible to the voter.
DROP POLICY IF EXISTS "Users can view all votes" ON votes;
CREATE POLICY "Users can view votes" ON votes
  FOR SELECT USING (is_anonymous = false OR auth.uid() = user_id);
