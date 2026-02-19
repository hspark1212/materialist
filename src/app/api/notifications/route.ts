import { NextRequest, NextResponse } from "next/server"

import { listNotificationsUseCase } from "@/features/notifications/application/use-cases"
import { handleApiError, parseNotificationsLimit, parseNotificationsOffset } from "@/features/notifications/api/http"
import { createSupabaseNotificationsRepository } from "@/features/notifications/infrastructure/supabase-notifications-repository"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const limit = parseNotificationsLimit(request.nextUrl.searchParams.get("limit"))
    const offset = parseNotificationsOffset(request.nextUrl.searchParams.get("offset"))

    const repository = createSupabaseNotificationsRepository(supabase)
    const notifications = await listNotificationsUseCase(repository, user.id, limit, offset)

    return NextResponse.json(
      { notifications },
      {
        headers: { "Cache-Control": "private, no-store" },
      },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
