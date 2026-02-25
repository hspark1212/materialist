# Learnings

Task: Canonical Tag Model + Compatibility

- Implemented normalizeTag pipeline: trim, strip '#', lowercase, spaces->dashes, allowed chars [a-z0-9_-.+], max length 40, empty -> undefined.
- Updated unit tests to reflect new canonical form and boundary behavior.
- Updated post composer to submit canonical tags (deduplicated) without mutating user input during typing.
- Updated repository tag filtering to support both canonical and legacy tag forms by using OR in Supabase query.
- Build succeeds; tests for query normalization pass.
- Implemented per-session activated users KPI instrumentation using GA4 events (activated, auth*gate*\* , composer_open, search_used, search_result_click, share_click).
