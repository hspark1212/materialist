import { describe, expect, it } from "vitest"

import { parseSearchQuery, parseTag } from "../http"

describe("parseSearchQuery", () => {
  it("returns undefined for null, blank, and short queries", () => {
    expect(parseSearchQuery(null)).toBeUndefined()
    expect(parseSearchQuery("   ")).toBeUndefined()
    expect(parseSearchQuery("a")).toBeUndefined()
  })

  it("normalizes whitespace and preserves meaningful content", () => {
    expect(parseSearchQuery("  machine    learning   force fields  ")).toBe("machine learning force fields")
  })

  it("caps query length to 120 characters", () => {
    const longQuery = "x".repeat(200)
    expect(parseSearchQuery(longQuery)).toHaveLength(120)
  })
})

describe("parseTag", () => {
  it("returns undefined for null", () => {
    expect(parseTag(null)).toBeUndefined()
  })

  it("returns undefined for whitespace-only", () => {
    expect(parseTag("   ")).toBeUndefined()
  })

  it("normalizes a valid tag", () => {
    expect(parseTag("  DFT  ")).toBe("DFT")
  })

  it("caps tag length to 60 characters", () => {
    const longTag = "z".repeat(100)
    expect(parseTag(longTag)).toHaveLength(60)
  })
})
