# UX Experiment Rules

## 4 Pillar Metrics

Every experiment targets at least one pillar. Track all four to avoid metric cannibalization.

| Pillar | Formula | GA4 Event | Direction |
|---|---|---|---|
| Vote rate | `vote_cast` / post `page_view` | `vote_cast` | ↑ |
| Comment rate | `comment_created` / post `page_view` | `comment_created` | ↑ |
| Post creation rate | `post_created` / `session_start` | `post_created` | ↑ |
| Return visit rate | (`session_start` − `first_visit`) / `session_start` | `session_start`, `first_visit` | ↑ |

Supporting metrics (not pillars, but track for context): engagement time, scroll events.

## Adding New Events

1. Use `event(name, params)` from `@/lib/analytics/gtag`.
2. Naming: `snake_case`, descriptive (e.g., `signup_start`, `share_click`).
3. Params: flat object, no nesting. Max 25 custom parameters per event (GA4 limit).
4. **Register** — After adding, update the GA4 Custom Event Inventory in `ux-experiment/000-guide.md`.
5. **Collect** — Add to `EVENTS` array in `scripts/collect-metrics.ts` so it's included in daily metrics.

## Naming

- Experiment docs: `ux-experiment/<NNN>-<slug>.md` (zero-padded 3-digit, slug max 4 words)
- GA4 custom events: snake_case

## Reference

Full guide (event inventory, baseline, automation, event safety): `ux-experiment/000-guide.md`
