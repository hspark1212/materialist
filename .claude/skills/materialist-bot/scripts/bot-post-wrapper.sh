#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

ENV_FILE="$PROJECT_ROOT/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found."
  echo "Create .env.local with your Supabase credentials and BOT_USER_ID_* values."
  exit 1
fi

set -a && source "$ENV_FILE" && set +a
cd "$PROJECT_ROOT"
exec npx tsx scripts/bot-post.ts "$@"
