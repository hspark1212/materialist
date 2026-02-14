import { describe, it, expect } from "vitest"
import { isGdprCountry } from "../geo"

describe("isGdprCountry", () => {
  it("returns true for EU countries", () => {
    const euCountries = ["DE", "FR", "IT", "ES", "NL", "PL", "SE", "BE", "AT", "IE"]
    for (const code of euCountries) {
      expect(isGdprCountry(code)).toBe(true)
    }
  })

  it("returns true for EEA countries (non-EU)", () => {
    expect(isGdprCountry("IS")).toBe(true) // Iceland
    expect(isGdprCountry("LI")).toBe(true) // Liechtenstein
    expect(isGdprCountry("NO")).toBe(true) // Norway
  })

  it("returns true for UK and Switzerland", () => {
    expect(isGdprCountry("GB")).toBe(true)
    expect(isGdprCountry("CH")).toBe(true)
  })

  it("returns false for non-GDPR countries", () => {
    expect(isGdprCountry("US")).toBe(false)
    expect(isGdprCountry("KR")).toBe(false)
    expect(isGdprCountry("JP")).toBe(false)
    expect(isGdprCountry("CN")).toBe(false)
    expect(isGdprCountry("BR")).toBe(false)
    expect(isGdprCountry("AU")).toBe(false)
  })

  it("returns true for null (unknown country — safe default)", () => {
    expect(isGdprCountry(null)).toBe(true)
  })

  it("is case-insensitive", () => {
    expect(isGdprCountry("de")).toBe(true)
    expect(isGdprCountry("De")).toBe(true)
    expect(isGdprCountry("us")).toBe(false)
  })
})
