---
name: experiment
description: Manage engagement experiments. Create, measure, review status, or get suggestions for the next experiment.
argument-hint: "[new|measure|status|next] [experiment-number]"
---

# Experiment Management

## Subcommands

| Command | Description |
|---|---|
| `new` | Create a new experiment targeting the weakest pillar metric |
| `measure <NNN>` | Guide result collection and auto-generate verdict |
| `status` | List all experiments with engagement trend tracking |
| `next` | Analyze past results and suggest the next experiment |

Parse the subcommand from args (e.g., `/experiment new`, `/experiment measure 001`, `/experiment status`, `/experiment next`). If no args or unrecognized, ask with `AskUserQuestion`.

---

## `new` — Create New Experiment

### Workflow

1. **Scan baseline** — Read `experiments/001-baseline.md` (or latest measured experiment). Extract current pillar metric values.
2. **Analyze weakness** — Compare the 4 pillar metrics (vote rate, comment rate, post creation rate, return visit rate) against reasonable benchmarks. Identify the weakest.
3. **Review prior art** — Scan all `experiments/*.md` for previous experiments targeting the same pillar. Note what worked and what didn't.
4. **Suggest** — Propose 2-3 hypothesis options targeting the weakest pillar. Use `AskUserQuestion` with previews to let the user choose.
5. **Collect details** — Use `AskUserQuestion` or conversation to collect:
   - **Hypothesis** (one sentence with numeric target)
   - **Type** (UX Fix / Feature / Performance / Observation)
   - **What to change** (brief description)
6. **Generate** — Create `experiments/<NNN>-<slug>.md` using the template below. Auto-fill Before values from baseline.
7. **Confirm** — Show the generated document. Ask for approval before writing.

### Template

```markdown
# Experiment NNN: <Title>

**Date:** <YYYY-MM-DD>
**Type:** <type>
**Status:** Planning
**Pillar:** <Vote rate | Comment rate | Post creation rate | Return visit rate>
**Hypothesis:** <hypothesis with numeric target>

## Prior Art
<summary of related past experiments and their outcomes, or "First experiment targeting this pillar.">

## Problem
<description of the problem being addressed>

## Change
<planned changes — what will be different>

## Files Modified
- <list files to be changed>

## Metrics

| Metric | Before | Target | Source |
|---|---|---|---|
| <primary pillar metric> | <from baseline> | <target value> | GA4 |
| <supporting metric> | <from baseline> | <target value> | GA4 |

## Measurement Plan
- Wait 3 days post-deploy for data accumulation
- <specific steps to measure each metric>

## Rollback
<how to revert if metrics worsen>
```

---

## `measure <NNN>` — Measure Experiment Results

### Workflow

1. **Read** — Glob `experiments/<NNN>-*.md` to find the file. Parse the Metrics table.
2. **Generate links** — For each metric, provide the appropriate dashboard link and instructions:

   **GA4:**
   - Link: `https://analytics.google.com/analytics/web/` → Reports → Engagement → Events
   - Instructions: Filter by event name (e.g., `vote_cast`), set date range to experiment period (3 days post-deploy)
   - What to note: Event count, unique users triggering the event

3. **Collect** — Ask the user to paste the numbers. Accept them via conversation.
4. **Calculate** — For each metric:
   - `Δ` = Actual − Before (with sign)
   - `Δ%` = ((Actual − Before) / Before) × 100
   - `Verdict` = ✅ if Actual meets or exceeds Target, ❌ otherwise
5. **Generate Results** — Append to the experiment doc:

```markdown
## Results

**Measured:** <YYYY-MM-DD>
**Period:** <date range>

| Metric | Before | Target | Actual | Δ | Verdict |
|---|---|---|---|---|---|
| <metric> | <before> | <target> | <actual> | <change with %> | ✅/❌ |

### Analysis
<interpretation: what improved, what didn't, possible reasons>

### Decision
- [ ] Keep changes (experiment successful)
- [ ] Iterate (partial success, needs adjustment)
- [ ] Rollback (metrics worsened)
```

6. **Update status** — Change `**Status:**` to `Measured`.
7. **Update baseline** — If pillar metrics improved, note new values for future experiments.

---

## `status` — Experiment Status Overview

### Workflow

1. **Scan** — Glob `experiments/*.md`, read each file.
2. **Extract** from each: number, title, date, type, status, pillar, hypothesis (first sentence).
3. **Output table:**

```
| # | Title | Date | Pillar | Status | Hypothesis |
|---|---|---|---|---|---|
| 001 | Post-Event Baseline | 2026-02-20 | All | Planning | — |
```

4. **Summary** — Count by status (Planning / Deployed / Measured / Completed / Rolled back).

5. **Engagement trend** — If multiple measured experiments exist, show pillar metric progression:

```
Pillar Trends (baseline → latest):
  Vote rate:          —% → —%
  Comment rate:       —% → —%
  Post creation rate: —% → —%
  Return visit rate:  —% → —%
```

---

## `next` — Suggest Next Experiment

### Workflow

1. **Read all experiments** — Glob `experiments/*.md`. Parse status, pillar, and results.
2. **Check prerequisites:**
   - If baseline (001) is not yet measured: respond "Baseline 001 has not been measured yet. Run `/experiment measure 001` first."
   - If any experiment is `Deployed` but not yet measured: respond "Experiment <NNN> is deployed but not yet measured. Run `/experiment measure <NNN>` first."
3. **Analyze gaps** — Compare current pillar values against targets. Rank by improvement opportunity.
4. **Priority order** (tiebreaker when gaps are similar):
   1. Vote rate low → vote UX optimization
   2. Comment rate low → comment prompt improvement
   3. Card CTR low → content discovery improvement
   4. Post creation rate low → creation flow simplification
   5. Return visit rate low → retention hooks
5. **Suggest** — Propose 1-2 experiment ideas with:
   - Target pillar
   - Hypothesis sketch
   - Estimated complexity (Low / Medium / High)
   - Relevant prior experiment results
6. **Offer** — Ask if the user wants to proceed with `/experiment new` using the suggestion.
