import { NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")

  // Use the configured app URL to prevent host header injection attacks.
  // Fall back to request.nextUrl.origin which is derived from the trusted
  // server-side URL, NOT from user-controlled headers.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}?orcid_error=${encodeURIComponent("Missing authorization code")}`,
    )
  }

  // Validate CSRF state parameter
  const state = searchParams.get("state")
  const cookieState = request.cookies.get("orcid_state")?.value
  if (!state || !cookieState || state !== cookieState) {
    const response = NextResponse.redirect(
      `${baseUrl}?orcid_error=${encodeURIComponent("Invalid state parameter. Please try again.")}`,
    )
    response.cookies.delete("orcid_state")
    return response
  }

  try {
    // 1. Verify the user is logged in
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(
        `${baseUrl}?orcid_error=${encodeURIComponent("You must be logged in to verify ORCID")}`,
      )
    }

    // 2. Exchange authorization code for access token + ORCID iD
    const tokenRes = await fetch("https://orcid.org/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: process.env.ORCID_CLIENT_ID!,
        client_secret: process.env.ORCID_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${baseUrl}/api/orcid/callback`,
      }),
    })

    if (!tokenRes.ok) {
      const text = await tokenRes.text()
      console.error("ORCID token exchange failed:", text)
      return NextResponse.redirect(
        `${baseUrl}?orcid_error=${encodeURIComponent("Failed to verify ORCID. Please try again.")}`,
      )
    }

    const tokenData = (await tokenRes.json()) as {
      orcid: string
      name: string
      access_token: string
    }

    const orcidId = tokenData.orcid
    const orcidName = tokenData.name || null

    // 3. Check if another user already has this ORCID linked
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("orcid_id", orcidId)
      .neq("id", user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.redirect(
        `${baseUrl}?orcid_error=${encodeURIComponent("This ORCID iD is already linked to another account")}`,
      )
    }

    // 4. Fetch the user's profile to get the username for redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single()

    const username = profile?.username

    // 5. Update the user's profile with ORCID info (admin client to bypass field protection trigger)
    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        orcid_id: orcidId,
        orcid_name: orcidName,
        orcid_verified_at: new Date().toISOString(),
        display_name: orcidName,
        is_anonymous: false,
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Failed to update profile with ORCID:", updateError)
      return NextResponse.redirect(
        `${baseUrl}?orcid_error=${encodeURIComponent("Failed to save ORCID info. Please try again.")}`,
      )
    }

    // 6. Redirect to the user's profile About tab with success message
    const redirectPath = username ? `/u/${username}` : "/"
    const response = NextResponse.redirect(
      `${baseUrl}${redirectPath}?tab=about&orcid_success=true`,
    )
    response.cookies.delete("orcid_state")
    return response
  } catch (error) {
    console.error("Unexpected error during ORCID verification:", error)
    return NextResponse.redirect(
      `${baseUrl}?orcid_error=${encodeURIComponent("An unexpected error occurred. Please try again.")}`,
    )
  }
}
