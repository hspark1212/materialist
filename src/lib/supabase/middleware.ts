import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Skip Supabase client creation entirely if no auth cookie exists
  const authCookiePattern = /^sb-.*-auth-token/
  const hasAuthCookie = request.cookies.getAll().some((cookie) => authCookiePattern.test(cookie.name))

  if (!hasAuthCookie) {
    // No auth cookie → no API call needed, return immediately
    return supabaseResponse
  }

  // Create Supabase client and refresh session only when auth cookie exists
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  try {
    // Limit timeout to 3 seconds (Cloudflare Workers CPU protection)
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 3000))

    await Promise.race([supabase.auth.getUser(), timeoutPromise])
  } catch (error) {
    // Continue request even if error occurs (client-side AuthProvider handles fallback)
    console.error("Supabase auth check failed in middleware:", error)
  }

  return supabaseResponse
}
