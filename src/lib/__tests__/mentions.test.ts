import { describe, expect, it } from "vitest"

import {
  extractMentions,
  extractBotMentions,
  findActiveMentionQuery,
  insertMention,
  getBotSuggestions,
} from "../mentions"

describe("extractMentions", () => {
  it("extracts simple mentions", () => {
    const result = extractMentions("Hello @materialist-bot, how are you?")
    expect(result).toHaveLength(1)
    expect(result[0].username).toBe("materialist-bot")
    expect(result[0].start).toBe(6)
    expect(result[0].end).toBe(22)
  })

  it("extracts multiple mentions", () => {
    const result = extractMentions("@pauling-bot and @curie-bot are both helpful")
    expect(result).toHaveLength(2)
    expect(result[0].username).toBe("pauling-bot")
    expect(result[1].username).toBe("curie-bot")
  })

  it("ignores mentions inside code blocks", () => {
    const result = extractMentions("Check this: `@materialist-bot` code")
    expect(result).toHaveLength(0)
  })

  it("ignores email-like patterns", () => {
    const result = extractMentions("Email me at user@example.com")
    expect(result).toHaveLength(0)
  })

  it("handles punctuation after mentions", () => {
    const result = extractMentions("Hey @materialist-bot!")
    expect(result).toHaveLength(1)
    expect(result[0].username).toBe("materialist-bot")
  })
})

describe("extractBotMentions", () => {
  it("extracts only known bot mentions", () => {
    const result = extractBotMentions("@materialist-bot and @unknown-user")
    expect(result).toHaveLength(1)
    expect(result[0].botKey).toBe("materialist")
  })

  it("deduplicates mentions", () => {
    const result = extractBotMentions("@materialist-bot @materialist-bot")
    expect(result).toHaveLength(1)
  })

  it("caps at maxMentions", () => {
    const result = extractBotMentions("@materialist-bot @mendeleev-bot @faraday-bot @pauling-bot", 2)
    expect(result).toHaveLength(2)
  })

  it("returns empty array for no mentions", () => {
    const result = extractBotMentions("No mentions here")
    expect(result).toHaveLength(0)
  })
})

describe("findActiveMentionQuery", () => {
  it("finds active mention at cursor", () => {
    const text = "Hello @mat"
    const result = findActiveMentionQuery(text, text.length)
    expect(result).not.toBeNull()
    expect(result?.query).toBe("mat")
    expect(result?.startIndex).toBe(6)
  })

  it("returns null when not in mention", () => {
    const result = findActiveMentionQuery("Hello world", 5)
    expect(result).toBeNull()
  })

  it("returns null after space in mention", () => {
    const text = "Hello @materialist bot"
    const result = findActiveMentionQuery(text, text.length)
    expect(result).toBeNull()
  })
})

describe("insertMention", () => {
  it("inserts mention at position", () => {
    const text = "Hello @mat"
    const query = { query: "mat", startIndex: 6, endIndex: 10 }
    const result = insertMention(text, query, "materialist-bot")
    expect(result).toBe("Hello @materialist-bot ")
  })
})

describe("getBotSuggestions", () => {
  it("returns all bots without query", () => {
    const result = getBotSuggestions()
    expect(result.length).toBe(5)
    expect(result.map((b) => b.key)).toContain("materialist")
  })

  it("filters by username", () => {
    const result = getBotSuggestions("mend")
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe("mendeleev")
  })

  it("filters by displayName", () => {
    const result = getBotSuggestions("Mendeleev")
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe("mendeleev")
  })
})
