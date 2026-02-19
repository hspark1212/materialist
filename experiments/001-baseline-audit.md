# Experiment 001: Baseline Engagement Audit

**Date:** 2026-02-19
**Type:** Observation (no code changes)
**Tools:** GA4 + Microsoft Clarity
**Period:** Last 3 days (Feb 16–19, 2026)

## Key Metrics

### GA4 (28-day)
| Metric | Value |
|---|---|
| Active users | 314 |
| New users | 314 (100% new) |
| Events | 2,900 |
| Key events | 0 (not configured) |
| Avg engagement time | 45s |

### Clarity (3-day, all pages)
| Metric | Value |
|---|---|
| Sessions | 2,651 (281 bot excluded) |
| Unique users | 2,626 |
| Pages/session | **1.16** |
| Scroll depth | 69.19% |
| Active time | **21s** (of 1 min total) |
| Returning users | **0.11%** (3 sessions) |
| Dead clicks | **9.17%** (243 sessions) |
| Quick backs | **2.23%** (59 sessions) |
| Rage clicks | 0% |

### Clarity (3-day, homepage only)
| Metric | Value |
|---|---|
| Sessions | 642 |
| Pages/session | 1.55 |
| Active time | 33s |
| Dead clicks | **12.91%** (83 sessions) |
| Quick backs | **7.62%** (49 sessions) |

### Performance (Clarity Web Vitals)
| Metric | All pages | Homepage |
|---|---|---|
| Score | 87/100 | 81/100 |
| LCP | 1.6s (good) | **3.1s (needs improvement)** |
| INP | 180ms (good) | 190ms (good) |
| CLS | 0.018 (good) | 0.079 (good) |

## GA4 Enhanced Measurement Status
- Page views: OFF (enhanced history-based; basic page_view still active)
- Scrolls: ON
- Outbound clicks: ON
- Site search: ON
- Form interactions: ON
- Video engagement: ON
- File downloads: ON

## Auto-collected Events (realtime sample)
- page_view, user_engagement, scroll, session_start, first_visit, form_start

## Traffic Sources
| Source | Sessions (Clarity) |
|---|---|
| www.linkedin.com | 283 |
| materialist.science (self) | 264 |
| orcid.org | 157 |
| 192.168.1.219 (local dev) | 134 |
| com.linkedin.android | 86 |
| github.com | 40 |
| statics.teams.cdn.office.net | 33 |

## Page Visits (Clarity heatmap, 3-day)
| Page | Visits |
|---|---|
| / (home) | 825 |
| /papers | 305 |
| /forum | 159 |
| /login | 94 |
| /jobs | 84 |
| /showcase | 81 |

## Heatmap Insights

### Click heatmap (homepage, 438 views, 679 clicks)
- #1: Header navigation tabs — 128 clicks (18.85%)
- #2: "Papers" section link — 24 clicks (3.53%)
- #3: Post card container — 16 clicks (2.36%)
- #4: Article title link — 15 clicks (2.21%)
- #5: Blog post title — 14 clicks (2.06%)
- 96 total clickable elements detected

### Scroll heatmap (homepage)
- 100% see top 20%
- 93.6% reach 25%
- 81.5% reach 40%
- **66.2% reach 50%** (⅓ drop before halfway)
- **47.7% reach 60%** (majority gone)
- 42.5% reach 70%

## Clarity AI Insights (from session recordings)
1. **"Frequent login initiation without completion"** — Users click Google/Email sign-in but don't complete auth. Repeated clicks + dead clicks on login page. Possible friction in third-party auth flow.
2. **"Active forum topic exploration"** — Visitors navigate to forum and click into discussion threads, showing interest in community content.

## Top Problems Identified

### P1: Near-zero retention (0.11% returning users)
- 99.89% are one-time visitors
- No reason to come back — no notifications, no digest emails, no bookmark-worthy content flow

### P2: Extremely low engagement depth (1.16 pages/session, 21s active)
- Users land, glance, leave
- Homepage bounce is fast — 33% gone before 50% scroll

### P3: Dead clicks on homepage (12.91%)
- Users clicking elements that don't respond
- Need to identify which elements are dead-click targets (requires Clarity segment drill-down)

### P4: Login friction
- Clarity AI flagged incomplete login flows
- 94 login page visits but unclear completion rate
- Quick backs from homepage (7.62%) may partially relate to auth UX

### P5: Homepage LCP regression (3.1s vs 1.6s site-wide)
- Largest Contentful Paint needs improvement on homepage
- Likely hero section or large image loading

## Experiment Candidates (ordered by expected impact)

### Exp A: "First 5 seconds" — Homepage value prop clarity
**Hypothesis:** Users leave quickly because the homepage doesn't immediately communicate what Materialist is and why they should stay.
**Measure:** Active time, scroll depth, pages/session
**Approach:** Improve above-the-fold content to clearly state value proposition

### Exp B: Login flow friction reduction
**Hypothesis:** Users attempt to sign in but encounter friction, leading to dead clicks and abandonment.
**Measure:** Login completion rate, dead clicks on /login
**Approach:** Review auth flow UX, add loading states, improve error feedback

### Exp C: Content discovery improvement
**Hypothesis:** Low pages/session means users don't find interesting content beyond the first page.
**Measure:** Pages/session, scroll depth
**Approach:** Improve post card CTAs, add "related posts", improve content previews

### Exp D: Return visit hooks
**Hypothesis:** No mechanism exists to bring users back.
**Measure:** Returning user rate
**Approach:** Email digest, browser notifications, or "save for later" features (requires code)

## Next Steps
- [ ] Drill into dead clicks segment in Clarity to identify specific broken elements
- [ ] Watch 5-10 session recordings to understand actual user journeys
- [ ] Decide on first experiment (A, B, C, or D)
- [ ] Determine if chosen experiment needs code changes or can be tested with existing tools
