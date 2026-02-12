import { describe, it, expect } from "vitest"
import { profileToUser } from "../utils"
import type { Profile } from "../types"

const baseProfile: Profile = {
  id: "user-1",
  username: "test_user",
  display_name: "Test User",
  avatar_url: "https://example.com/avatar.png",
  email: "test@example.com",
  institution: "MIT",
  bio: "A researcher",
  karma: 100,
  is_anonymous: false,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  position: "Postdoc",
  department: "Chemistry",
  country: "US",
  website_url: "https://example.com",
  research_interests: ["ML", "DFT"],
  generated_display_name: null,
  orcid_id: null,
  orcid_name: null,
  orcid_verified_at: null,
}

describe("profileToUser", () => {
  it("converts a Profile to a User", () => {
    const user = profileToUser(baseProfile)

    expect(user.id).toBe("user-1")
    expect(user.username).toBe("test_user")
    expect(user.displayName).toBe("Test User")
    expect(user.avatar).toBe("https://example.com/avatar.png")
    expect(user.email).toBe("test@example.com")
    expect(user.isAnonymous).toBe(false)
    expect(user.institution).toBe("MIT")
    expect(user.karma).toBe(100)
    expect(user.bio).toBe("A researcher")
    expect(user.position).toBe("Postdoc")
    expect(user.department).toBe("Chemistry")
    expect(user.country).toBe("US")
    expect(user.websiteUrl).toBe("https://example.com")
    expect(user.researchInterests).toEqual(["ML", "DFT"])
  })

  it("handles null optional fields with fallback defaults", () => {
    const minimal: Profile = {
      ...baseProfile,
      email: null,
      institution: null,
      bio: null,
      position: null,
      department: null,
      country: null,
      website_url: null,
    }

    const user = profileToUser(minimal)
    expect(user.email).toBeUndefined()
    expect(user.institution).toBeUndefined()
    expect(user.bio).toBeUndefined()
    expect(user.position).toBeUndefined()
    expect(user.department).toBeUndefined()
    expect(user.country).toBeUndefined()
    expect(user.websiteUrl).toBeUndefined()
  })
})
