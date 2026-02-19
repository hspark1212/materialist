# Experiment 002: Fix Dead Clicks on Post Cards

**Date:** 2026-02-19
**Type:** UX Fix (code change)
**Status:** Deployed — awaiting measurement
**Hypothesis:** Making entire post cards clickable will reduce dead clicks from 12.91% to <5% and increase pages/session from 1.16.

## Problem

PostCard and PostCardCompact have hover styles (border, shadow) that make them look clickable, but only the title link navigates. Preview text, job details, and card padding are dead zones.

Clarity data: 12.91% dead click rate on homepage (83 of 642 sessions in 3 days).

## Change

CSS overlay link pattern:
- Title `<Link>` gets `after:absolute after:inset-0` pseudo-element covering the entire card
- Card gets `position: relative`
- Interactive children (vote, share, comments, tags, external links, section badge, author) get `relative z-[1]`
- GA4 custom event `card_click` tracks engagement via `src/lib/analytics/gtag.ts`

## Files Modified

- `src/components/post/post-card.tsx`
- `src/components/post/post-card-compact.tsx`

## Metrics

| Metric | Before | Target | Source |
|---|---|---|---|
| Dead clicks (homepage) | 12.91% | <5% | Clarity |
| Pages/session | 1.16 | >1.5 | Clarity |
| card_click events/day | 0 (new) | baseline | GA4 |

## Measurement Plan

- Wait 3 days post-deploy for Clarity data accumulation
- Compare dead click % on homepage (Clarity > Dashboard > filter by homepage)
- Compare pages/session (Clarity > Dashboard)
- Check card_click event counts in GA4 > Reports > Events
- Watch 5 session recordings to verify clicks work as expected

## Rollback

Revert the two file changes. No database or config changes involved.
`git revert <commit-hash>`
