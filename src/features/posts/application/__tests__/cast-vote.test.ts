import { describe, expect, it, vi } from "vitest"

import { castVoteUseCase } from "../use-cases"
import type { PostsRepository } from "../ports"

function makeRepository(): PostsRepository {
  return {
    listPosts: vi.fn(),
    getPostById: vi.fn(),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
    listCommentsByPostId: vi.fn(),
    getCommentById: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
    targetExists: vi.fn(),
    getVoteDirection: vi.fn(),
    insertVote: vi.fn(),
    updateVoteDirection: vi.fn(),
    deleteVote: vi.fn(),
    getTargetVoteCount: vi.fn(),
    listVotedPosts: vi.fn(),
  }
}

describe("castVoteUseCase", () => {
  it("inserts new vote when no existing vote (anonymous)", async () => {
    const repository = makeRepository()
    vi.mocked(repository.targetExists).mockResolvedValue(true)
    vi.mocked(repository.getVoteDirection).mockResolvedValue(0)
    vi.mocked(repository.getTargetVoteCount).mockResolvedValue(10)

    const result = await castVoteUseCase(repository, "user-1", {
      targetType: "post",
      targetId: "post-1",
      direction: 1,
      isAnonymous: true,
    })

    expect(repository.getVoteDirection).toHaveBeenCalledWith("user-1", "post", "post-1", true)
    expect(repository.insertVote).toHaveBeenCalledWith("user-1", "post", "post-1", 1, true)
    expect(result.userVote).toBe(1)
    expect(result.voteCount).toBe(10)
  })

  it("inserts new vote when no existing vote (verified)", async () => {
    const repository = makeRepository()
    vi.mocked(repository.targetExists).mockResolvedValue(true)
    vi.mocked(repository.getVoteDirection).mockResolvedValue(0)
    vi.mocked(repository.getTargetVoteCount).mockResolvedValue(10)

    const result = await castVoteUseCase(repository, "user-1", {
      targetType: "post",
      targetId: "post-1",
      direction: 1,
      isAnonymous: false,
    })

    expect(repository.getVoteDirection).toHaveBeenCalledWith("user-1", "post", "post-1", false)
    expect(repository.insertVote).toHaveBeenCalledWith("user-1", "post", "post-1", 1, false)
    expect(result.userVote).toBe(1)
    expect(result.voteCount).toBe(10)
  })

  it("deletes vote on repeated click", async () => {
    const repository = makeRepository()
    vi.mocked(repository.targetExists).mockResolvedValue(true)
    vi.mocked(repository.getVoteDirection).mockResolvedValue(1)
    vi.mocked(repository.getTargetVoteCount).mockResolvedValue(9)

    const result = await castVoteUseCase(repository, "user-1", {
      targetType: "post",
      targetId: "post-1",
      direction: 1,
      isAnonymous: true,
    })

    expect(repository.deleteVote).toHaveBeenCalledWith("user-1", "post", "post-1", true)
    expect(result.userVote).toBe(0)
  })

  it("updates vote when direction changes", async () => {
    const repository = makeRepository()
    vi.mocked(repository.targetExists).mockResolvedValue(true)
    vi.mocked(repository.getVoteDirection).mockResolvedValue(1)
    vi.mocked(repository.getTargetVoteCount).mockResolvedValue(8)

    const result = await castVoteUseCase(repository, "user-1", {
      targetType: "comment",
      targetId: "comment-1",
      direction: -1,
      isAnonymous: false,
    })

    expect(repository.updateVoteDirection).toHaveBeenCalledWith("user-1", "comment", "comment-1", -1, false)
    expect(result.userVote).toBe(-1)
  })

  it("votes in different identity modes are independent", async () => {
    const repository = makeRepository()
    vi.mocked(repository.targetExists).mockResolvedValue(true)
    vi.mocked(repository.getTargetVoteCount).mockResolvedValue(2)

    // Anonymous vote: no existing → insert
    vi.mocked(repository.getVoteDirection).mockResolvedValue(0)
    const anonResult = await castVoteUseCase(repository, "user-1", {
      targetType: "post",
      targetId: "post-1",
      direction: 1,
      isAnonymous: true,
    })

    expect(repository.getVoteDirection).toHaveBeenCalledWith("user-1", "post", "post-1", true)
    expect(repository.insertVote).toHaveBeenCalledWith("user-1", "post", "post-1", 1, true)
    expect(anonResult.userVote).toBe(1)

    // Verified vote: no existing → insert (independent from anonymous)
    vi.mocked(repository.getVoteDirection).mockResolvedValue(0)
    const verifiedResult = await castVoteUseCase(repository, "user-1", {
      targetType: "post",
      targetId: "post-1",
      direction: 1,
      isAnonymous: false,
    })

    expect(repository.getVoteDirection).toHaveBeenCalledWith("user-1", "post", "post-1", false)
    expect(repository.insertVote).toHaveBeenCalledWith("user-1", "post", "post-1", 1, false)
    expect(verifiedResult.userVote).toBe(1)
  })
})
