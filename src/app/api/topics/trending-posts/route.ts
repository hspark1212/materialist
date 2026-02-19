import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export const revalidate = 300

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parsePositiveInt(searchParams.get("limit"), 3, 50)
    const daysBack = parsePositiveInt(searchParams.get("days"), 30, 365)

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysBack)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, section, vote_count, content")
      .gte("created_at", cutoffDate.toISOString())
      .order("vote_count", { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ posts: data ?? [] })
  } catch (error) {
    console.error("[API] Failed to fetch trending posts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
