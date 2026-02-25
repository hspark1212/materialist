# Experiment 004: Activated Users Baseline

Date: 2026-02-25

Summary

- KPI: Activated users/day
- Baseline measurement method: Use GA4 daily JSON (metrics/daily.json) to count unique activated users per day. Activated users defined as first session action among vote, comment, or post within a day.

Methodology

- Activation is logged via GA4 event: activated with activation_type=vote|comment|post (per session, first occurrence per session).
- Compute Activated users/day by counting unique user identifiers from GA4 that emitted activated events. If events are bot-assisted, segment by mention detection parameter (see caveat).
- Caveats: Bots may inflate counts; annotate bot-assisted vs organic when computing per-day baselines.

Computation details

- Data source: GA4 daily metrics JSON (metrics/daily.json).
- Unique users: use GA4 user identifiers for the activated event (not PII).
- Segmentation: include field such as is_bot or a derived bot flag if available; otherwise note as organic.

Notes for future baselines

- After 2-4 weeks of data, adjust the activated baseline to reflect true organic activation.
