import type { Post, Section } from "@/lib"

import type { AuthorType } from "../application/ports"
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
  authorType?: AuthorType
}
