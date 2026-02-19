import { NextResponse } from "next/server"

import { ApplicationError } from "@/features/posts/application/errors"

function parsePositiveInteger(value: string | null, fallback: number, max: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return Math.min(parsed, max)
}

export function parseNotificationsLimit(value: string | null): number {
  const parsed = parsePositiveInteger(value, 20, 50)
  return parsed < 1 ? 20 : parsed
}

export function parseNotificationsOffset(value: string | null): number {
  return parsePositiveInteger(value, 0, 10_000)
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApplicationError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }

  console.error("[notifications/api] Unhandled error:", error)
  return NextResponse.json({ error: "Internal server error" }, { status: 500 })
}
