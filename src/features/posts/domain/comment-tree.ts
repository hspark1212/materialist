import type { CommentSort } from "./types"

type TreeNode<Row extends { id: string; parent_comment_id: string | null }> = Row & {
  replies: TreeNode<Row>[]
}

function compare<
  Row extends {
    id: string
    parent_comment_id: string | null
    vote_count: number
    created_at: string
  },
>(
  sort: CommentSort,
  left: TreeNode<Row>,
  right: TreeNode<Row>,
): number {
  if (sort === "new") {
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  }

  if (right.vote_count !== left.vote_count) {
    return right.vote_count - left.vote_count
  }

  return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
}

export function buildCommentTree<
  Row extends {
    id: string
    parent_comment_id: string | null
    vote_count: number
    created_at: string
  },
>(rows: Row[], sort: CommentSort): TreeNode<Row>[] {
  const byId = new Map<string, TreeNode<Row>>()

  for (const row of rows) {
    byId.set(row.id, { ...row, replies: [] })
  }

  const roots: TreeNode<Row>[] = []

  for (const node of byId.values()) {
    if (!node.parent_comment_id) {
      roots.push(node)
      continue
    }

    const parent = byId.get(node.parent_comment_id)
    if (!parent) {
      roots.push(node)
      continue
    }

    parent.replies.push(node)
  }

  const sortTree = (nodes: TreeNode<Row>[]) => {
    nodes.sort((left, right) => compare(sort, left, right))
    for (const node of nodes) {
      if (node.replies.length) {
        sortTree(node.replies)
      }
    }
  }

  sortTree(roots)

  return roots
}
