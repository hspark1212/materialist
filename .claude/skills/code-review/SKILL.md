---
name: code-review
description: Pre-commit code review with 6 parallel expert subagents. Use when the user invokes /code-review, asks for a code review before committing, or wants to check staged/uncommitted changes. Checks architecture, security, database, UI, design philosophy, and runs automated checks.
argument-hint: "[--staged | --all | --quick | files...]"
---

# Code Review — 6 Parallel Expert Subagents

## Flag Parsing

Parse flags from the skill arguments:

| Flag | Behavior |
|---|---|
| (none) | Staged changes (default) — `git diff --cached` |
| `--staged` | Explicit staged (same as default) |
| `--all` | All uncommitted — `git diff HEAD` |
| `--quick` | Skip Automated Checks subagent (subagent 6) |
| `files...` | Specific files — append `-- <files>` to diff command |

Flags combine freely: `--all --quick`, `--quick src/features/posts/`.

---

## Phase 1 — Diff Collection

1. Build diff command from parsed flags:
   - Default/`--staged`: `git diff --cached`
   - `--all`: `git diff HEAD`
   - With files: append `-- <file1> <file2> ...`
2. Run via Bash tool, capture output as `DIFF_OUTPUT`.
3. Collect untracked new files: run `git ls-files --others --exclude-standard`. For each untracked file, generate a synthetic diff (unified format with all lines as additions) and append to `DIFF_OUTPUT`. Add them to the changed files list with `A` status.
4. **Early exit** if diff is empty AND no untracked files: respond `"No changes to review."` and stop.
5. Extract changed files list with status from diff headers (`A`/`M`/`D`/`R`).
6. Read full file contents for all non-deleted changed files (parallel Read calls), including untracked new files.
7. Build review context: `{diff, changedFiles[], changedFilePaths[]}`.
8. If using staged-only mode and unstaged changes exist (check via `git diff --stat`), note: _"Reviewing staged changes only. Use `--all` to include everything."_

---

## Phase 2 — 6 Parallel Expert Subagents

**CRITICAL: Launch ALL applicable subagents in a SINGLE message using multiple Task tool calls. All 6 are independent — they MUST run simultaneously.**

If `--quick` flag is set, launch only subagents 1-5 (skip subagent 6).

Each subagent receives the same common preamble in its prompt:

```
## Changed Files
{list of changed files with A/M/D/R status}

## Diff
{DIFF_OUTPUT — the full raw diff}

## Full File Contents
{for each non-deleted changed file: filename header + complete file content}
```

### Output Format (all expert subagents 1-5)

Each subagent MUST return findings as a structured list. Each finding has:
- **severity**: `critical` | `warning` | `suggestion`
- **file**: file path
- **line**: line number (from diff or file, 0 if not applicable)
- **message**: concise description of the issue
- **fix**: suggested fix (one sentence)

If no issues found, return: `NO_ISSUES_FOUND`

---

### Subagent 1: Architecture Expert

- **subagent_type:** `Explore`
- **model:** `sonnet`

**Prompt template:**

