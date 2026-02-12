import { describe, expect, it } from "vitest"

import { buildCommentTree } from "../comment-tree"

type FlatComment = {
  id: string
  parent_comment_id: string | null
  vote_count: number
  created_at: string
}

describe("buildCommentTree", () => {
  const rows: FlatComment[] = [
    {
      id: "c1",
      parent_comment_id: null,
      vote_count: 5,
      created_at: "2026-02-10T00:00:00.000Z",
    },
    {
      id: "c2",
      parent_comment_id: "c1",
      vote_count: 3,
      created_at: "2026-02-10T01:00:00.000Z",
    },
    {
      id: "c3",
      parent_comment_id: null,
      vote_count: 10,
      created_at: "2026-02-10T02:00:00.000Z",
    },
  ]

  it("builds nested tree", () => {
    const tree = buildCommentTree(rows, "best")

    expect(tree).toHaveLength(2)
    expect(tree[1].id).toBe("c1")
    expect(tree[1].replies).toHaveLength(1)
    expect(tree[1].replies[0].id).toBe("c2")
  })

  it("sorts roots by created_at when new", () => {
    const tree = buildCommentTree(rows, "new")

    expect(tree[0].id).toBe("c3")
    expect(tree[1].id).toBe("c1")
  })

  it("keeps orphan comments at root", () => {
    const orphanRows: FlatComment[] = [
      {
        id: "c4",
        parent_comment_id: "missing",
        vote_count: 1,
        created_at: "2026-02-10T03:00:00.000Z",
      },
    ]

    const tree = buildCommentTree(orphanRows, "best")

    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe("c4")
    expect(tree[0].replies).toHaveLength(0)
  })
})
