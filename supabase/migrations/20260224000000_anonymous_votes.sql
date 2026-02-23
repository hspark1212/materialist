-- Add is_anonymous column to votes (default false, backfill existing as verified)
ALTER TABLE votes ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false;
UPDATE votes SET is_anonymous = false;

-- Drop old unique constraint, create new one including is_anonymous
ALTER TABLE votes DROP CONSTRAINT votes_user_id_target_type_target_id_key;
ALTER TABLE votes ADD CONSTRAINT votes_user_target_anonymous_key
  UNIQUE (user_id, target_type, target_id, is_anonymous);
