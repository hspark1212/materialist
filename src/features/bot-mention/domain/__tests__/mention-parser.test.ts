import { describe, expect, it } from "vitest"

import { parseMentionBot } from "../mention-parser"

describe("parseMentionBot", () => {
  it("detects @mendeleev-bot at start of text", () => {
    const result = parseMentionBot("@mendeleev-bot what do you think?")
    expect(result).toEqual({ found: true, index: 0, username: "mendeleev-bot" })
  })

  it("detects @pauling-bot in the middle of text", () => {
    const result = parseMentionBot("Hey @pauling-bot can you review this?")
    expect(result).toEqual({ found: true, index: 4, username: "pauling-bot" })
  })

  it("detects @curie-bot at end of text", () => {
    const result = parseMentionBot("What do you think @curie-bot")
    expect(result).toEqual({ found: true, index: 18, username: "curie-bot" })
  })

  it("detects @faraday-bot followed by punctuation", () => {
    expect(parseMentionBot("What do you think, @faraday-bot?")).toEqual({
      found: true,
      index: 19,
      username: "faraday-bot",
    })
    expect(parseMentionBot("Hey @mendeleev-bot, review this")).toEqual({
      found: true,
      index: 4,
      username: "mendeleev-bot",
    })
    expect(parseMentionBot("@pauling-bot!")).toEqual({ found: true, index: 0, username: "pauling-bot" })
  })

  it("detects each of the 4 section bots", () => {
    expect(parseMentionBot("@mendeleev-bot hi").username).toBe("mendeleev-bot")
    expect(parseMentionBot("@pauling-bot hi").username).toBe("pauling-bot")
    expect(parseMentionBot("@curie-bot hi").username).toBe("curie-bot")
    expect(parseMentionBot("@faraday-bot hi").username).toBe("faraday-bot")
  })

  it("does not detect @materialist (removed bot)", () => {
    const result = parseMentionBot("Hey @materialist what do you think?")
    expect(result).toEqual({ found: false, index: -1, username: null })
  })

  it("does not detect partial like @mendeleev", () => {
    const result = parseMentionBot("Hey @mendeleev")
    expect(result).toEqual({ found: false, index: -1, username: null })
  })

  it("does not detect @mendeleev-bot123", () => {
    const result = parseMentionBot("Hey @mendeleev-bot123")
    expect(result).toEqual({ found: false, index: -1, username: null })
  })

  it("returns not found for text without mention", () => {
    const result = parseMentionBot("No mention here")
    expect(result).toEqual({ found: false, index: -1, username: null })
  })

  it("returns not found for empty text", () => {
    const result = parseMentionBot("")
    expect(result).toEqual({ found: false, index: -1, username: null })
  })
})
