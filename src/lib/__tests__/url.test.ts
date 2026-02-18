import { describe, expect, it } from "vitest"

import { sanitizeUrl } from "../url"

describe("sanitizeUrl", () => {
  it("allows https URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com")
  })

  it("allows http URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com")
  })

  it("allows mailto URLs", () => {
    expect(sanitizeUrl("mailto:test@example.com")).toBe("mailto:test@example.com")
  })

  it("allows relative paths", () => {
    expect(sanitizeUrl("/about")).toBe("/about")
    expect(sanitizeUrl("/u/username")).toBe("/u/username")
  })

  it("blocks javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeUndefined()
  })

  it("blocks JavaScript: with mixed case", () => {
    expect(sanitizeUrl("JavaScript:alert(1)")).toBeUndefined()
  })

  it("blocks JAVASCRIPT: all caps", () => {
    expect(sanitizeUrl("JAVASCRIPT:alert(1)")).toBeUndefined()
  })

  it("blocks data: URLs", () => {
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBeUndefined()
  })

  it("blocks vbscript: URLs", () => {
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBeUndefined()
  })

  it("blocks protocol-relative URLs (//)", () => {
    expect(sanitizeUrl("//evil.com/payload")).toBeUndefined()
  })

  it("returns undefined for empty string", () => {
    expect(sanitizeUrl("")).toBeUndefined()
  })

  it("returns undefined for undefined", () => {
    expect(sanitizeUrl(undefined)).toBeUndefined()
  })

  it("returns undefined for whitespace-only string", () => {
    expect(sanitizeUrl("   ")).toBeUndefined()
  })

  it("trims whitespace from valid URLs", () => {
    expect(sanitizeUrl("  https://example.com  ")).toBe("https://example.com")
  })

  it("blocks javascript: with leading whitespace in scheme", () => {
    // After trim, still a javascript: URL
    expect(sanitizeUrl("  javascript:alert(1)")).toBeUndefined()
  })
})
