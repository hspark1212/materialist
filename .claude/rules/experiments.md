# Experiment Rules

## 4 Pillar Metrics

Every experiment targets at least one pillar. Track all four to avoid metric cannibalization.

| Pillar | Formula | GA4 Event | Direction |
|---|---|---|---|
| Vote rate | `vote_cast` / post `page_view` | `vote_cast` | ↑ |
| Comment rate | `comment_created` / post `page_view` | `comment_created` | ↑ |
| Post creation rate | `post_created` / `session_start` | `post_created` | ↑ |
| Return visit rate | (`session_start` − `first_visit`) / `session_start` | `session_start`, `first_visit` | ↑ |

Supporting metrics (not pillars, but track for context): engagement time, scroll events.

## GA4 Custom Event Inventory

| Event | Parameters | Source File |
|---|---|---|
| `card_click` | `post_id`, `section`, `card_type` ("default"\|"compact") | `src/components/post/post-card.tsx:78`, `post-card-compact.tsx:73` |
| `vote_cast` | `target_type` ("post"\|"comment"), `target_id`, `direction` (-1\|1) | `src/components/voting/vote-button.tsx:131` |
| `comment_created` | `post_id`, `is_reply` (bool) | `src/components/comment/comment-composer.tsx:69` |
| `post_created` | `section`, `post_id` | `src/components/post/post-composer.tsx:116` |
| `post_updated` | `section`, `post_id` | `src/components/post/post-composer.tsx:113` |

All events use `event(name, params)` from `@/lib/analytics/gtag` — no-ops when measurement ID is missing.

## Workflow

1. **Check baseline** — Read latest `experiments/001-baseline.md` (or most recent measured experiment) for current numbers.
2. **Hypothesize** — Pick the weakest pillar. State a numeric target (e.g., "vote rate 2% → 5%").
3. **Document** — Create `experiments/<NNN>-<slug>.md` with: pillar, hypothesis, before/target metrics, measurement plan, rollback steps.
4. **Instrument** — Add/modify `event()` calls if needed. Register new events in the inventory above.
5. **Deploy** — Ship the change.
6. **Measure after 3 days** — Run `/experiment measure <NNN>`. Update the doc with actual results.
7. **Decide** — Keep, iterate, or rollback based on data.

## Adding New Events

1. Use `event(name, params)` from `@/lib/analytics/gtag`.
2. Naming: `snake_case`, descriptive (e.g., `signup_start`, `share_click`).
3. Params: flat object, no nesting. Max 25 custom parameters per event (GA4 limit).
4. **Register** — After adding, update the GA4 Custom Event Inventory table above with event name, parameters, and source file.

## Naming

- Experiment docs: `experiments/<NNN>-<slug>.md` (zero-padded 3-digit, slug max 4 words)
- GA4 custom events: snake_case

## Current Baseline (001)

Measured Feb 20, 2026 — first full day post-event-deploy. Source: `metrics/daily.json`.

| Pillar | Baseline | Raw |
|---|---|---|
| Card CTR | 12.59% | 72 / 572 page_view |
| Vote rate | 0.70% | 4 / 572 page_view |
| Comment rate | 0.17% | 1 / 572 page_view |
| Post creation rate | 0% | 0 / 114 session_start |
| Return visit rate | 64.04% | 73 / 114 session_start |

Full details: `experiments/001-baseline.md`.

## Automation

- **`/experiment` skill** — 4 subcommands: `new`, `measure <NNN>`, `status`, `next`. Defined in `.claude/skills/experiment/SKILL.md`.
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
