import type {
  ForumFlair,
  JobType,
  PostType,
  Section,
  ShowcaseType,
} from "@/lib"

export type PostSort = "hot" | "new" | "top"
export type CommentSort = "best" | "new"
export type VoteTargetType = "post" | "comment"
export type VoteDirection = -1 | 1
export type PersistedVoteDirection = -1 | 0 | 1

export type ProfileRow = {
  id: string
  username: string
  display_name: string
  generated_display_name: string | null
  avatar_url: string | null
  email: string | null
  institution: string | null
  bio: string | null
  karma: number
  is_anonymous: boolean
  is_bot: boolean
  created_at: string
  updated_at: string
  position: string | null
  department: string | null
  country: string | null
  website_url: string | null
  research_interests: string[] | null
  orcid_id: string | null
  orcid_name: string | null
  orcid_verified_at: string | null
}

export type PostRow = {
  id: string
  title: string
  content: string
  author_id: string
  section: Section
  type: PostType
  tags: string[] | null
  is_anonymous: boolean
  vote_count: number
  comment_count: number
  doi: string | null
  arxiv_id: string | null
  url: string | null
  flair: ForumFlair | null
  project_url: string | null
  tech_stack: string[] | null
  showcase_type: ShowcaseType | null
  company: string | null
  location: string | null
  job_type: JobType | null
  application_url: string | null
  created_at: string
  updated_at: string
}

export type CommentRow = {
  id: string
  content: string
  author_id: string
  post_id: string
  parent_comment_id: string | null
  depth: number
  is_anonymous: boolean
  vote_count: number
  created_at: string
  updated_at: string
}

export type VoteRow = {
  id: string
  user_id: string
  target_type: VoteTargetType
  target_id: string
  vote_direction: VoteDirection
  created_at: string
  updated_at: string
}

export type PostWithAuthorRow = PostRow & {
  profiles: ProfileRow | ProfileRow[] | null
}

export type CommentWithAuthorRow = CommentRow & {
  profiles: ProfileRow | ProfileRow[] | null
}

export type CreatePostInput = {
  title: string
  content: string
  section: Section
  isAnonymous: boolean
  tags: string[]
  url?: string
  doi?: string
  arxivId?: string
  flair?: ForumFlair
  projectUrl?: string
  techStack?: string[]
  showcaseType?: ShowcaseType
  company?: string
  location?: string
  jobType?: JobType
  applicationUrl?: string
}

export type UpdatePostInput = Partial<CreatePostInput>

export type CreateCommentInput = {
  postId: string
  content: string
  parentCommentId?: string | null
  isAnonymous: boolean
}

export type UpdateCommentInput = {
  content: string
}

export type CastVoteInput = {
  targetType: VoteTargetType
  targetId: string
  direction: VoteDirection
}

export type PostInsertPayload = {
  title: string
  content: string
  author_id: string
  section: Section
  type: PostType
  tags: string[]
  is_anonymous: boolean
  doi: string | null
  arxiv_id: string | null
  url: string | null
  flair: ForumFlair | null
  project_url: string | null
  tech_stack: string[]
  showcase_type: ShowcaseType | null
  company: string | null
  location: string | null
  job_type: JobType | null
  application_url: string | null
}

export type PostUpdatePayload = Partial<PostInsertPayload>

export type CommentInsertPayload = {
  content: string
  author_id: string
  post_id: string
  parent_comment_id: string | null
  depth: number
  is_anonymous: boolean
}

export type CommentTreeNode = CommentWithAuthorRow & {
  replies: CommentTreeNode[]
}
