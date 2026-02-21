# Experiment 002: Vote Funnel Improvement

**Date:** 2026-02-21
**Type:** Code change
**Status:** Deployed
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
- **Command:** `/experiment measure 002`
- **Guard rails:** Monitor card CTR, comment rate, return visit rate for regression.

## Rollback

Revert the 3 toast changes and container className change in `vote-button.tsx`.
