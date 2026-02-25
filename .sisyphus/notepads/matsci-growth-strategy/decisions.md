# Decisions

Decision: Canonical Tag Model

- Adopt lowercase slug form without leading '#', spaces -> '-', allowed chars [a-z0-9_-.+], max length 40.
- Special-case: empty or overly long results -> undefined (no tag).
- Update UI and API flows to use canonicalized tags for filtering and display.
- Implement dual-form filtering at repository level to support legacy '#tag' values.
- Decision: Use per-session sessionStorage flag to gate activated user event emission; extend daily metrics collector to include new events without changing existing schemas.
