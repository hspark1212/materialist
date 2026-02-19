# Database Rules

## Mappers
- All Supabase rows must go through domain mappers (`src/features/posts/domain/mappers.ts`) before reaching the client. Functions: `mapPostRowToPost`, `mapCommentRowToComment`, `mapProfileRowToUser`, `mapCommentTreeToComments`.
- Column selection is intentional — list queries use `POST_COLUMNS_LIST`/`PROFILE_COLUMNS` to avoid fetching PII. Only profile pages fetch `select("*")`.

## RLS & Admin Client
- RLS is enabled on all 4 tables (profiles, posts, comments, votes). All writes require `authenticated` role.
- Admin client (`src/lib/supabase/admin.ts`) is service-role only — restricted to 3 files: ORCID callback, ORCID disconnect, account deletion. Never use it in user-facing code paths.
- `protect_profile_fields()` trigger blocks client updates to: karma, orcid_*, is_bot, email, generated_display_name. Only service_role can modify these.

## Migrations
- Single squashed migration: `supabase/migrations/20260218120000_drop_profile_pii_columns.sql`
- Never run `supabase db push` without explicit user approval.

## Key Triggers
- `handle_new_user()` — auto-creates profile with generated display name + avatar on signup
- `handle_updated_at()` — auto-updates timestamps on posts, comments, profiles
- `handle_post_vote_count()` / `handle_comment_vote_count()` — denormalized vote counts
- `handle_comment_count()` — denormalized comment count on posts
- `on_post_search_document` — maintains tsvector for full-text search

## Search
- Full-text search via `search_post_ids()` RPC (tsvector weighted A/B/C + trigram fallback).
- Query normalization: 2–120 chars, whitespace collapse. See `src/features/posts/domain/query-normalization.ts`.
