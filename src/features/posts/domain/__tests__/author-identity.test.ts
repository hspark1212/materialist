import { describe, expect, it } from "vitest"

import type { User } from "@/lib"

import { resolveAuthorIdentity } from "../mappers"

const testUser: User = {
  id: "user-123",
  username: "jdoe",
  displayName: "Jane Doe",
  generatedDisplayName: "CryptoChemist42",
  avatar: "https://example.com/avatar.jpg",
  email: "jane@example.com",
  isAnonymous: false,
  isBot: false,
  institution: "MIT",
  karma: 150,
  joinDate: "2025-01-01T00:00:00Z",
  bio: "Researcher in materials science",
  position: "Postdoc",
  department: "Chemistry",
  country: "US",
  websiteUrl: "https://janedoe.com",
  researchInterests: ["catalysis", "polymers"],
  orcidId: "0000-0001-2345-6789",
  orcidName: "Jane Doe",
  orcidVerifiedAt: "2025-06-01T00:00:00Z",
}

describe("resolveAuthorIdentity", () => {
  it("returns user unchanged when content is not anonymous", () => {
    const result = resolveAuthorIdentity(testUser, false)
    expect(result).toBe(testUser)
  })

  it("strips all PII fields for anonymous content", () => {
    const result = resolveAuthorIdentity(testUser, true)

    expect(result.id).toBe("anonymous")
    expect(result.username).toBe("anonymous")
    expect(result.avatar).toBe("")
    expect(result.isAnonymous).toBe(true)
    expect(result.karma).toBe(0)
    expect(result.joinDate).toBe("")
    expect(result.isBot).toBe(false)
  })

  it("uses generatedDisplayName as displayName for anonymous content", () => {
    const result = resolveAuthorIdentity(testUser, true)

    expect(result.displayName).toBe("CryptoChemist42")
    expect(result.generatedDisplayName).toBe("CryptoChemist42")
  })

  it("falls back to 'Anonymous' when generatedDisplayName is missing", () => {
    const userWithoutGenName: User = { ...testUser, generatedDisplayName: undefined }
    const result = resolveAuthorIdentity(userWithoutGenName, true)

    expect(result.displayName).toBe("Anonymous")
    expect(result.generatedDisplayName).toBe("Anonymous")
  })

  it("does not leak email for anonymous content", () => {
    const result = resolveAuthorIdentity(testUser, true)
    expect(result.email).toBeUndefined()
  })

  it("does not leak institution for anonymous content", () => {
    const result = resolveAuthorIdentity(testUser, true)
    expect(result.institution).toBeUndefined()
  })

  it("does not leak bio for anonymous content", () => {
    const result = resolveAuthorIdentity(testUser, true)
    expect(result.bio).toBeUndefined()
  })

  it("does not leak position/department/country for anonymous content", () => {
    const result = resolveAuthorIdentity(testUser, true)
    expect(result.position).toBeUndefined()
    expect(result.department).toBeUndefined()
    expect(result.country).toBeUndefined()
  })

  it("does not leak websiteUrl for anonymous content", () => {
    const result = resolveAuthorIdentity(testUser, true)
    expect(result.websiteUrl).toBeUndefined()
  })

  it("does not leak ORCID fields for anonymous content", () => {
    const result = resolveAuthorIdentity(testUser, true)
    expect(result.orcidId).toBeUndefined()
    expect(result.orcidName).toBeUndefined()
    expect(result.orcidVerifiedAt).toBeUndefined()
  })

  it("returns only allowlisted fields (no extra properties)", () => {
    const result = resolveAuthorIdentity(testUser, true)
    const keys = Object.keys(result).sort()

    expect(keys).toEqual([
      "avatar",
      "displayName",
      "generatedDisplayName",
      "id",
      "isAnonymous",
      "isBot",
      "joinDate",
      "karma",
      "researchInterests",
      "username",
    ])
  })
})
