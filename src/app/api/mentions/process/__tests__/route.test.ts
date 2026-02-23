import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

import { POST } from "../route"

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn((columns: string) => {
        if (columns === "attempt_count") {
          return {
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { attempt_count: 0 },
                  error: null,
                }),
              ),
            })),
          }
        }
        return {
          in: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() =>
                  table === "mention_requests"
                    ? Promise.resolve({
                        data: [
                          {
                            id: "test-request-id",
                            bot_key: "materialist",
                            target_type: "comment",
                            target_id: "test-comment-id",
                            post_id: "test-post-id",
                            prompt_context: {
                              mentionContent: "@materialist-bot hello",
                            },
                          },
                        ],
                        error: null,
                      })
                    : Promise.resolve({ data: { id: "test-comment-id" }, error: null }),
                ),
              })),
            })),
          })),
        }
      }),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      insert: vi.fn(() =>
        Promise.resolve({
          data: { id: "new-comment-id" },
          error: null,
        }),
      ),
    })),
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

vi.mock("@/lib/gemini/client", () => ({
  generateBotReply: vi.fn().mockResolvedValue({
    text: "This is a test bot response.",
    usageMetadata: {
      promptTokenCount: 100,
      candidatesTokenCount: 50,
      totalTokenCount: 150,
    },
  }),
}))

vi.mock("@/lib/bots", () => ({
  BOT_PERSONAS: {
    materialist: {
      key: "materialist",
      username: "materialist-bot",
      displayName: "Materialist Bot",
    },
  },
  getBotUserId: vi.fn(() => "test-bot-user-id"),
}))

vi.mock("@/features/posts/api/http", () => ({
  handleApiError: vi.fn((error) => Response.json({ error: String(error) }, { status: 500 })),
}))

describe("POST /api/mentions/process", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, MENTIONS_PROCESSOR_SECRET: "test-secret-123" }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("returns 401 without authorization header", async () => {
    const request = new NextRequest("http://localhost/api/mentions/process", {
      method: "POST",
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe("Unauthorized")
  })

  it("returns 401 with invalid secret", async () => {
    const request = new NextRequest("http://localhost/api/mentions/process", {
      method: "POST",
      headers: {
        authorization: "Bearer wrong-secret",
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe("Unauthorized")
  })

  it("returns processed count with valid secret", async () => {
    const request = new NextRequest("http://localhost/api/mentions/process", {
      method: "POST",
      headers: {
        authorization: "Bearer test-secret-123",
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.processed).toBeGreaterThanOrEqual(0)
  })

  it("handles empty queue gracefully", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        })),
      })),
      auth: { getUser: vi.fn() },
    }
    vi.mocked(createAdminClient).mockReturnValueOnce(mockClient as unknown as ReturnType<typeof createAdminClient>)

    const request = new NextRequest("http://localhost/api/mentions/process", {
      method: "POST",
      headers: {
        authorization: "Bearer test-secret-123",
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.processed).toBe(0)
    expect(data.message).toBe("No pending requests")
  })
})
