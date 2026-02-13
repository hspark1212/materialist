import type { Post, Section } from "@/lib"

import type { PostSort } from "./types"

export type PostsFeedInitialData = {
  prefetched: boolean
  posts: Post[]
  hasMore: boolean
  nextOffset: number | null
  limit: number
  sortBy: PostSort
  section?: Section
  tag?: string
  query?: string
}
