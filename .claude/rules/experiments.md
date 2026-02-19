# Experiment Rules

## Workflow
1. **Baseline first** — Every experiment starts with a numbered doc in `experiments/` recording current metrics from GA4/Clarity.
2. **One variable** — Change one thing per experiment. Multiple component changes are OK if they serve the same hypothesis.
3. **Measurable hypothesis** — State a numeric target (e.g., "dead clicks <5%") before writing code.
4. **Minimal instrumentation** — Use the existing `event()` from `src/lib/analytics/gtag.ts` for GA4 custom events. No new analytics libraries.
5. **Document** — Create `experiments/<NNN>-<slug>.md` with: date, hypothesis, files modified, before/target metrics, measurement plan, rollback steps.
6. **Measure after 3 days** — Update the experiment doc with actual results.
7. **Rollback plan required** — Every experiment doc must describe how to revert if metrics worsen.

## Naming
- Experiment docs: `experiments/<NNN>-<slug>.md` (zero-padded 3-digit)
- GA4 custom events: snake_case, descriptive (e.g., `card_click`, `signup_start`)

## GA4 Custom Events
- Use `event(name, params)` from `@/lib/analytics/gtag` — no-ops when measurement ID is missing.
- Keep params flat: `{ post_id, section, card_type }` — no nested objects.
- Max 25 custom parameters per event (GA4 limit).

## Tools
- **GA4**: Page views, events, real-time, user engagement metrics
- **Clarity**: Heatmaps, session recordings, dead clicks, rage clicks, scroll depth, Web Vitals
