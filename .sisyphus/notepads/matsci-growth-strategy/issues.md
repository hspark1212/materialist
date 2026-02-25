# Issues

Issue: Tag canonicalization potential edge cases

- Ensure canonical form is applied consistently across UI, API, and DB filtering.
- Potential risk: long tag strings could become undefined; tests cover this boundary.
- Next steps: run full test suite and regression tests on tag filtering paths.
- Issue: Ensure GA4 events do not leak PII in activated user instrumentation; add per-session guard and gating.
