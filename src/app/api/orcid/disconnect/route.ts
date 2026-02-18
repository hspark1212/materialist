import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch current profile to get generated_display_name for fallback
  const { data: profile } = await supabase
    .from("profiles")
    .select("generated_display_name, display_name")
    .eq("id", user.id)
    .single()

  const admin = createAdminClient()
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      orcid_id: null,
      orcid_name: null,
      orcid_verified_at: null,
      display_name: profile?.generated_display_name ?? profile?.display_name,
      is_anonymous: true,
    })
    .eq("id", user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
