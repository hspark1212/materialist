# Materialist

Materials science + AI community. Verified researchers and anonymous contributors coexist — trust spectrum, not binary auth. Users toggle anonymity per-post.

## Stack

Next.js 16 + App Router + TypeScript + React 19 / Tailwind v4 (CSS-only) / shadcn/ui / Supabase (PostgreSQL + Auth) / Cloudflare Workers via `@opennextjs/cloudflare`

## Commands

```bash
npm run dev           # Turbopack dev (localhost:3001)
npm run build         # Production build
npm run lint          # ESLint
npm run test          # Vitest unit tests
npm run test:e2e      # Playwright E2E
npm run test:all      # Unit + E2E
```

**Verification baseline**: `npm run lint && npx tsc --noEmit && npm run test`
**Single test**: `npx vitest run <path>`
**Phantom type errors**: `rm -rf .next` (Turbopack cache)

## Principles

1. **Think before coding** — State assumptions. Ask when ambiguous. Suggest simpler alternatives.
2. **Simplicity first** — Only what's requested. No speculative features, no premature abstractions.
3. **Surgical changes** — Every changed line traces to the request. Match existing style.
4. **Goal-driven** — Define verifiable goal. Reproduce bugs before fixing.
5. **Keep docs current** — After changes, review if `AGENTS.md` or `.claude/rules/` need updates. Propose and wait for approval.

## Architecture

**Sections**: papers / forum / showcase / jobs — each with section-specific fields (flair, doi, jobType, etc.)

**Feature modules**: `src/features/<name>/{domain, application, infrastructure, presentation, api}`

**Key paths**:
- `src/lib/types.ts` — Core types (User, Post, Comment, Section)
- `src/lib/auth/context.tsx` — AuthProvider with centralized navigation via `onAuthStateChange`
- `src/lib/supabase/{client,server,admin,middleware}.ts`
- `src/components/ui/` — shadcn (DO NOT EDIT)

**Auth navigation**: Centralized in `AuthContext`. Zero manual `router.push()` in UI components. Key flags: `isNavigating`, `pendingSignIn`, `hasReceivedInitialSession`.

**Deployment**: Push to `main` → Workers Builds → `materialist.science`. Build vars in Cloudflare Dashboard (NOT `wrangler.jsonc`). Runtime secrets via `wrangler secret put`.

## Non-Negotiable Constraints

1. **Tailwind v4 CSS-only** — All theme in `globals.css` (`@theme`, `@utility`, `@layer`). No `tailwind.config.ts`.
2. **shadcn/ui read-only** — Never edit `src/components/ui/`. Customize via Tailwind in consuming components.
3. **CSS variables as source of truth** — `--header-height`, `--section-*`, `--upvote`, etc. in `globals.css`.
4. **Middleware scope `/auth/*` only** — Expanding triggers Cloudflare CPU limit (Error 1102).
5. **Never return raw Supabase rows** — Always use domain mappers in `features/*/domain/mappers.ts`.
6. **Admin client restricted** — `src/lib/supabase/admin.ts` for trusted flows only (ORCID, account deletion, bot reply).
7. **Grep before removing props** — Prevent stale references across codebase.
8. **Never `supabase db push` without user approval**.

## See Also

Detailed topic rules in `.claude/rules/`:
- `database.md` — Mappers, RLS, admin client, triggers, search
- `testing.md` — Verification workflow, Vitest, Playwright, hydration
- `ui.md` — Tailwind v4, shadcn, responsive, custom utilities
- `ux-experiment.md` — KPI metrics, GA4 events, experiment docs
