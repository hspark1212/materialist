-- Add "comment_on_voted_post" notification type for voter engagement
-- Voters on a post receive notifications when new comments are added

-- 1. Update CHECK constraint to allow the new type
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('comment_on_post', 'reply_to_comment', 'comment_on_voted_post'));

-- 2. Replace trigger function with voter notification logic
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_author_id uuid;
  v_parent_author_id uuid;
BEGIN
  -- Get the post author
  SELECT author_id INTO v_post_author_id
    FROM public.posts
    WHERE id = NEW.post_id;

  IF NEW.parent_comment_id IS NULL THEN
    -- Top-level comment: notify post author
    IF v_post_author_id IS DISTINCT FROM NEW.author_id THEN
      INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, comment_id)
      VALUES (v_post_author_id, NEW.author_id, 'comment_on_post', NEW.post_id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  ELSE
    -- Reply: notify parent comment author
    SELECT author_id INTO v_parent_author_id
      FROM public.comments
      WHERE id = NEW.parent_comment_id;

    IF v_parent_author_id IS DISTINCT FROM NEW.author_id THEN
      INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, comment_id)
      VALUES (v_parent_author_id, NEW.author_id, 'reply_to_comment', NEW.post_id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;

    -- Also notify post author about the reply (if different from parent author and self)
    IF v_post_author_id IS DISTINCT FROM NEW.author_id
       AND v_post_author_id IS DISTINCT FROM v_parent_author_id THEN
      INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, comment_id)
      VALUES (v_post_author_id, NEW.author_id, 'comment_on_post', NEW.post_id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Notify voters on the post (excluding commenter, post author, and parent author)
  INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, comment_id)
  SELECT v.user_id, NEW.author_id, 'comment_on_voted_post', NEW.post_id, NEW.id
  FROM public.votes v
  WHERE v.target_type = 'post'
    AND v.target_id = NEW.post_id
    AND v.user_id IS DISTINCT FROM NEW.author_id
    AND v.user_id IS DISTINCT FROM v_post_author_id
    AND v.user_id IS DISTINCT FROM v_parent_author_id
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
