# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Dev server on port 3001 (Turbopack)
npm run build          # Production build
npm run lint           # ESLint
npm run test           # Vitest unit tests
npm run test:watch     # Vitest watch mode
npm run test:e2e       # Playwright E2E tests
npm run test:all       # Unit + E2E
npm run deploy         # Build + deploy to Cloudflare Workers
```

Run a single test file: `npx vitest run src/features/posts/domain/__tests__/vote-state.test.ts`

Type-check: `npx tsc --noEmit` (if phantom errors, `rm -rf .next` first — Turbopack cache can hold stale type references)

## Architecture

**Stack:** Next.js 16.1.6 (App Router) / React 19 / Supabase / Tailwind CSS v4 / shadcn/ui / Cloudflare Workers (via @opennextjs/cloudflare)

**Path alias:** `@/` → `src/`

### Feature modules (`src/features/`)

Domain-driven design with clean architecture layers:

```
features/<name>/
  domain/       — Types, mappers, pure business logic (no Supabase)
  application/  — Use cases + ports (repository interface)
  infrastructure/ — Supabase repository implementation
  presentation/ — React hooks + UI components
  api/          — HTTP error handling + parsing
```

Data flows: API route → use case → repository (via port) → Supabase → mapper → domain type → response.

### Auth system (`src/lib/auth/`)

- `AuthProvider` (context.tsx) manages session + profile state client-side
- `deriveStatus()` (utils.ts) computes status from session + profile
- Status progression: `"loading"` → `"anonymous"` | `"authenticated"` | `"verified"`
  - `authenticated` = transitional state while session exists but profile is not yet loaded
  - `verified` = session + profile loaded
- OAuth providers: Google, GitHub. Plus email/password. ORCID for researcher verification (not auth).
- Post-signup navigation: signup/login → `/u/:username`

### Supabase clients (`src/lib/supabase/`)

- `client.ts` — browser client (client components)
- `server.ts` — server client with cookies (Server Components, API routes)
- `admin.ts` — service role, bypasses RLS (internal triggers only)
- `middleware.ts` — session refresh, **only runs on `/auth/*` routes** (Cloudflare CPU time limit)

### Sections and post types

4 sections: `papers` | `forum` | `showcase` | `jobs`. Each maps to post types with section-specific fields (flair, showcase_type, job_type, etc.). Metadata in `src/lib/sections.ts`.

### Anonymous posting

Posts/comments have `is_anonymous: boolean`. When true, author renders as "Anonymous Researcher" with a deterministic random avatar. Users can toggle per-post.

### Voting

State machine in `src/features/posts/domain/vote-state.ts`. Vote direction: `-1 | 0 | 1`. Click same direction toggles off; click opposite switches.

### Comment threading

Flat DB storage with `parent_comment_id` + `depth` (max 6). `buildCommentTree()` builds nested structure at query time.

## Important constraints

- **Tailwind v4 CSS-only config** — All theming is in `src/app/globals.css` via `@theme inline {}` and CSS variables. There is no `tailwind.config.ts`.
- **shadcn/ui components are read-only** — Do not edit files in `src/components/ui/`. Customize by wrapping or overriding with Tailwind classes in consuming components.
- **Middleware is scoped to `/auth/*` only** — Expanding middleware scope causes Cloudflare Error 1102 (CPU time exceeded).
- **All Supabase rows go through domain mappers** — Never return raw DB rows to the client. Map via functions in `features/*/domain/mappers.ts`.
- **RLS is enabled** — Never use the admin client in user-facing code paths.
- **When removing a prop from a component**, grep all usages across the codebase to avoid missed references.

## Database

Single squashed migration: `supabase/migrations/20260218120000_drop_profile_pii_columns.sql`

Core tables: `profiles` (extends auth.users), `posts`, `comments`, `votes` (unique constraint on user_id + target_type + target_id).

Key triggers: `handle_new_user()` auto-creates profile with generated display name and extracted OAuth avatar on signup.

## Testing

- **Unit tests** (Vitest, jsdom): `src/**/*.test.{ts,tsx}` — domain logic, utils, mappers
- **E2E tests** (Playwright): `tests/**/*.spec.ts` — 3 viewports (desktop 1440, tablet 768, mobile 375)