```
You are an Architecture expert reviewing code changes for a Next.js project.

{COMMON_PREAMBLE}

## Instructions

First, Read these files for project rules:
- `CLAUDE.md` (focus on the Architecture section)
- `.claude/rules/database.md`

Then review the diff and full file contents. Check BOTH project-specific rules AND general architecture quality.

### Project Rule Checks
- Clean architecture layer imports: domain/ must NOT import from application/, infrastructure/, presentation/, or api/. Imports flow inward only.
- Feature module boundaries: no direct cross-feature imports (e.g., `features/posts/` must not import from `features/comments/domain/`)
- Middleware scope: if middleware.ts is changed, it MUST be scoped to `/auth/*` only — expanding scope causes Cloudflare Error 1102 (CRITICAL)
- Path alias consistency: all imports use `@/` prefix (maps to `src/`)

### General Review
- Import hygiene: unused imports, circular dependencies
- Type safety: gratuitous `any`, unsafe `as` casts, `@ts-ignore` usage
- Dead code, unreachable branches
- Function/module cohesion and separation of concerns

Return findings in this exact format, one per issue:
- severity: critical | warning | suggestion
- file: <path>
- line: <number>
- message: <description>
- fix: <suggestion>

If no issues found, return: NO_ISSUES_FOUND
```

### Subagent 2: Security Expert

- **subagent_type:** `Explore`
- **model:** `sonnet`

**Prompt template:**

```
You are a Security expert reviewing code changes for a Next.js + Supabase project.

{COMMON_PREAMBLE}

## Instructions

First, Read this file for project rules:
- `.claude/rules/database.md` (focus on RLS & Admin Client, Key Triggers sections)

Then review the diff and full file contents. Check BOTH project-specific rules AND general security.

### Project Rule Checks
- Admin client (`src/lib/supabase/admin.ts`) usage is restricted to exactly 3 files: ORCID callback, ORCID disconnect, account deletion. Any other file importing admin client is CRITICAL.
- RLS bypass: no `.from()` calls that skip row-level security
- Protected profile fields (karma, orcid_*, is_bot, email, generated_display_name) must NOT be updatable from client code

### General Review
- XSS: unsanitized user input rendered as HTML, dangerouslySetInnerHTML
- Injection: SQL injection, command injection, path traversal
- Secrets exposure: hardcoded API keys, tokens, credentials in code
- OWASP Top 10 patterns
- Auth/authorization: missing auth checks on protected routes/API endpoints
- Environment variables: NEXT_PUBLIC_ prefix only for client-safe values

Return findings in this exact format, one per issue:
- severity: critical | warning | suggestion
- file: <path>
- line: <number>
- message: <description>
- fix: <suggestion>

If no issues found, return: NO_ISSUES_FOUND
```

### Subagent 3: Database Expert

- **subagent_type:** `Explore`
- **model:** `sonnet`

**Prompt template:**

```
You are a Database expert reviewing code changes for a Supabase-backed project.

{COMMON_PREAMBLE}

## Instructions

First, Read this file for project rules:
- `.claude/rules/database.md` (read the entire file)

Then review the diff and full file contents. Check BOTH project-specific rules AND general database quality.

### Project Rule Checks
- All Supabase rows MUST go through domain mappers (functions in `features/*/domain/mappers.ts`) before reaching the client. Returning raw DB rows is CRITICAL.
- List queries must use column selection constants (`POST_COLUMNS_LIST`, `PROFILE_COLUMNS`) to avoid fetching PII
- If new columns are added, check if DB trigger column lists need updating (`handle_updated_at`, `on_post_search_document`)
- Repository implementations must follow the port/adapter pattern (implement interface from application/ layer)

### General Review
- Query performance: N+1 queries, missing pagination, unbounded selects
- Data integrity: nullable field handling, type conversion safety
- Error handling: graceful handling of DB failures, connection issues
- Transaction safety where multiple writes are involved

Return findings in this exact format, one per issue:
- severity: critical | warning | suggestion
- file: <path>
- line: <number>
- message: <description>
- fix: <suggestion>

If no issues found, return: NO_ISSUES_FOUND
```

### Subagent 4: UI/UX Expert

- **subagent_type:** `Explore`
- **model:** `sonnet`

**Prompt template:**

```
You are a UI/UX expert reviewing code changes for a Next.js + Tailwind CSS v4 + shadcn/ui project.

{COMMON_PREAMBLE}

## Instructions

First, Read these files for project rules:
- `.claude/rules/ui.md`
- `.claude/rules/ux-experiment.md`

Then review the diff and full file contents. Check BOTH project-specific rules AND general UI/UX quality.

### Project Rule Checks
- Files in `src/components/ui/` are READ-ONLY (shadcn/ui). Any modification is CRITICAL.
- Tailwind v4 uses CSS-only config (`src/app/globals.css`). There must be no `tailwind.config.ts`.
- Hydration safety: `formatDistanceToNow` and time-based rendering require `suppressHydrationWarning`
- When a prop is removed from a component, all usages across the codebase must be updated
- New GA4 events must follow naming conventions and be registered in the event inventory

### General Review
- Accessibility: proper aria attributes, keyboard navigation, focus management
- Responsive design: mobile (375px) breakpoint handling, safe areas
- Component reusability and composition patterns
- UX consistency with existing patterns in the codebase

Return findings in this exact format, one per issue:
- severity: critical | warning | suggestion
- file: <path>
- line: <number>
- message: <description>
- fix: <suggestion>

If no issues found, return: NO_ISSUES_FOUND
```

### Subagent 5: Design Philosophy Expert

- **subagent_type:** `Explore`
- **model:** `sonnet`

**Prompt template:**

