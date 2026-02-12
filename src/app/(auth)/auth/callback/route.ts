import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { isValidReturnTo } from "@/lib/auth/utils"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const returnTo = searchParams.get("returnTo")

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth callback failed:', {
      message: error.message,
      status: error.status,
      code: error.code,
    })
    const errorParam = encodeURIComponent(error.message || 'auth_callback_failed')
    return NextResponse.redirect(`${origin}/login?error=${errorParam}`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user && process.env.NODE_ENV === "development") {
    console.log("OAuth user metadata:", user.user_metadata)
  }

  if (user) {
    if (returnTo && isValidReturnTo(returnTo)) {
      return NextResponse.redirect(`${origin}${returnTo}`)
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle()

    if (process.env.NODE_ENV === "development" && profile) {
      console.log("Profile after OAuth:", profile)
    }

    if (profile?.username) {
      return NextResponse.redirect(`${origin}/u/${profile.username}`)
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
