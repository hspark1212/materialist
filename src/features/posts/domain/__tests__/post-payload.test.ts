import { describe, expect, it } from "vitest"

import { buildCreatePostInsert } from "../post-payload"

describe("buildCreatePostInsert", () => {
  it("maps forum posts without URL to text type", () => {
    const post = buildCreatePostInsert("user-1", {
      title: "Forum question",
      content: "How to converge VASP?",
      section: "forum",
      isAnonymous: false,
      tags: ["vasp"],
    })

    expect(post.type).toBe("text")
  })

  it("maps forum posts with URL to link type", () => {
    const post = buildCreatePostInsert("user-1", {
      title: "Forum link",
      content: "Useful resource",
      section: "forum",
      isAnonymous: false,
      tags: [],
      url: "https://example.com",
    })

    expect(post.type).toBe("link")
  })

  it("maps section-specific types", () => {
    const paper = buildCreatePostInsert("user-1", {
      title: "Paper",
      content: "Paper content",
      section: "papers",
      isAnonymous: false,
      tags: [],
      url: "https://arxiv.org/abs/2602.04219",
    })

    const showcase = buildCreatePostInsert("user-1", {
      title: "Showcase",
      content: "Showcase content",
      section: "showcase",
      isAnonymous: false,
      tags: [],
    })

    const job = buildCreatePostInsert("user-1", {
      title: "Job",
      content: "Job content",
      section: "jobs",
      isAnonymous: false,
      tags: [],
    })

    expect(paper.type).toBe("paper")
    expect(paper.doi).toBeNull()
    expect(paper.arxiv_id).toBeNull()
    expect(showcase.type).toBe("showcase")
    expect(job.type).toBe("job")
  })

  it("includes deadline for job posts", () => {
    const post = buildCreatePostInsert("user-1", {
      title: "ML Engineer",
      content: "Job description",
      section: "jobs",
      isAnonymous: false,
      tags: ["ml"],
      deadline: "2026-03-31",
    })

    expect(post.deadline).toBe("2026-03-31")
  })

  it("ignores deadline for non-job posts", () => {
    const post = buildCreatePostInsert("user-1", {
      title: "Forum post",
      content: "Content",
      section: "forum",
      isAnonymous: false,
      tags: [],
      deadline: "2026-03-31",
    })

    expect(post.deadline).toBeNull()
  })

  it("trims and validates title/content", () => {
    expect(() =>
      buildCreatePostInsert("user-1", {
        title: "   ",
        content: "Body",
        section: "forum",
        isAnonymous: false,
        tags: [],
      }),
    ).toThrowError("Title is required")

    expect(() =>
      buildCreatePostInsert("user-1", {
        title: "Title",
        content: "   ",
        section: "forum",
        isAnonymous: false,
        tags: [],
      }),
    ).toThrowError("Content is required")
  })
})
