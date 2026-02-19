# CLAUDE.md

## Principles

1. **Think before coding** — State assumptions before writing code. Ask when requirements are ambiguous. Suggest simpler alternatives when the approach feels over-engineered.
2. **Simplicity first** — Only what's requested. No speculative features, no premature abstractions, no "while I'm here" cleanups. Three similar lines beat an unnecessary helper function.
3. **Surgical changes** — Every changed line traces back to the request. Match existing style. Don't touch unrelated code, add unsolicited comments, or refactor things that work.
4. **Goal-driven execution** — Define a verifiable goal before writing code. Reproduce bugs before fixing. State how to confirm the change works.
5. **Keep docs current** — After verification passes, review whether `CLAUDE.md` or `.claude/rules/` need updates for new constraints, patterns, or architectural decisions. Propose changes and wait for user approval before editing.

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

4 sections: `papers` | `forum` | `showcase` | `jobs`. Metadata in `src/lib/sections.ts`.

## Constraints

- **Tailwind v4 CSS-only config** — All theming is in `src/app/globals.css` via `@theme inline {}` and CSS variables. There is no `tailwind.config.ts`.
- **shadcn/ui components are read-only** — Do not edit files in `src/components/ui/`. Customize by wrapping or overriding with Tailwind classes in consuming components.
- **Middleware is scoped to `/auth/*` only** — Expanding middleware scope causes Cloudflare Error 1102 (CPU time exceeded).
- **All Supabase rows go through domain mappers** — Never return raw DB rows to the client. Map via functions in `features/*/domain/mappers.ts`.
- **RLS is enabled** — Never use the admin client in user-facing code paths.
- **When removing a prop from a component**, grep all usages across the codebase to avoid missed references.

## Testing

- **Unit tests** (Vitest, jsdom): `src/**/*.test.{ts,tsx}` — domain logic, utils, mappers
- **E2E tests** (Playwright): `tests/**/*.spec.ts` — 3 viewports (desktop 1440, tablet 768, mobile 375)
- **Hydration errors**: Not caught by `lint`/`build` — must run `npm run dev` and check browser console. Time-based rendering (`formatDistanceToNow`) requires `suppressHydrationWarning`.
- **After code changes**: Run `npm run lint && npx tsc --noEmit && npm run test`. Add `npm run test:e2e` when UI or navigation flows change.
