-- Fix: Scope handle_updated_at() triggers to content columns only.
-- Previously, denormalized counter updates (vote_count, comment_count, karma)
-- also triggered updated_at changes, causing false "(edited)" indicators.
-- Pattern: same as on_post_search_document which already uses UPDATE OF <columns>.

-- posts: exclude vote_count, comment_count, search_document
DROP TRIGGER IF EXISTS "on_post_updated" ON "public"."posts";
CREATE TRIGGER "on_post_updated"
  BEFORE UPDATE OF
    "title", "content", "author_id", "section", "type", "tags", "is_anonymous",
    "doi", "arxiv_id", "url", "flair", "project_url", "tech_stack",
    "showcase_type", "company", "location", "job_type", "application_url", "deadline"
  ON "public"."posts"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."handle_updated_at"();

-- comments: exclude vote_count
DROP TRIGGER IF EXISTS "on_comment_updated" ON "public"."comments";
CREATE TRIGGER "on_comment_updated"
  BEFORE UPDATE OF
    "content", "author_id", "post_id", "parent_comment_id", "depth", "is_anonymous"
  ON "public"."comments"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."handle_updated_at"();

-- profiles: exclude karma
DROP TRIGGER IF EXISTS "on_profile_updated" ON "public"."profiles";
CREATE TRIGGER "on_profile_updated"
  BEFORE UPDATE OF
    "username", "display_name", "generated_display_name", "avatar_url", "email",
    "orcid_id", "orcid_name", "orcid_verified_at", "bio", "is_anonymous",
    "profile_completed", "anon_display_name", "anon_avatar_url", "is_bot"
  ON "public"."profiles"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."handle_updated_at"();
