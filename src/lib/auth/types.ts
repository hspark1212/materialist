import type { User } from "@/lib/types"

export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url: string
  email: string | null
  institution: string | null
  bio: string | null
  karma: number
  is_anonymous: boolean
  created_at: string
  updated_at: string
  position: string | null
  department: string | null
  country: string | null
  website_url: string | null
  research_interests: string[]
  generated_display_name: string | null
  orcid_id: string | null
  orcid_name: string | null
  orcid_verified_at: string | null
}

export type AuthStatus = "loading" | "anonymous" | "authenticated" | "verified"

export interface AuthContextValue {
  status: AuthStatus
  profile: Profile | null
  user: User | null
  isNavigating: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>
  signInWithOAuth: (provider: "google" | "github", returnTo?: string) => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<{ error?: string }>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}
