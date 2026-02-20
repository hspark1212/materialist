import { describe, expect, it } from "vitest"

import { validateFeedbackBody } from "../route"

describe("validateFeedbackBody", () => {
  it("rejects null", () => {
    expect(validateFeedbackBody(null)).toEqual({ error: "Invalid JSON" })
  })

  it("rejects array", () => {
    expect(validateFeedbackBody([])).toEqual({ error: "Invalid JSON" })
  })

  it("rejects string", () => {
    expect(validateFeedbackBody("string")).toEqual({ error: "Invalid JSON" })
  })

  it("rejects content shorter than 10 characters", () => {
    const result = validateFeedbackBody({ content: "short" })
    expect(result).toEqual({ error: "Feedback must be at least 8 characters." })
  })

  it("rejects content longer than 2000 characters", () => {
    const result = validateFeedbackBody({ content: "a".repeat(2001) })
    expect(result).toEqual({ error: "Feedback must be at most 2000 characters." })
  })

  it("returns trimmed content on valid input", () => {
    const result = validateFeedbackBody({ content: "  valid feedback text  " })
    expect(result).toEqual({ content: "valid feedback text" })
  })

  it("passes through website field (honeypot)", () => {
    const result = validateFeedbackBody({ content: "valid feedback text", website: "spam" })
    expect(result).toEqual({ content: "valid feedback text", website: "spam" })
  })

  it("rejects missing content field", () => {
    expect(validateFeedbackBody({})).toEqual({ error: "Feedback must be at least 8 characters." })
  })
})
