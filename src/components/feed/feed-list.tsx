import type { Post } from "@/lib"

import { PostCard } from "@/components/post/post-card"

type FeedListProps = {
  posts: Post[]
  emptyMessage?: string
}

export function FeedList({ posts, emptyMessage = "No posts found." }: FeedListProps) {
  if (!posts.length) {
    return <p className="text-muted-foreground py-4 text-sm">{emptyMessage}</p>
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
