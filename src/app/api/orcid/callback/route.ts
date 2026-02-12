import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")

  // Resolve base URL from the incoming request headers so redirects go back
  // to the same host the user is actually browsing (e.g. 192.0.0.2:3001),
  // not the internal localhost Next.js binds to.
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "http"
  const host = forwardedHost ?? request.headers.get("host") ?? request.nextUrl.host
  const baseUrl = `${forwardedProto}://${host}`

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}?orcid_error=${encodeURIComponent("Missing authorization code")}`,
    )
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

    // 5. Update the user's profile with ORCID info
    const { error: updateError } = await supabase
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
    return NextResponse.redirect(
      `${baseUrl}${redirectPath}?tab=about&orcid_success=true`,
    )
  } catch (error) {
    console.error("Unexpected error during ORCID verification:", error)
    return NextResponse.redirect(
      `${baseUrl}?orcid_error=${encodeURIComponent("An unexpected error occurred. Please try again.")}`,
    )
  }
}
