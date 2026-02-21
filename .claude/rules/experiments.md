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

## Automation

- **`/experiment` skill** — 4 subcommands: `new`, `measure <NNN>`, `status`, `next`. Defined in `.claude/skills/experiment/SKILL.md`.

## Tools

- **GA4**: Page views, custom events, real-time, user engagement metrics
