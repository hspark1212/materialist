import { NextResponse } from "next/server"

import { getUnreadCountUseCase } from "@/features/notifications/application/use-cases"
import { handleApiError } from "@/features/notifications/api/http"
import { createSupabaseNotificationsRepository } from "@/features/notifications/infrastructure/supabase-notifications-repository"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Return 0 for unauthenticated users (no error, lightweight for polling)
    if (authError || !user) {
      return NextResponse.json({ count: 0 })
    }

    const repository = createSupabaseNotificationsRepository(supabase)
    const count = await getUnreadCountUseCase(repository, user.id)

    return NextResponse.json({ count }, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
