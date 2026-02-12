import type { Session } from "@supabase/supabase-js"

import type { User } from "@/lib/types"
import type { AuthStatus, Profile } from "./types"

export function profileToUser(profile: Profile): User {
  return {
    id: profile.id,
    username: profile.username ?? `anon_${profile.id.slice(0, 8)}`,
    displayName: profile.display_name ?? "Anonymous Researcher",
    generatedDisplayName: profile.generated_display_name ?? undefined,
    avatar: profile.avatar_url ?? "",
    email: profile.email ?? undefined,
    isAnonymous: profile.is_anonymous ?? true,
    institution: profile.institution ?? undefined,
    karma: profile.karma ?? 0,
    joinDate: profile.created_at ?? new Date().toISOString(),
    bio: profile.bio ?? undefined,
    position: profile.position ?? undefined,
    department: profile.department ?? undefined,
    country: profile.country ?? undefined,
    websiteUrl: profile.website_url ?? undefined,
    researchInterests: profile.research_interests ?? [],
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
