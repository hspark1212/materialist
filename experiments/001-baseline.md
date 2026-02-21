# Experiment 001: Post-Event Baseline

**Date:** 2026-02-20
**Type:** Observation (no code changes)
**Status:** Measured
**Pillar:** All
**Hypothesis:** —

Establish baseline metrics after GA4 custom events (`card_click`, `vote_cast`, `comment_created`, `post_created`, `post_updated`) were deployed.

## Measurement Window

3 days post-event-deploy: **Feb 20–23, 2026**

## GA4 Events (Feb 20)

| Event | Count | Unique Users | Source |
|---|---|---|---|
| `page_view` | 348 | 56 | GA4 > Events |
| `session_start` | 71 | 51 | GA4 > Events |
| `first_visit` | 22 | 22 | GA4 > Events |
| `card_click` | 43 | 20 | GA4 > Events |
| `vote_cast` | 0 | 0 | GA4 > Events |
| `comment_created` | 0 | 0 | GA4 > Events |
| `post_created` | 0 | 0 | GA4 > Events |
| `post_updated` | 0 | 0 | GA4 > Events |

## Derived Engagement Rates

| Pillar Metric | Formula | Value | Notes |
|---|---|---|---|
| Vote rate | `vote_cast` / post `page_view` | 0% | No vote events recorded |
| Comment rate | `comment_created` / post `page_view` | 0% | No comment events recorded |
| Post creation rate | `post_created` / `session_start` | 0% | No post creation events recorded |
| Card CTR | `card_click` / `page_view` | 12.36% | 43 / 348 |
| Return visit rate | (`session_start` − `first_visit`) / `session_start` | 69.01% | (71 − 22) / 71 |

## Results

**Measured:** 2026-02-20
**Period:** Feb 20, 2026 (GA4)

| Metric | Value | Notes |
|---|---|---|
| page_view | 348 (56 users) | — |
| session_start | 71 (51 users) | — |
| first_visit | 22 (22 users) | — |
| Card CTR | 12.36% | 43 card clicks / 348 page views |
| Vote rate | 0% | no events yet |
| Comment rate | 0% | no events yet |
| Post creation rate | 0% | no events yet |
| Return visit rate | 69.01% | (71 − 22) / 71 |

### Analysis

- **Card CTR 12.36%** is the first measurable baseline — 43 card clicks from 20 unique users out of 348 page views.
- **Return visit rate 69.01%** — 49 of 71 sessions were returning visitors (GA4 `session_start` minus `first_visit`).
- **Vote/comment/post creation** events are all 0 — either no authenticated user activity, or events need more accumulation time.

### Baseline Values for Future Experiments

| Pillar | Baseline | Source |
|---|---|---|
| Vote rate | 0% | GA4 (needs more data) |
| Comment rate | 0% | GA4 (needs more data) |
| Post creation rate | 0% | GA4 (needs more data) |
| Return visit rate | 69.01% | GA4 |
| Card CTR | 12.36% | GA4 |

## Measurement Plan

1. ~~Wait until Feb 23, 2026 (3 days of data accumulation).~~
2. ~~Run `/experiment measure 001`.~~
3. ~~Collect GA4 event counts (set date range Feb 20–23).~~
4. ~~Calculate derived engagement rates.~~
5. ~~Fill in all "—" values above.~~

Test measurement completed Feb 20. Full 3-day measurement recommended after Feb 23 to get meaningful vote/comment/post creation baselines.
