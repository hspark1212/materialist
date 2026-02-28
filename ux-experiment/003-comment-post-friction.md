# Experiment 003: Comment & Post Creation Friction Reduction

**Date:** 2026-02-24
**Type:** Code change
**Status:** Deployed
**Deployed:** ~2026-02-25
**Pillar:** Comment rate + Post creation rate
**Hypothesis:** Adding a comment empty state and section-aware composer placeholders will lift organic comment rate from 0.53% to 1.5%+ and generate measurable post_created events.

## Prior Art

- 002 (Vote Funnel): Actionable auth toasts + vote button visual prominence. Vote rate 0.70% -> 8.30% (confounded by bot mentions). Showed that removing dead-ends and increasing affordance works.

## Problem

1. **Empty comment section**: When a post has 0 comments, the area below "Comments" is blank. No encouragement to be the first commenter.
2. **Generic post composer**: Title and content placeholders are the same regardless of section (papers/forum/showcase/jobs). Users face "what do I write?" friction.

## Change

### A. Comment empty state + contextual placeholder
- Post detail page: dashed-border empty state when 0 comments — "No comments yet. Be the first to share your thoughts."
- Comment composer: placeholder changes to "Be the first to share your thoughts..." when no comments exist

### B. Section-aware post composer placeholders
- Title placeholder: section-specific examples (e.g., papers: "e.g., New MLFF benchmark shows 10x speedup over DFT")
- Content placeholder: section-specific prompts (e.g., forum: "What's on your mind? Share a question, observation, or start a discussion...")

## Files Modified

- `src/app/post/[id]/post-detail-page-client.tsx` — empty state conditional + `isFirstComment` prop
- `src/components/comment/comment-composer.tsx` — `isFirstComment` prop + conditional placeholder
- `src/components/post/post-composer.tsx` — `sectionPlaceholders` object + apply to title/content inputs

## Metrics

| Metric | Before | Target | Source |
|---|---|---|---|
| Comment rate (organic) | 0.53% | 1.5%+ | GA4 `comment_created` / `page_view` |
| Post creation rate | ~0% | > 0 (any measurable lift) | GA4 `post_created` / `session_start` |
| Vote rate (guard) | ~3.75% | no regression | GA4 |
| Card CTR (guard) | ~12% | no regression | GA4 |

## Measurement Plan

- Wait 5 days post-deploy for data accumulation (longer window due to low baseline volume)
- Run `/ux-experiment measure 003`
- Exclude known internal traffic from analysis where possible

## Rollback

- Change A: Remove empty state div from `post-detail-page-client.tsx`, remove `isFirstComment` prop from `comment-composer.tsx`
- Change B: Revert placeholder strings to original values in `post-composer.tsx`
