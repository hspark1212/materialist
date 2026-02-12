import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // Log detailed error for debugging in Cloudflare logs
    console.error('OAuth callback failed:', {
      message: error.message,
      status: error.status,
      code: error.code,
    })
    // Pass error details to login page for debugging
    const errorParam = encodeURIComponent(error.message || 'auth_callback_failed')
    return NextResponse.redirect(`${origin}/login?error=${errorParam}`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Debug OAuth metadata in development
  if (user && process.env.NODE_ENV === "development") {
    console.log("OAuth user metadata:", user.user_metadata)
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle()

    // Debug profile data in development
    if (process.env.NODE_ENV === "development" && profile) {
      console.log("Profile after OAuth:", profile)
    }

    if (profile?.username) {
      return NextResponse.redirect(`${origin}/u/${profile.username}`)
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