```
You are a Design Philosophy expert reviewing code changes against the project's core engineering principles.

{COMMON_PREAMBLE}

## Instructions

First, Read this file for project principles:
- `CLAUDE.md` (focus on the Principles section)

Then review the diff and full file contents. Evaluate against the 5 core principles AND general code quality.

### CLAUDE.md Principles Review
- **Simplicity first** — Are there unnecessary abstractions, speculative features, premature optimizations, or "while I'm here" cleanups?
- **Surgical changes** — Are all changes traceable to a specific request? Any unsolicited comments, docstrings, or type annotations added to unchanged code?
- **Over-engineering** — Excessive error handling for impossible scenarios? Feature flags or backwards-compat shims where simple changes suffice? Helpers/utilities for one-time operations?
- **Style matching** — Do changes match existing code patterns and conventions? Any `_var` renaming of unused params, `// removed` comments, or unnecessary re-exports?
- **Scope discipline** — Is every changed line necessary? Could 3 similar lines replace a premature abstraction?

### General Review
- Code readability and clarity
- Purpose clarity: is the intent of each change obvious?
- Consistency with existing codebase patterns

Return findings in this exact format, one per issue:
- severity: critical | warning | suggestion
- file: <path>
- line: <number>
- message: <description>
- fix: <suggestion>

If no issues found, return: NO_ISSUES_FOUND
```

### Subagent 6: Automated Checks

- **subagent_type:** `Bash`
- **model:** `haiku`
- **Skip if** `--quick` flag is set

**Prompt template:**

```
Run these 3 commands and report results. Run all 3 regardless of individual failures.

1. npm run lint
2. npx tsc --noEmit
3. npm run test

For each command, report:
- Status: PASS or FAIL
- If FAIL: include the first 50 lines of error output

Format your response exactly like this:

LINT: PASS|FAIL
{error output if FAIL}

TSC: PASS|FAIL
{error output if FAIL}

TEST: PASS|FAIL
{error output if FAIL}
```

---

## Phase 3 — Aggregation & Report

After ALL subagents complete, aggregate results:

1. **Parse** all subagent results into structured findings: `{id, severity, file, line, message, fix, source}`
   - Source tags: `[Arch]`, `[Sec]`, `[DB]`, `[UI]`, `[Phil]`, `[Auto]`
2. **Deduplicate**: findings on same file + line (within 3 lines) + similar message → merge, keeping higher severity and combining source tags (e.g., `[Arch+Sec]`)
3. **Auto check failures** → add as Critical findings with `[Auto]` tag
4. **Sort**: Critical → Warning → Suggestion; within each severity: file path → line number
5. **Number** sequentially across all findings (for "Fix #3" reference)

---

## Phase 4 — Verdict

```
if (critical > 0 OR any auto check failed) → "BLOCK — must fix before committing"
if (warning > 0)                            → "CAUTION — review before committing"
else                                        → "PASS — ready to commit"
```

---

## Report Template

Output this report to the user:

```markdown
## Code Review Results

**Scope:** {staged | all | specific files} ({N} files changed)
**Files:** {changed file paths, one per line}

---

### Automated Checks

| Check | Status |
|---|---|
| ESLint | PASS / FAIL |
| TypeScript | PASS / FAIL |
| Unit Tests | PASS / FAIL |

{If any FAIL, show condensed error output}

---

### Findings ({N} critical, {N} warnings, {N} suggestions)

#### Critical
1. [{source}] `{file}:{line}` — {message}
   Fix: {suggestion}

#### Warnings
2. [{source}] `{file}:{line}` — {message}
   Fix: {suggestion}

#### Suggestions
3. [{source}] `{file}:{line}` — {message}
   Fix: {suggestion}

---

### Verdict
**{BLOCK / CAUTION / PASS}** — {description}

*Tip: "Fix #1 and #3" or "Fix all warnings" to address findings.*
```

**If `--quick` flag was used:** omit the Automated Checks table entirely and add a note: _"Automated checks skipped (`--quick`). Run `npm run lint && npx tsc --noEmit && npm run test` manually."_

**If a subagent failed:** add a warning line: _"Note: {Expert} review incomplete due to subagent error. Results may be partial."_

---

## Edge Cases

- **Empty diff** → `"No changes to review."` and stop
- **Only deletions** → Review diff only (no full file contents to read). Focus on dangling imports/references.
- **Binary files** → Skip from Read, mark as `(binary)` in file list
- **Large diff (>500 lines)** → Provide full diff. Note if truncation occurs: _"Large diff — review may be incomplete."_
- **Config-only changes** → Review normally. Note: _"Changes are configuration/documentation only."_
- **shadcn/ui file modified** → UI Expert flags as Critical immediately
- **Middleware scope expanded** → Architecture Expert flags as Critical immediately
- **Subagent failure** → Include warning in report, continue with other results
