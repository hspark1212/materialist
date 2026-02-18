import { NextResponse } from "next/server"

import { ApplicationError } from "../application/errors"
import type { AuthorType } from "../application/ports"
import type { CommentSort, PostSort, VoteDirection, VoteTargetType } from "../domain/types"
import { normalizeSearchQuery, normalizeTag } from "../domain/query-normalization"

const validSections = new Set(["papers", "forum", "showcase", "jobs"])

function parsePositiveInteger(value: string | null, fallback: number, max: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return Math.min(parsed, max)
}

export function parsePostSort(value: string | null): PostSort {
  if (value === "new" || value === "top" || value === "hot") {
    return value
  }
  return "hot"
}

export function parseCommentSort(value: string | null): CommentSort {
  if (value === "new" || value === "best") {
    return value
  }
  return "best"
}

export function parseSection(value: string | null): "papers" | "forum" | "showcase" | "jobs" | undefined {
  if (!value || value === "all") return undefined
  if (validSections.has(value)) {
    return value as "papers" | "forum" | "showcase" | "jobs"
  }
  throw new ApplicationError(400, "Invalid section")
}

export function parsePostsLimit(value: string | null): number {
  const parsed = parsePositiveInteger(value, 20, 100)
  return parsed < 1 ? 20 : parsed
}

export function parsePostsOffset(value: string | null): number {
  return parsePositiveInteger(value, 0, 10_000)
}

export function parseSearchQuery(value: string | null): string | undefined {
  return normalizeSearchQuery(value)
}

export function parseTag(value: string | null): string | undefined {
  return normalizeTag(value)
}

export function parseAuthorType(value: string | null): AuthorType {
  // Default to "human", also handles legacy "all"
  if (value === "bot") return "bot"
  return "human"
}

export function parseVoteTargetType(value: unknown): VoteTargetType {
  if (value === "post" || value === "comment") return value
  throw new ApplicationError(400, "Invalid vote target type")
}

export function parseVoteDirection(value: unknown): VoteDirection {
  if (value === 1 || value === -1) return value
  throw new ApplicationError(400, "Invalid vote direction")
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApplicationError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  console.error("[API] Unhandled error:", error)
  return NextResponse.json({ error: "Internal server error" }, { status: 500 })
}
