-- =============================================================
-- Test: comment_on_voted_post notification trigger
-- Run: psql "$DATABASE_URL" -f supabase/tests/comment_on_voted_post.sql
-- =============================================================

BEGIN;

-- ===================== SETUP =====================

-- Create test users via auth.users (triggers auto-create profiles)
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'post_author@test.com', '{}'),
  ('a0000000-0000-0000-0000-000000000002', 'voter_a@test.com', '{}'),
  ('a0000000-0000-0000-0000-000000000003', 'voter_b@test.com', '{}'),
  ('a0000000-0000-0000-0000-000000000004', 'voter_c@test.com', '{}'),
  ('a0000000-0000-0000-0000-000000000005', 'commenter@test.com', '{}'),
  ('a0000000-0000-0000-0000-000000000006', 'replier@test.com', '{}')
ON CONFLICT DO NOTHING;

-- Create a test post
INSERT INTO public.posts (id, author_id, section, type, title, content)
VALUES ('b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'forum', 'text', 'Test Post', 'Test content')
ON CONFLICT DO NOTHING;


-- ===================== S1: Vote → comment → voter gets notified =====================
DO $$
DECLARE
  v_count integer;
BEGIN
  RAISE NOTICE '--- S1: UserA votes, UserB comments → UserA gets comment_on_voted_post ---';

  -- UserA votes on the post
  INSERT INTO public.votes (user_id, target_type, target_id, vote_direction)
  VALUES ('a0000000-0000-0000-0000-000000000002', 'post', 'b0000000-0000-0000-0000-000000000001', 1)
  ON CONFLICT DO NOTHING;

  -- UserB (commenter) writes a comment
  INSERT INTO public.comments (id, post_id, author_id, content)
  VALUES ('c0000000-0000-0000-0000-000000000001',
          'b0000000-0000-0000-0000-000000000001',
          'a0000000-0000-0000-0000-000000000005',
          'Great post!');

  SELECT count(*) INTO v_count
    FROM public.notifications
    WHERE recipient_id = 'a0000000-0000-0000-0000-000000000002'
      AND type = 'comment_on_voted_post'
      AND post_id = 'b0000000-0000-0000-0000-000000000001'
      AND comment_id = 'c0000000-0000-0000-0000-000000000001';

  ASSERT v_count = 1, format('S1 FAILED: expected 1 notification, got %s', v_count);
  RAISE NOTICE 'S1 PASSED';

  -- Cleanup
  DELETE FROM public.notifications WHERE comment_id = 'c0000000-0000-0000-0000-000000000001';
  DELETE FROM public.comments WHERE id = 'c0000000-0000-0000-0000-000000000001';
END $$;


-- ===================== S2: PostAuthor votes on own post → no duplicate =====================
DO $$
DECLARE
  v_count integer;
BEGIN
  RAISE NOTICE '--- S2: PostAuthor votes on own post, UserB comments → only comment_on_post ---';

  -- PostAuthor votes on own post
  INSERT INTO public.votes (user_id, target_type, target_id, vote_direction)
  VALUES ('a0000000-0000-0000-0000-000000000001', 'post', 'b0000000-0000-0000-0000-000000000001', 1)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.comments (id, post_id, author_id, content)
  VALUES ('c0000000-0000-0000-0000-000000000002',
          'b0000000-0000-0000-0000-000000000001',
          'a0000000-0000-0000-0000-000000000005',
          'Comment on S2');

  -- PostAuthor should get comment_on_post, NOT comment_on_voted_post
  SELECT count(*) INTO v_count
    FROM public.notifications
    WHERE recipient_id = 'a0000000-0000-0000-0000-000000000001'
      AND type = 'comment_on_post'
      AND comment_id = 'c0000000-0000-0000-0000-000000000002';

  ASSERT v_count = 1, format('S2 FAILED: expected 1 comment_on_post, got %s', v_count);

  SELECT count(*) INTO v_count
    FROM public.notifications
    WHERE recipient_id = 'a0000000-0000-0000-0000-000000000001'
      AND type = 'comment_on_voted_post'
      AND comment_id = 'c0000000-0000-0000-0000-000000000002';

  ASSERT v_count = 0, format('S2 FAILED: expected 0 comment_on_voted_post, got %s', v_count);
  RAISE NOTICE 'S2 PASSED';

  DELETE FROM public.notifications WHERE comment_id = 'c0000000-0000-0000-0000-000000000002';
  DELETE FROM public.comments WHERE id = 'c0000000-0000-0000-0000-000000000002';
  DELETE FROM public.votes WHERE user_id = 'a0000000-0000-0000-0000-000000000001' AND target_id = 'b0000000-0000-0000-0000-000000000001';
END $$;


-- ===================== S3: Voter comments on same post → no self-notification =====================
DO $$
DECLARE
  v_count integer;
BEGIN
  RAISE NOTICE '--- S3: UserA votes + comments → no self-notification ---';

  -- UserA (voter_a) comments on the same post they voted on
  INSERT INTO public.comments (id, post_id, author_id, content)
  VALUES ('c0000000-0000-0000-0000-000000000003',
          'b0000000-0000-0000-0000-000000000001',
          'a0000000-0000-0000-0000-000000000002',
          'Self comment');

  SELECT count(*) INTO v_count
    FROM public.notifications
    WHERE recipient_id = 'a0000000-0000-0000-0000-000000000002'
      AND comment_id = 'c0000000-0000-0000-0000-000000000003';

  ASSERT v_count = 0, format('S3 FAILED: expected 0 self-notifications, got %s', v_count);
  RAISE NOTICE 'S3 PASSED';

  DELETE FROM public.notifications WHERE comment_id = 'c0000000-0000-0000-0000-000000000003';
  DELETE FROM public.comments WHERE id = 'c0000000-0000-0000-0000-000000000003';
END $$;


-- ===================== S4: Vote + reply → voter + parent author + post author =====================
DO $$
DECLARE
  v_count integer;
BEGIN
  RAISE NOTICE '--- S4: UserA votes, UserB replies to UserC comment → all 3 notified correctly ---';

  -- UserC (replier) posts a top-level comment
  INSERT INTO public.comments (id, post_id, author_id, content)
  VALUES ('c0000000-0000-0000-0000-000000000004',
          'b0000000-0000-0000-0000-000000000001',
          'a0000000-0000-0000-0000-000000000006',
          'Top-level by UserC');

  -- Clear notifications from setup comment
  DELETE FROM public.notifications WHERE comment_id = 'c0000000-0000-0000-0000-000000000004';

  -- UserB (commenter) replies to UserC's comment
  INSERT INTO public.comments (id, post_id, author_id, content, parent_comment_id)
  VALUES ('c0000000-0000-0000-0000-000000000005',
          'b0000000-0000-0000-0000-000000000001',
          'a0000000-0000-0000-0000-000000000005',
          'Reply to UserC',
          'c0000000-0000-0000-0000-000000000004');

  -- UserA (voter): comment_on_voted_post
  SELECT count(*) INTO v_count
    FROM public.notifications
    WHERE recipient_id = 'a0000000-0000-0000-0000-000000000002'
      AND type = 'comment_on_voted_post'
      AND comment_id = 'c0000000-0000-0000-0000-000000000005';

  ASSERT v_count = 1, format('S4 FAILED: voter should get comment_on_voted_post, got %s', v_count);

  -- UserC (parent comment author): reply_to_comment
  SELECT count(*) INTO v_count
    FROM public.notifications
    WHERE recipient_id = 'a0000000-0000-0000-0000-000000000006'
      AND type = 'reply_to_comment'
      AND comment_id = 'c0000000-0000-0000-0000-000000000005';

  ASSERT v_count = 1, format('S4 FAILED: parent author should get reply_to_comment, got %s', v_count);

  -- PostAuthor: comment_on_post
  SELECT count(*) INTO v_count
    FROM public.notifications
    WHERE recipient_id = 'a0000000-0000-0000-0000-000000000001'
      AND type = 'comment_on_post'
      AND comment_id = 'c0000000-0000-0000-0000-000000000005';

  ASSERT v_count = 1, format('S4 FAILED: post author should get comment_on_post, got %s', v_count);
  RAISE NOTICE 'S4 PASSED';

  DELETE FROM public.notifications WHERE comment_id IN ('c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000005');
  DELETE FROM public.comments WHERE id IN ('c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004');
END $$;


-- ===================== S5: ParentAuthor votes + gets reply → only reply_to_comment =====================
DO $$
DECLARE
  v_count integer;
BEGIN
  RAISE NOTICE '--- S5: ParentAuthor votes on post, gets reply → only reply_to_comment ---';

  -- UserC (replier) votes on the post
  INSERT INTO public.votes (user_id, target_type, target_id, vote_direction)
  VALUES ('a0000000-0000-0000-0000-000000000006', 'post', 'b0000000-0000-0000-0000-000000000001', 1)
  ON CONFLICT DO NOTHING;

  -- UserC posts a top-level comment
  INSERT INTO public.comments (id, post_id, author_id, content)
  VALUES ('c0000000-0000-0000-0000-000000000006',
          'b0000000-0000-0000-0000-000000000001',
          'a0000000-0000-0000-0000-000000000006',
          'Comment by voter-parent');

  DELETE FROM public.notifications WHERE comment_id = 'c0000000-0000-0000-0000-000000000006';

  -- Someone replies to UserC's comment
  INSERT INTO public.comments (id, post_id, author_id, content, parent_comment_id)
  VALUES ('c0000000-0000-0000-0000-000000000007',
          'b0000000-0000-0000-0000-000000000001',
          'a0000000-0000-0000-0000-000000000005',
          'Reply to voter-parent',
          'c0000000-0000-0000-0000-000000000006');

  -- UserC should get reply_to_comment only, NOT comment_on_voted_post
  SELECT count(*) INTO v_count
    FROM public.notifications
    WHERE recipient_id = 'a0000000-0000-0000-0000-000000000006'
      AND type = 'reply_to_comment'
      AND comment_id = 'c0000000-0000-0000-0000-000000000007';

  ASSERT v_count = 1, format('S5 FAILED: expected reply_to_comment, got %s', v_count);

  SELECT count(*) INTO v_count
    FROM public.notifications
    WHERE recipient_id = 'a0000000-0000-0000-0000-000000000006'
      AND type = 'comment_on_voted_post'
      AND comment_id = 'c0000000-0000-0000-0000-000000000007';

  ASSERT v_count = 0, format('S5 FAILED: should NOT get comment_on_voted_post, got %s', v_count);
  RAISE NOTICE 'S5 PASSED';

  DELETE FROM public.notifications WHERE comment_id IN ('c0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000007');
  DELETE FROM public.comments WHERE id IN ('c0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000006');
  DELETE FROM public.votes WHERE user_id = 'a0000000-0000-0000-0000-000000000006' AND target_id = 'b0000000-0000-0000-0000-000000000001';
END $$;


-- ===================== S6: Multiple voters → each gets notification =====================
DO $$
DECLARE
  v_count integer;
BEGIN
  RAISE NOTICE '--- S6: 3 voters, 1 commenter → 3 individual notifications ---';

  -- UserB and UserC also vote (UserA already voted from S1)
  INSERT INTO public.votes (user_id, target_type, target_id, vote_direction)
  VALUES ('a0000000-0000-0000-0000-000000000003', 'post', 'b0000000-0000-0000-0000-000000000001', 1)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.votes (user_id, target_type, target_id, vote_direction)
  VALUES ('a0000000-0000-0000-0000-000000000004', 'post', 'b0000000-0000-0000-0000-000000000001', 1)
  ON CONFLICT DO NOTHING;

  -- Commenter writes a comment
  INSERT INTO public.comments (id, post_id, author_id, content)
  VALUES ('c0000000-0000-0000-0000-000000000008',
          'b0000000-0000-0000-0000-000000000001',
          'a0000000-0000-0000-0000-000000000005',
          'Comment for S6');

  SELECT count(*) INTO v_count
    FROM public.notifications
    WHERE type = 'comment_on_voted_post'
      AND comment_id = 'c0000000-0000-0000-0000-000000000008';

  ASSERT v_count = 3, format('S6 FAILED: expected 3 voter notifications, got %s', v_count);
  RAISE NOTICE 'S6 PASSED';

  DELETE FROM public.notifications WHERE comment_id = 'c0000000-0000-0000-0000-000000000008';
  DELETE FROM public.comments WHERE id = 'c0000000-0000-0000-0000-000000000008';
  DELETE FROM public.votes WHERE user_id IN ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004') AND target_id = 'b0000000-0000-0000-0000-000000000001';
END $$;


-- ===================== S7: Downvote also triggers notification =====================
DO $$
DECLARE
  v_count integer;
BEGIN
  RAISE NOTICE '--- S7: UserB downvotes → still gets comment_on_voted_post ---';

  -- UserB (voter_b) downvotes
  INSERT INTO public.votes (user_id, target_type, target_id, vote_direction)
  VALUES ('a0000000-0000-0000-0000-000000000003', 'post', 'b0000000-0000-0000-0000-000000000001', -1)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.comments (id, post_id, author_id, content)
  VALUES ('c0000000-0000-0000-0000-000000000009',
          'b0000000-0000-0000-0000-000000000001',
          'a0000000-0000-0000-0000-000000000005',
          'Comment for S7');

  SELECT count(*) INTO v_count
    FROM public.notifications
    WHERE recipient_id = 'a0000000-0000-0000-0000-000000000003'
      AND type = 'comment_on_voted_post'
      AND comment_id = 'c0000000-0000-0000-0000-000000000009';

  ASSERT v_count = 1, format('S7 FAILED: downvoter should also get notified, got %s', v_count);
  RAISE NOTICE 'S7 PASSED';

  DELETE FROM public.notifications WHERE comment_id = 'c0000000-0000-0000-0000-000000000009';
  DELETE FROM public.comments WHERE id = 'c0000000-0000-0000-0000-000000000009';
  DELETE FROM public.votes WHERE user_id = 'a0000000-0000-0000-0000-000000000003' AND target_id = 'b0000000-0000-0000-0000-000000000001';
END $$;


-- ===================== S8: Vote then un-vote → no notification =====================
DO $$
DECLARE
  v_count integer;
BEGIN
  RAISE NOTICE '--- S8: UserB votes then un-votes → no notification ---';

  -- UserB votes
  INSERT INTO public.votes (id, user_id, target_type, target_id, vote_direction)
  VALUES ('d0000000-0000-0000-0000-000000000001',
          'a0000000-0000-0000-0000-000000000003',
          'post', 'b0000000-0000-0000-0000-000000000001', 1);

  -- UserB un-votes (delete)
  DELETE FROM public.votes WHERE id = 'd0000000-0000-0000-0000-000000000001';

  INSERT INTO public.comments (id, post_id, author_id, content)
  VALUES ('c0000000-0000-0000-0000-000000000010',
          'b0000000-0000-0000-0000-000000000001',
          'a0000000-0000-0000-0000-000000000005',
          'Comment for S8');

  SELECT count(*) INTO v_count
    FROM public.notifications
    WHERE recipient_id = 'a0000000-0000-0000-0000-000000000003'
      AND type = 'comment_on_voted_post'
      AND comment_id = 'c0000000-0000-0000-0000-000000000010';

  ASSERT v_count = 0, format('S8 FAILED: un-voted user should NOT get notified, got %s', v_count);
  RAISE NOTICE 'S8 PASSED';

  DELETE FROM public.notifications WHERE comment_id = 'c0000000-0000-0000-0000-000000000010';
  DELETE FROM public.comments WHERE id = 'c0000000-0000-0000-0000-000000000010';
END $$;


-- ===================== CLEANUP =====================
DELETE FROM public.notifications WHERE post_id = 'b0000000-0000-0000-0000-000000000001';
DELETE FROM public.votes WHERE target_id = 'b0000000-0000-0000-0000-000000000001';
DELETE FROM public.comments WHERE post_id = 'b0000000-0000-0000-0000-000000000001';
DELETE FROM public.posts WHERE id = 'b0000000-0000-0000-0000-000000000001';
DELETE FROM auth.users WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000006'
);

COMMIT;

SELECT 'All S1–S8 tests passed!' AS result;
