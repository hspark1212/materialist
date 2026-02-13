import { describe, expect, it } from "vitest"

import { normalizeSearchQuery, normalizeTag } from "../query-normalization"

describe("normalizeSearchQuery", () => {
  it("returns undefined for null and undefined", () => {
    expect(normalizeSearchQuery(null)).toBeUndefined()
    expect(normalizeSearchQuery(undefined)).toBeUndefined()
  })

  it("returns undefined for empty string and whitespace-only", () => {
    expect(normalizeSearchQuery("")).toBeUndefined()
    expect(normalizeSearchQuery("   ")).toBeUndefined()
    expect(normalizeSearchQuery("\t\n")).toBeUndefined()
  })

  it("returns undefined for single-character input (min 2 chars)", () => {
    expect(normalizeSearchQuery("a")).toBeUndefined()
    expect(normalizeSearchQuery(" x ")).toBeUndefined()
  })

  it("trims and collapses internal whitespace", () => {
    expect(normalizeSearchQuery("  machine    learning   ")).toBe("machine learning")
  })

  it("preserves valid 2-character input", () => {
    expect(normalizeSearchQuery("ab")).toBe("ab")
  })

  it("truncates to 120 characters", () => {
    const long = "a".repeat(200)
    const result = normalizeSearchQuery(long)
    expect(result).toHaveLength(120)
    expect(result).toBe("a".repeat(120))
  })
})

describe("normalizeTag", () => {
  it("returns undefined for null and undefined", () => {
    expect(normalizeTag(null)).toBeUndefined()
    expect(normalizeTag(undefined)).toBeUndefined()
  })

  it("returns undefined for empty string and whitespace-only", () => {
    expect(normalizeTag("")).toBeUndefined()
    expect(normalizeTag("   ")).toBeUndefined()
  })

  it("keeps single-character tags (no min length)", () => {
    expect(normalizeTag("a")).toBe("a")
  })

  it("trims and collapses internal whitespace", () => {
    expect(normalizeTag("  DFT   Calculations  ")).toBe("DFT Calculations")
  })

  it("truncates to 60 characters", () => {
    const long = "t".repeat(100)
    const result = normalizeTag(long)
    expect(result).toHaveLength(60)
    expect(result).toBe("t".repeat(60))
  })
})
