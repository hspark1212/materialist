import { NextResponse } from "next/server"

import { ApplicationError } from "@/lib/errors"

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
