# Experiment 001: Post-Event Baseline

**Date:** 2026-02-20
**Type:** Observation (no code changes)
**Status:** Measured
**Pillar:** All
**Hypothesis:** —

Establish baseline metrics after GA4 custom events (`card_click`, `vote_cast`, `comment_created`, `post_created`, `post_updated`) were deployed.

## Measurement Window

**Feb 20, 2026** — first full day after event instrumentation deploy.
Feb 18–19 excluded (events not yet deployed, all custom event counts are 0).

## GA4 Events (Feb 20)

| Event | Count | Unique Users | Source |
|---|---|---|---|
| `page_view` | 572 | 68 | `metrics/daily.json` |
| `session_start` | 114 | 69 | `metrics/daily.json` |
| `first_visit` | 41 | 41 | `metrics/daily.json` |
| `card_click` | 72 | 28 | `metrics/daily.json` |
| `vote_cast` | 4 | 1 | `metrics/daily.json` |
| `comment_created` | 1 | 1 | `metrics/daily.json` |
| `post_created` | 0 | 0 | `metrics/daily.json` |
| `post_updated` | 0 | 0 | `metrics/daily.json` |

## Derived Engagement Rates

| Pillar Metric | Formula | Value | Notes |
|---|---|---|---|
| Card CTR | `card_click` / `page_view` | **12.59%** | 72 / 572 |
| Vote rate | `vote_cast` / `page_view` | **0.70%** | 4 / 572 |
| Comment rate | `comment_created` / `page_view` | **0.17%** | 1 / 572 |
| Post creation rate | `post_created` / `session_start` | **0%** | 0 / 114 |
| Return visit rate | (`session_start` − `first_visit`) / `session_start` | **64.04%** | (114 − 41) / 114 |

## Results

**Measured:** 2026-02-20
**Period:** Feb 20, 2026 (GA4 via daily cron)

### Analysis

- **Card CTR 12.59%** — 72 card clicks from 28 unique users out of 572 page views. Healthy engagement signal.
- **Vote rate 0.70%** — 4 votes from 1 user. Very low but non-zero; suggests auth friction or discovery issue.
- **Comment rate 0.17%** — 1 comment from 1 user. Same pattern as votes.
- **Post creation rate 0%** — no posts created. Expected for early stage.
- **Return visit rate 64.04%** — 73 of 114 sessions were returning visitors. Strong retention signal.

### Baseline Values for Future Experiments

| Pillar | Baseline | Direction |
|---|---|---|
| Card CTR | 12.59% | ↑ |
| Vote rate | 0.70% | ↑ |
| Comment rate | 0.17% | ↑ |
| Post creation rate | 0% | ↑ |
| Return visit rate | 64.04% | ↑ |

### Priority

Weakest pillars: **Post creation (0%)** > **Comment rate (0.17%)** > **Vote rate (0.70%)**. Next experiment should target one of these.
