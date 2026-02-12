import { describe, it, expect } from "vitest"
import { deriveStatus } from "../utils"
import type { Profile } from "../types"
import type { Session } from "@supabase/supabase-js"

const mockSession = { user: { id: "user-1" } } as Session

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "user-1",
  username: "test_user",
  display_name: "Test User",
  avatar_url: "",
  email: null,
  institution: null,
  bio: null,
  karma: 0,
  is_anonymous: false,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  position: null,
  department: null,
  country: null,
  website_url: null,
  research_interests: [],
  generated_display_name: null,
  orcid_id: null,
  orcid_name: null,
  orcid_verified_at: null,
  ...overrides,
})

describe("deriveStatus", () => {
  it("returns 'anonymous' when session is null", () => {
    expect(deriveStatus(null, null)).toBe("anonymous")
  })

  it("returns 'verified' when session exists and profile is loaded", () => {
    const profile = makeProfile()
    expect(deriveStatus(mockSession, profile)).toBe("verified")
  })

  it("returns 'authenticated' when session exists but profile is null", () => {
    expect(deriveStatus(mockSession, null)).toBe("authenticated")
  })
})
