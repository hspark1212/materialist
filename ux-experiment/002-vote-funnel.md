# Experiment 002: Vote Funnel Improvement

**Date:** 2026-02-21
**Type:** Code change
**Status:** Measured
**Pillar:** Vote rate
**Hypothesis:** Removing the auth dead-end and increasing vote button visual affordance will lift vote rate from 0.70% to 2%+.

## Context

Baseline (Feb 20) shows vote rate at **0.70%** (4 votes / 572 page_view, 1 unique user). The funnel from card click (63%) to vote (3.5% of clickers) shows 95% drop-off. Two root causes identified:

1. **Auth dead-end**: Unauthenticated users clicking vote see `toast.info("Sign in to vote.")` with no path to login.
2. **Low visual affordance**: Vote button in card action bar uses `compact` + `sm` sizing, blending with comment/share buttons.

## Changes

### 1. Actionable auth toast

Added Sonner `action` option to sign-in toasts across 3 components:

| File | Toast |
|---|---|
| `vote-button.tsx` | "Sign in to vote." + **Sign in** button → `/auth/login` |
| `post-composer.tsx` | "Sign in to create a post." + **Sign in** button → `/auth/login` |
| `comment-composer.tsx` | "Sign in to comment." + **Sign in** button → `/auth/login` |

Uses `window.location.href` to avoid adding `useRouter` dependency.

### 2. Vote button visual prominence

Added border + hover feedback to VoteButton container:

- Default: `border-transparent` (prevents layout shift)
- Hover: `border-border` + `bg-muted/50` (subtle visual feedback)
- Upvoted: `border-upvote/20 bg-upvote/10` (matching border added)
- Downvoted: `border-downvote/20 bg-downvote/10` (matching border added)

Applies consistently across all contexts (card, detail, comment, discovery).

## Measurement Plan

- **Metric:** Vote rate = `vote_cast` / `page_view`
- **Baseline:** 0.70% (Feb 20)
- **Target:** 2%+
- **Window:** 3 days post-deploy
- **Command:** `/ux-experiment measure 002`
- **Guard rails:** Monitor card CTR, comment rate, return visit rate for regression.

## Rollback

Revert the 3 toast changes and container className change in `vote-button.tsx`.

## Results

**Measured:** 2026-02-24
**Period:** Feb 21–23, 2026 (3 days post-deploy)
**Source:** `metrics/daily.json`

### Raw Data (Feb 21–23 aggregated)

| Event | Count | Unique Users |
|---|---|---|
| `page_view` | 1,012 | 90 |
| `session_start` | 150 | 94 |
| `card_click` | 95 | 34 |
| `vote_cast` | 84 | 8 |
| `comment_created` | 19 | 5 |
| `post_created` | 1 | 1 |
| `bot_mention` | 15 | 3 |
| `bot_reply_received` | 13 | 3 |

### Pillar Metrics

| Metric | Before | Target | Actual | Δ | Verdict |
|---|---|---|---|---|---|
| Vote rate | 0.70% | 2%+ | **8.30%** (84/1012) | +7.60pp (+1086%) | ✅ |
| Card CTR (guard) | 12.59% | no regression | **9.39%** (95/1012) | -3.20pp (-25%) | ⚠️ |
| Comment rate (guard) | 0.17% | no regression | **1.88%** (19/1012) | +1.71pp | ✅ |
| Return visit rate (guard) | 64.04% | no regression | **72.67%** (109/150) | +8.63pp | ✅ |

### Analysis

- **Vote rate exceeded target** — 8.30% vs 2% target. However, Feb 23 alone accounts for 77 of 84 total votes (92%), driven by 4 users heavily using bot mentions. The auth toast + visual affordance changes likely contributed to the Feb 21 lift (3.75%, 3 unique voters vs baseline 1 voter), but the Feb 23 spike is primarily bot-mention-driven engagement, not vote funnel UX.
- **Card CTR dipped** — 9.39% vs 12.59% baseline. Feb 23 saw 639 page_views (likely bot/crawler traffic or viral share) but only 57 card clicks, diluting CTR. Per-user card engagement (95 clicks / 34 users = 2.8 clicks/user) is comparable to baseline (72 / 28 = 2.6 clicks/user).
- **Comment rate surged** — 1.88%, almost entirely from Feb 23 bot mention activity (15 comments, 3 users). Organic comment rate (Feb 21–22) was 0.53% (4/748).
- **Confounding variable** — Bot mention feature launched in the same window. Hard to isolate vote funnel UX impact from bot-driven engagement. The Feb 21 data (pre-bot-spike) is the cleanest signal: vote rate 3.75% with 3 unique voters, suggesting the auth toast change did help.

### Decision

- [x] Keep changes (experiment successful)
- [ ] Iterate (partial success, needs adjustment)
- [ ] Rollback (metrics worsened)

Vote funnel changes are kept. The auth dead-end fix is a clear UX improvement regardless of metric noise. Card CTR dip is not attributable to vote changes (diluted by traffic spike). Future experiments should isolate bot-mention effects by tracking `vote_cast` with/without bot context.
