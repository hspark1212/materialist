---
name: experiment
description: Manage Materialist engagement experiments. Create new experiment docs, measure results from GA4/Clarity, or review experiment status.
argument-hint: "[new|measure|status] [experiment-number]"
---

# Experiment Management

## Subcommands

| Command | Description |
|---|---|
| `new` | Create a new experiment document |
| `measure <NNN>` | Read an experiment and guide result measurement |
| `status` | List all experiments with status summary |

Parse the subcommand from args (e.g., `/experiment new`, `/experiment measure 002`, `/experiment status`). If no args or unrecognized, ask with `AskUserQuestion`.

---

## `new` — Create New Experiment

### Workflow

1. **Scan** — Glob `experiments/*.md`, extract the highest NNN number, increment by 1 (zero-padded 3 digits).
2. **Ask** — Use `AskUserQuestion` or conversation to collect:
   - **Hypothesis** (one sentence with numeric target)
   - **Type** (UX Fix / Feature / Performance / Observation)
   - **What to change** (brief description)
   - **Target metrics** (which metrics, what sources)
3. **Generate** — Create `experiments/<NNN>-<slug>.md` using the template below. Slug derived from hypothesis (lowercase, hyphens, max 4 words).
4. **Confirm** — Show the generated document to the user. Ask for approval before writing the file.

### Template

```markdown
# Experiment NNN: <Title>

**Date:** <YYYY-MM-DD>
**Type:** <type>
**Status:** Planning
**Hypothesis:** <hypothesis with numeric target>

## Problem
<description of the problem being addressed>

## Change
<planned changes — what will be different>

## Files Modified
- <list files to be changed>

## Metrics

| Metric | Before | Target | Source |
|---|---|---|---|
| <metric> | <current value> | <target value> | <GA4/Clarity> |

## Measurement Plan
- Wait 3 days post-deploy for data accumulation
- <specific steps to measure each metric>

## Rollback
<how to revert if metrics worsen>
```

### Rules
- One variable per experiment (per `.claude/rules/experiments.md`).
- GA4 custom events: use `event()` from `@/lib/analytics/gtag` — snake_case, flat params.
- Before metrics should come from experiment 001 baseline or the most recent measurement.

---

## `measure <NNN>` — Measure Experiment Results

### Workflow

1. **Read** — Open `experiments/<NNN>-*.md` (glob to find the file by number prefix).
2. **Extract** — Parse the Metrics table to identify what to measure and where (GA4 vs Clarity).
3. **Guide** — Provide step-by-step instructions for collecting each metric:
   - **Clarity:** Dashboard URL, filters to apply, which numbers to look at
   - **GA4:** Reports path, event names, date range
4. **Collect** — If browser tools are available, offer to navigate to Clarity/GA4 and extract data.
5. **Update** — Add a `## Results` section to the experiment document:

```markdown
## Results

**Measured:** <YYYY-MM-DD>
**Period:** <date range>

| Metric | Before | Target | Actual | Δ | Verdict |
|---|---|---|---|---|---|
| <metric> | <before> | <target> | <actual> | <change> | ✅/❌ |

### Analysis
<interpretation of results>

### Decision
- [ ] Keep changes (experiment successful)
- [ ] Iterate (partial success, needs adjustment)
- [ ] Rollback (metrics worsened)
```

6. **Update status** — Change `**Status:**` line to `Measured` or `Completed`.

---

## `status` — Experiment Status Overview

### Workflow

1. **Scan** — Glob `experiments/*.md`, read each file.
2. **Extract** from each file: number, title, date, type, status, hypothesis (first sentence).
3. **Output** — Markdown table:

```
| # | Title | Date | Type | Status | Hypothesis |
|---|---|---|---|---|---|
| 001 | Baseline Engagement Audit | 2026-02-19 | Observation | Completed | — |
| 002 | Fix Dead Clicks on Post Cards | 2026-02-19 | UX Fix | Deployed | Dead clicks <5% |
```

4. **Summary** — Count by status (Planning / Deployed / Measured / Completed / Rolled back).
