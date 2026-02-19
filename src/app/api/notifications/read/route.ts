import { NextRequest, NextResponse } from "next/server"

import { markAsReadUseCase } from "@/features/notifications/application/use-cases"
import { handleApiError } from "@/features/notifications/api/http"
import { createSupabaseNotificationsRepository } from "@/features/notifications/infrastructure/supabase-notifications-repository"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const repository = createSupabaseNotificationsRepository(supabase)

    if (body.all === true) {
      const updated = await markAsReadUseCase(repository, user.id, "all")
      return NextResponse.json({ updated })
    }

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const ids = body.ids.filter((id: unknown) => typeof id === "string").slice(0, 100)
      if (ids.length === 0) {
        return NextResponse.json({ error: "Provide { ids: [...] } or { all: true }" }, { status: 400 })
      }
      const updated = await markAsReadUseCase(repository, user.id, ids)
      return NextResponse.json({ updated })
    }

    return NextResponse.json({ error: "Provide { ids: [...] } or { all: true }" }, { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}
