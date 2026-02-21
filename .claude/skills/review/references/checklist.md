# Materialist Review Checklist

14 project-specific checks derived from CLAUDE.md and .claude/rules/.

| # | Category | Check | Source |
|---|---|---|---|
| 1 | Domain mappers | All Supabase rows pass through domain mappers (`mapPostRowToPost`, `mapCommentRowToComment`, `mapProfileRowToUser`, `mapCommentTreeToComments`) before reaching the client | database.md |
| 2 | Admin client | Admin client (`src/lib/supabase/admin.ts`) used only in the 3 allowed files: ORCID callback, ORCID disconnect, account deletion | database.md |
| 3 | RLS | No writes bypass RLS — all writes require `authenticated` role | database.md |
| 4 | Protected fields | No client-side updates to protected fields: `karma`, `orcid_*`, `is_bot`, `email`, `generated_display_name` | database.md |
| 5 | Column selection | List queries use `POST_COLUMNS_LIST`/`PROFILE_COLUMNS` — no `select("*")` in list endpoints (PII leak risk) | database.md |
| 6 | DB triggers | New columns added to `updated_at` trigger column list and `search_document` trigger column list when appropriate | database.md |
| 7 | shadcn/ui read-only | No direct edits to files in `src/components/ui/` — customize by wrapping or overriding in consuming components | ui.md |
| 8 | Middleware scope | Middleware remains scoped to `/auth/*` only — expanding causes Cloudflare Error 1102 (CPU time exceeded) | CLAUDE.md |
| 9 | Tailwind v4 CSS-only | No `tailwind.config.ts` or `tailwind.config.js` created — all theming via CSS variables in `globals.css` | ui.md |
| 10 | Hydration safety | Components using `formatDistanceToNow` have `suppressHydrationWarning` on the relevant element | testing.md |
| 11 | Props removal | When a prop is removed from a component, all usages across the codebase have been updated | ui.md |
| 12 | Security | No XSS, injection, secrets exposure, or OWASP top 10 vulnerabilities introduced | CLAUDE.md |
| 13 | Type safety | No gratuitous `any` types or unsafe `as` casts — proper typing maintained | general |
| 14 | GA4 events | New custom events registered in the GA4 Custom Event Inventory in `experiments.md`, using `event()` from `@/lib/analytics/gtag` | experiments.md |
