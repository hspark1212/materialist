import { describe, expect, it, vi } from "vitest"

import { createCommentUseCase } from "../use-cases"
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
  }
}

describe("createCommentUseCase", () => {
  it("creates root comment at depth 0", async () => {
    const repository = makeRepository()

    vi.mocked(repository.createComment).mockResolvedValue({
      id: "c1",
      content: "hello",
      author_id: "user-1",
      post_id: "post-1",
      parent_comment_id: null,
      depth: 0,
      is_anonymous: false,
      vote_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        id: "user-1",
        username: "u1",
        display_name: "User 1",
        generated_display_name: null,
        avatar_url: null,
        email: null,
        institution: null,
        bio: null,
        karma: 0,
        is_anonymous: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        position: null,
        department: null,
        country: null,
        website_url: null,
        research_interests: [],
        orcid_id: null,
        orcid_name: null,
        orcid_verified_at: null,
      },
    })

    await createCommentUseCase(repository, "user-1", {
      postId: "post-1",
      content: "hello",
      isAnonymous: false,
    })

    expect(repository.createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 0,
        parent_comment_id: null,
      }),
    )
  })

  it("sets reply depth from parent + 1", async () => {
    const repository = makeRepository()

    vi.mocked(repository.getCommentById).mockResolvedValue({
      id: "parent",
      content: "parent",
      author_id: "user-2",
      post_id: "post-1",
      parent_comment_id: null,
      depth: 2,
      is_anonymous: false,
      vote_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: null,
    })

    vi.mocked(repository.createComment).mockResolvedValue({
      id: "c2",
      content: "reply",
      author_id: "user-1",
      post_id: "post-1",
      parent_comment_id: "parent",
      depth: 3,
      is_anonymous: false,
      vote_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: null,
    })

    await createCommentUseCase(repository, "user-1", {
      postId: "post-1",
      content: "reply",
      parentCommentId: "parent",
      isAnonymous: false,
    })

    expect(repository.createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        depth: 3,
        parent_comment_id: "parent",
      }),
    )
  })

  it("rejects parent from a different post", async () => {
    const repository = makeRepository()

    vi.mocked(repository.getCommentById).mockResolvedValue({
      id: "parent",
      content: "parent",
      author_id: "user-2",
      post_id: "post-2",
      parent_comment_id: null,
      depth: 2,
      is_anonymous: false,
      vote_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: null,
    })

    await expect(
      createCommentUseCase(repository, "user-1", {
        postId: "post-1",
        content: "reply",
        parentCommentId: "parent",
        isAnonymous: false,
      }),
    ).rejects.toThrowError("Parent comment does not belong to this post")
  })
})
