import { type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * CRITICAL: Only /auth/* needs server-side middleware for OAuth callback
     * All other routes use client-side auth (AuthProvider) to reduce CPU usage
     * and prevent Error 1102 on Cloudflare Workers
     */
    "/auth/:path*",
  ],
}
