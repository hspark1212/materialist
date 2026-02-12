import type { Post } from "@/lib"

import { PostCard } from "@/components/post/post-card"
import { PostCardCompact } from "@/components/post/post-card-compact"

type FeedListProps = {
  posts: Post[]
  viewMode: "card" | "compact"
  emptyMessage?: string
}

export function FeedList({ posts, viewMode, emptyMessage = "No posts found." }: FeedListProps) {
  if (!posts.length) {
    return <p className="text-muted-foreground py-4 text-sm">{emptyMessage}</p>
  }

  return (
    <div className={viewMode === "card" ? "space-y-3" : "space-y-1"}>
      {posts.map((post) =>
        viewMode === "card" ? (
          <PostCard key={post.id} post={post} />
        ) : (
          <PostCardCompact key={post.id} post={post} />
        )
      )}
    </div>
  )
}
