import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AiClient, BotReplyRepository } from "../ports"
import { createBotReplyUseCase } from "../use-cases"

vi.mock("@/lib/bots", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/bots")>()
  return {
    ...actual,
    getBotForSection: () => ({
      key: "mendeleev",
      username: "mendeleev-bot",
      displayName: "Mendeleev Bot",
      email: "mendeleev-bot@materialist.local",
      bio: "Paper reviewer",
      color: "#3b82f6",
      envKey: "BOT_USER_ID_MENDELEEV",
      section: "papers",
      shortLabel: "Paper reviewer",
    }),
  }
})

// Set the env var for the bot user ID
vi.stubEnv("BOT_USER_ID_MENDELEEV", "bot-user-id-123")

function createMockRepository(overrides: Partial<BotReplyRepository> = {}): BotReplyRepository {
  return {
    getPostContext: vi.fn().mockResolvedValue({
      title: "Test Post",
      content: "Test content about materials science",
      section: "papers",
    }),
    getCommentWithParentChain: vi.fn().mockResolvedValue({
      comment: {
        id: "comment-1",
        content: "@mendeleev-bot what do you think?",
        authorId: "user-1",
        authorName: "TestUser",
        parentCommentId: null,
        depth: 0,
      },
      parentChain: [],
    }),
    getRecentBotReplyCount: vi.fn().mockResolvedValue(0),
    createBotComment: vi.fn().mockResolvedValue({ id: "bot-comment-1" }),
    ...overrides,
  }
}

function createMockAiClient(overrides: Partial<AiClient> = {}): AiClient {
  return {
    generateReply: vi.fn().mockResolvedValue("This is an interesting approach to materials simulation."),
    ...overrides,
  }
}

const defaultInput = {
  postId: "post-1",
  commentId: "comment-1",
  userId: "user-1",
}

describe("createBotReplyUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a bot reply successfully", async () => {
    const repo = createMockRepository()
    const ai = createMockAiClient()

    const result = await createBotReplyUseCase(repo, ai, defaultInput)

    expect(result).toEqual({ commentId: "bot-comment-1" })
    expect(repo.createBotComment).toHaveBeenCalledWith({
      content: "This is an interesting approach to materials simulation.",
      authorId: "bot-user-id-123",
      postId: "post-1",
      parentCommentId: "comment-1",
      depth: 1,
    })
  })

  it("throws 404 when post not found", async () => {
    const repo = createMockRepository({ getPostContext: vi.fn().mockResolvedValue(null) })
    const ai = createMockAiClient()

    await expect(createBotReplyUseCase(repo, ai, defaultInput)).rejects.toThrow("Post not found")
  })

  it("throws 404 when comment not found", async () => {
    const repo = createMockRepository({ getCommentWithParentChain: vi.fn().mockResolvedValue(null) })
    const ai = createMockAiClient()

    await expect(createBotReplyUseCase(repo, ai, defaultInput)).rejects.toThrow("Comment not found")
  })

  it("throws 403 when comment belongs to another user", async () => {
    const repo = createMockRepository({
      getCommentWithParentChain: vi.fn().mockResolvedValue({
        comment: {
          id: "comment-1",
          content: "@mendeleev-bot what do you think?",
          authorId: "other-user",
          authorName: "OtherUser",
          parentCommentId: null,
          depth: 0,
        },
        parentChain: [],
      }),
    })
    const ai = createMockAiClient()

    await expect(createBotReplyUseCase(repo, ai, defaultInput)).rejects.toThrow(
      "You can only trigger bot replies on your own comments",
    )
  })

  it("throws 400 when comment does not contain mention", async () => {
    const repo = createMockRepository({
      getCommentWithParentChain: vi.fn().mockResolvedValue({
        comment: {
          id: "comment-1",
          content: "No mention here",
          authorId: "user-1",
          authorName: "TestUser",
          parentCommentId: null,
          depth: 0,
        },
        parentChain: [],
      }),
    })
    const ai = createMockAiClient()

    await expect(createBotReplyUseCase(repo, ai, defaultInput)).rejects.toThrow(
      "Comment does not mention @mendeleev-bot",
    )
  })

  it("throws 400 when wrong bot is mentioned for the section", async () => {
    const repo = createMockRepository({
      getCommentWithParentChain: vi.fn().mockResolvedValue({
        comment: {
          id: "comment-1",
          content: "@pauling-bot what do you think?",
          authorId: "user-1",
          authorName: "TestUser",
          parentCommentId: null,
          depth: 0,
        },
        parentChain: [],
      }),
    })
    const ai = createMockAiClient()

    await expect(createBotReplyUseCase(repo, ai, defaultInput)).rejects.toThrow(
      "Wrong bot for this section. Use @mendeleev-bot",
    )
  })

  it("throws 400 when max depth exceeded", async () => {
    const repo = createMockRepository({
      getCommentWithParentChain: vi.fn().mockResolvedValue({
        comment: {
          id: "comment-1",
          content: "@mendeleev-bot thoughts?",
          authorId: "user-1",
          authorName: "TestUser",
          parentCommentId: "parent-1",
          depth: 6,
        },
        parentChain: [],
      }),
    })
    const ai = createMockAiClient()

    await expect(createBotReplyUseCase(repo, ai, defaultInput)).rejects.toThrow("Maximum comment depth exceeded")
  })

  it("throws 429 when rate limited", async () => {
    const repo = createMockRepository({ getRecentBotReplyCount: vi.fn().mockResolvedValue(1) })
    const ai = createMockAiClient()

    await expect(createBotReplyUseCase(repo, ai, defaultInput)).rejects.toThrow(
      "Please wait before mentioning the bot again",
    )
  })

  it("passes parent chain to prompt builder", async () => {
    const parentChain = [
      {
        id: "parent-1",
        content: "Original comment",
        authorId: "other-user",
        authorName: "User1",
        parentCommentId: null,
        depth: 0,
      },
    ]
    const repo = createMockRepository({
      getCommentWithParentChain: vi.fn().mockResolvedValue({
        comment: {
          id: "comment-1",
          content: "@mendeleev-bot what do you think about this?",
          authorId: "user-1",
          authorName: "User2",
          parentCommentId: "parent-1",
          depth: 1,
        },
        parentChain,
      }),
    })
    const ai = createMockAiClient()

    await createBotReplyUseCase(repo, ai, defaultInput)

    expect(ai.generateReply).toHaveBeenCalledWith(expect.any(String), expect.stringContaining("Original comment"))
    expect(repo.createBotComment).toHaveBeenCalledWith(
      expect.objectContaining({ depth: 2, parentCommentId: "comment-1" }),
    )
  })
})
