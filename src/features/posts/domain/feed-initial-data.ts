import type { ForumFlair, JobType, Post, Section, ShowcaseType } from "@/lib"

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
  flair?: ForumFlair
  showcaseType?: ShowcaseType
  jobType?: JobType
  location?: string
  authorType?: AuthorType
}
