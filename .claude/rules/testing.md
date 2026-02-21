# Testing Rules

## Verification Baseline
- After code changes: `npm run lint && npx tsc --noEmit && npm run test`
- When UI or navigation flows change, also run: `npm run test:e2e`
- Before committing: run `/review` for project-specific rule checks and optional Codex second opinion
- If phantom type errors persist: `rm -rf .next` (Turbopack cache can hold stale references)
- After tests pass: review if `CLAUDE.md` or `.claude/rules/` need updates for new constraints or patterns. Propose changes and get user approval before editing.

## Unit Tests (Vitest + jsdom)
- Pattern: `src/**/*.test.{ts,tsx}`
- 9 test files covering: vote state machine, comment tree building, query normalization, post payloads, author identity (PII stripping), vote/comment use cases, auth status derivation, URL sanitization
- Domain tests are pure logic (no async). Application tests use mocked repository ports (`vi.fn()`).
- Setup: `vitest.setup.ts` imports `@testing-library/jest-dom/vitest`

## E2E Tests (Playwright)
- Pattern: `tests/**/*.spec.ts`
- 2 test files: `wave0-smoke.spec.ts` (app loading, theme, posts), `auth-smoke.spec.ts` (auth UI, forms)
- 3 viewports: Desktop (1440x900), Tablet iPad Mini (768x1024), Mobile iPhone 13 (375x812)
- Mobile (375px) is below the 420px header breakpoint — logo text is hidden, only crystal icon shows. Tests must account for this via `test.info().project.name === "Mobile"`.
- Web server auto-starts via `npm run dev`; runs fully parallel locally, single worker in CI
- Retries: 0 locally, 2 in CI

## Hydration Errors
- Not caught by `lint` or `build` — must run `npm run dev` and check browser console.
- `formatDistanceToNow` used in 6+ components (post-card, post-card-compact, post-detail, comment-item, settings, user profile).
