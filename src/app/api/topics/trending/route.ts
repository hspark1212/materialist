import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { createSupabaseTopicsRepository } from "@/features/topics/infrastructure/supabase-topics-repository"
import { getTrendingTopicsUseCase } from "@/features/topics/application/use-cases"

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
    const limit = parsePositiveInt(searchParams.get("limit"), 8, 20)
    const daysBack = parsePositiveInt(searchParams.get("days"), 7, 365)

    const supabase = await createClient()
    const repository = createSupabaseTopicsRepository(supabase)
    const topics = await getTrendingTopicsUseCase(repository, limit, daysBack)

    return NextResponse.json({ topics })
  } catch (error) {
    console.error("[API] Failed to fetch trending topics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
