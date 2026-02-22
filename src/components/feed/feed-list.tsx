import { useMemo } from "react"

import type { Post } from "@/lib"

import { PostCard } from "@/components/post/post-card"

type FeedListProps = {
  posts: Post[]
  hotPostIds?: string[]
  emptyMessage?: string
}

export function FeedList({ posts, hotPostIds, emptyMessage = "No posts found." }: FeedListProps) {
  const hotSet = useMemo(() => new Set(hotPostIds), [hotPostIds])

  if (!posts.length) {
    return <p className="text-muted-foreground py-4 text-sm">{emptyMessage}</p>
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} isHot={hotSet.has(post.id)} />
      ))}
    </div>
  )
}
