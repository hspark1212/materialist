# UX Experiment Guide

Reference doc for the `/ux-experiment` skill. For constraints and conventions, see `.claude/rules/ux-experiment.md`.

## GA4 Custom Event Inventory

| Event | Parameters | Source File |
|---|---|---|
| `card_click` | `post_id`, `section`, `card_type` ("default"\|"compact") | `src/components/post/post-card.tsx:78`, `post-card-compact.tsx:73` |
| `vote_cast` | `target_type` ("post"\|"comment"), `target_id`, `direction` (-1\|1) | `src/components/voting/vote-button.tsx:131` |
| `comment_created` | `post_id`, `is_reply` (bool) | `src/components/comment/comment-composer.tsx:69` |
| `post_created` | `section`, `post_id` | `src/components/post/post-composer.tsx:116` |
| `post_updated` | `section`, `post_id` | `src/components/post/post-composer.tsx:113` |
| `bot_mention` | `post_id` | `src/features/bot-mention/presentation/use-bot-reply.ts:21` |
| `bot_reply_received` | `post_id` | `src/features/bot-mention/presentation/use-bot-reply.ts:41` |
| `activated` | `activation_type` (vote\|comment\|post) | `vote-button.tsx`, `comment-composer.tsx`, `post-composer.tsx` |
| `auth_gate_shown` | `trigger` (vote\|comment\|post) | `vote-button.tsx`, `comment-composer.tsx`, `post-composer.tsx` |
| `auth_gate_click` | `action` ("Sign In") | `vote-button.tsx`, `comment-composer.tsx`, `post-composer.tsx` |
| `composer_open` | `composer` ("post") | `post-composer.tsx` |
| `search_used` | `query_length` (number) | `header.tsx`, `mobile-search.tsx` |
| `search_result_click` | `post_id`, `section` | `post-card.tsx`, `post-card-compact.tsx` |
| `share_click` | `post_id` | `share-button.tsx` |

All events use `event(name, params)` from `@/lib/analytics/gtag` — no-ops when measurement ID is missing.

## Workflow

1. **Check baseline** — Read latest `ux-experiment/001-baseline.md` (or most recent measured experiment) for current numbers.
2. **Hypothesize** — Pick the weakest pillar. State a numeric target (e.g., "vote rate 2% → 5%").
3. **Document** — Create `ux-experiment/<NNN>-<slug>.md` with: pillar, hypothesis, before/target metrics, measurement plan, rollback steps.
4. **Instrument** — Add/modify `event()` calls if needed. Register new events in the inventory above.
5. **Deploy** — Ship the change.
6. **Measure after 3 days** — Run `/ux-experiment measure <NNN>`. Update the doc with actual results.
7. **Decide** — Keep, iterate, or rollback based on data.

## Current Baseline (001)

Measured Feb 20, 2026 — first full day post-event-deploy. Source: `metrics/daily.json`.

| Pillar | Baseline | Raw |
|---|---|---|
| Card CTR | 12.59% | 72 / 572 page_view |
| Vote rate | 0.70% | 4 / 572 page_view |
| Comment rate | 0.17% | 1 / 572 page_view |
| Post creation rate | 0% | 0 / 114 session_start |
| Return visit rate | 64.04% | 73 / 114 session_start |

Full details: `ux-experiment/001-baseline.md`.

**Note:** SEO infrastructure (sitemap, robots.txt, OG tags, JSON-LD, RSS) deployed Feb 22, 2026. Organic traffic may shift page_view/session_start denominators — re-baseline after 1-2 weeks of organic data.

## Automation

- **`/ux-experiment` skill** — 4 subcommands: `new`, `measure <NNN>`, `status`, `next`. Defined in `.claude/skills/ux-experiment/SKILL.md`.
- **Daily metrics cron** — `.github/workflows/collect-metrics.yml` runs `scripts/collect-metrics.ts` at 09:00 UTC daily, appends to `metrics/daily.json`, auto-commits. Uses `secrets.GA4_CREDENTIALS` (base64 service account JSON).
- **Local metrics collection** — Not configured by default. For ad-hoc local runs, provide a service account JSON file path: `GA4_CREDENTIALS_FILE=./key.json npm run collect-metrics -- --date YYYY-MM-DD`.

## Event Safety

`event()` in `src/lib/analytics/gtag.ts` has two guards:
1. **No-op when measurement ID missing** — `if (!GA_MEASUREMENT_ID) return`
2. **try-catch + typeof** — `try { if (typeof window.gtag === "function") ... } catch {}`

Ad-blockers or script load failures silently no-op. Core application logic is never affected.

## Tools

- **GA4**: Page views, custom events, real-time, user engagement metrics
- **Standalone scripts**: Use `tsx --env-file=.env.local` to load env vars (`.env.local` is Next.js-only, not auto-loaded by tsx).
