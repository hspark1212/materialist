#!/usr/bin/env bash
set -euo pipefail
# Usage: git diff | bash .claude/skills/review/scripts/codex-review.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECKLIST_FILE="$SCRIPT_DIR/../references/checklist.md"

DIFF=$(cat)
if [ -z "$DIFF" ]; then
  echo "No diff provided"
  exit 0
fi

CHECKLIST=""
if [ -f "$CHECKLIST_FILE" ]; then
  CHECKLIST=$(cat "$CHECKLIST_FILE")
fi

codex exec \
  "Review this git diff against the project-specific checklist AND general code quality.

## Project-Specific Checklist
$CHECKLIST

## General Review
Also check for: bugs, security vulnerabilities, performance issues, code quality problems.

## Output Format
For each finding: severity (Critical/Warning/Suggestion), file:line, description, recommended fix. Be concise.

## Git Diff
$DIFF"
