import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

import { generateBotReply, isGeminiConfigured, resetGeminiClient } from "../client"

vi.mock("@google/generative-ai", () => {
  class MockGoogleGenerativeAI {
    constructor() {}
    getGenerativeModel() {
      return {
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => "This is a test bot response.",
            usageMetadata: {
              promptTokenCount: 100,
              candidatesTokenCount: 50,
              totalTokenCount: 150,
            },
          },
        }),
      }
    }
  }

  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
    HarmCategory: {
      HARM_CATEGORY_HARASSMENT: "HARM_CATEGORY_HARASSMENT",
      HARM_CATEGORY_HATE_SPEECH: "HARM_CATEGORY_HATE_SPEECH",
      HARM_CATEGORY_SEXUALLY_EXPLICIT: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      HARM_CATEGORY_DANGEROUS_CONTENT: "HARM_CATEGORY_DANGEROUS_CONTENT",
    },
    HarmBlockThreshold: {
      BLOCK_MEDIUM_AND_ABOVE: "BLOCK_MEDIUM_AND_ABOVE",
      BLOCK_ONLY_HIGH: "BLOCK_ONLY_HIGH",
    },
  }
})

describe("generateBotReply", () => {
  const originalEnv = process.env

  beforeEach(() => {
    resetGeminiClient()
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-api-key" }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("generates a response for materialist bot", async () => {
    const result = await generateBotReply({
      botKey: "materialist",
      promptContext: {
        targetType: "comment",
        targetId: "test-comment-id",
        postId: "test-post-id",
        mentionContent: "@materialist-bot can you help me?",
      },
    })

    expect(result.text).toBe("This is a test bot response.")
    expect(result.usageMetadata).toBeDefined()
    expect(result.usageMetadata?.promptTokenCount).toBe(100)
  })

  it("generates a response with post title context", async () => {
    const result = await generateBotReply({
      botKey: "mendeleev",
      promptContext: {
        targetType: "comment",
        targetId: "test-comment-id",
        postId: "test-post-id",
        mentionContent: "@mendeleev-bot what do you think?",
        postTitle: "New ML paper on materials discovery",
      },
    })

    expect(result.text).toBe("This is a test bot response.")
  })

  it("generates a response with author username", async () => {
    const result = await generateBotReply({
      botKey: "faraday",
      promptContext: {
        targetType: "comment",
        targetId: "test-comment-id",
        postId: "test-post-id",
        mentionContent: "@faraday-bot any career advice?",
        authorUsername: "researcher123",
      },
    })

    expect(result.text).toBe("This is a test bot response.")
  })

  it("works with all bot personas", async () => {
    const personas = ["materialist", "mendeleev", "faraday", "pauling", "curie"] as const

    for (const botKey of personas) {
      const result = await generateBotReply({
        botKey,
        promptContext: {
          targetType: "comment",
          targetId: "test-id",
          postId: "test-post-id",
          mentionContent: `@${botKey}-bot hello`,
        },
      })

      expect(result.text).toBe("This is a test bot response.")
    }
  })
})

describe("isGeminiConfigured", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("returns true when GEMINI_API_KEY is set", () => {
    process.env.GEMINI_API_KEY = "test-api-key"
    expect(isGeminiConfigured()).toBe(true)
  })

  it("returns false when GEMINI_API_KEY is not set", () => {
    delete process.env.GEMINI_API_KEY
    expect(isGeminiConfigured()).toBe(false)
  })
})
