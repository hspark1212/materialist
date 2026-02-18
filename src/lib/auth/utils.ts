import type { Session } from "@supabase/supabase-js"

import type { User } from "@/lib/types"
import type { AuthStatus, Profile } from "./types"

const AUTH_ROUTES = ["/login", "/signup", "/auth"]

/** Validates returnTo is a safe internal path (prevents open redirect). */
export function isValidReturnTo(path: string): boolean {
  if (!path || !path.startsWith("/")) return false
  if (path.startsWith("//")) return false
  if (AUTH_ROUTES.some((r) => path === r || path.startsWith(r + "/")))
    return false
  try {
    decodeURIComponent(path)
  } catch {
    return false
  }
  return true
}

export function profileToUser(profile: Profile): User {
  return {
    id: profile.id,
    username: profile.username ?? `anon_${profile.id.slice(0, 8)}`,
    displayName: profile.display_name ?? "Anonymous Researcher",
    generatedDisplayName: profile.generated_display_name ?? undefined,
    avatar: profile.avatar_url ?? "",
    bio: profile.bio ?? undefined,
    email: profile.email ?? undefined,
    isAnonymous: profile.is_anonymous ?? true,
    isBot: profile.is_bot ?? false,
    karma: profile.karma ?? 0,
    joinDate: profile.created_at ?? new Date().toISOString(),
    orcidId: profile.orcid_id ?? undefined,
    orcidName: profile.orcid_name ?? undefined,
    orcidVerifiedAt: profile.orcid_verified_at ?? undefined,
  }
}

export function deriveStatus(
  session: Session | null,
  profile: Profile | null,
): AuthStatus {
  if (!session) return "anonymous"
  if (profile) return "verified"
  return "authenticated"
}
