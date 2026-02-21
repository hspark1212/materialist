---
name: review
description: Pre-commit code review. Analyzes git diff against Materialist project rules, optionally gets Codex CLI second opinion, and presents unified findings. Use /review before committing.
argument-hint: "[--staged | --no-codex | --codex-only | files...]"
---

# Pre-Commit Code Review

## Flag Parsing

| Flag | Behavior |
|---|---|
| (none) | Unstaged changes, Claude + Codex |
| `--staged` | Staged changes only (`git diff --cached`) |
| `--no-codex` | Claude only (faster) |
| `--codex-only` | Codex only (skip Claude checklist) |
| `files...` | Specific files only |

Parse flags from args. Multiple flags can combine (e.g., `--staged --no-codex`).

---

## Phase 1 — Diff Collection

1. **Build diff command** based on flags:
   - Default: `git diff`
   - `--staged`: `git diff --cached`
   - `files...`: `git diff -- <files>` or `git diff --cached -- <files>`
2. **Run diff** via Bash. If empty output → print "Nothing to review." and stop.
3. **Extract changed files** from the diff (parse `diff --git a/... b/...` lines).
4. **Read each changed file** with the Read tool to understand full context (not just the diff hunks).

---

## Phase 2 — Claude Self-Review

Skip if `--codex-only`.

1. **Read** the checklist at `.claude/skills/review/references/checklist.md`.
2. **Review** each changed file against all 14 checklist items. Only flag actual violations found in the diff — do not flag items that don't apply.
3. **Also check** for general issues: bugs, logic errors, error handling gaps, naming inconsistencies.
4. **Record findings** as a list, each with:
   - **Severity**: `Critical` (blocks commit) / `Warning` (should fix) / `Suggestion` (optional improvement)
   - **Location**: `file:line`
   - **Description**: What's wrong
   - **Fix**: How to fix it

---

## Phase 3 — Codex Second Opinion

Skip if `--no-codex`. Run in parallel with Phase 2 when possible (use Task tool with Bash subagent).

1. **Pipe the diff** to the wrapper script:
   ```bash
   git diff | bash .claude/skills/review/scripts/codex-review.sh
   ```
   (Use `git diff --cached` for `--staged`, add `-- <files>` for specific files.)

2. **If Codex CLI fails** (not installed, timeout, error):
   - Print warning: "Codex CLI unavailable — showing Claude-only results."
   - Continue with Claude results only.

3. **Parse Codex output** — Extract findings with severity, file:line, description, and fix.

---

## Phase 4 — Unified Report

1. **Merge findings** from Claude (Phase 2) and Codex (Phase 3).
2. **Deduplicate** — If both sources flag the same file:line with the same issue, merge into one entry tagged `[Both]`.
3. **Tag source** — `[Claude]`, `[Codex]`, or `[Both]`.
4. **Sort** by severity: Critical → Warning → Suggestion.
5. **Output report:**

```
## Review Results (N critical, N warnings, N suggestions)

### Critical
1. [Both] `src/features/posts/infrastructure/repo.ts:45`
   Admin client used outside allowed scope
   → Use standard supabase client with RLS

### Warnings
1. [Claude] `src/app/api/posts/route.ts:12`
   Raw Supabase row returned without domain mapper
   → Apply mapPostRowToPost() before response

### Suggestions
1. [Codex] `src/components/post/post-detail.tsx:89`
   Consider extracting repeated logic
   → Create shared helper

---
✅ Ready to commit (no critical issues)
⚠️ N warnings — recommend fixing before commit
❌ N critical issues — must fix before commit
```

6. **Footer logic:**
   - 0 critical, 0 warnings → `✅ Ready to commit`
   - 0 critical, N warnings → `⚠️ N warnings — recommend fixing before commit`
   - N critical → `❌ N critical issues — must fix before commit`

After presenting the report, the user can ask to fix issues in the same session (e.g., "Fix all warnings" or "Fix #1 and #3").
