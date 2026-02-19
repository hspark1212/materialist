-- Notifications table
CREATE TABLE public.notifications (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('comment_on_post', 'reply_to_comment')),
  post_id       uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id    uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  is_read       boolean DEFAULT false NOT NULL,
  created_at    timestamptz DEFAULT now() NOT NULL
);

-- Index: fetch notifications for a user sorted by recency
CREATE INDEX idx_notifications_recipient_created
  ON public.notifications (recipient_id, created_at DESC);

-- Index: count unread notifications efficiently
CREATE INDEX idx_notifications_recipient_unread
  ON public.notifications (recipient_id) WHERE is_read = false;

-- Unique index: one notification per comment per recipient (dedup)
CREATE UNIQUE INDEX idx_notifications_unique_comment
  ON public.notifications (recipient_id, comment_id) WHERE comment_id IS NOT NULL;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Trigger function: create notifications on new comments
-- SECURITY DEFINER to bypass RLS for INSERT into notifications
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

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_notification();
