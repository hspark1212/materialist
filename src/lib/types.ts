export interface User {
  id: string
  username: string
  displayName: string
  generatedDisplayName?: string
  avatar: string
  email?: string
  isAnonymous: boolean
  institution?: string
  karma: number
  joinDate: string
  bio?: string
  position?: string
  department?: string
  country?: string
  websiteUrl?: string
  researchInterests?: string[]
  orcidId?: string
  orcidName?: string
  orcidVerifiedAt?: string
}

export type Section = "papers" | "forum" | "showcase" | "jobs"

export type ForumFlair = "discussion" | "question" | "career" | "news"

export type JobType = "full-time" | "part-time" | "contract" | "remote" | "internship" | "postdoc" | "phd"

export type ShowcaseType = "tool" | "dataset" | "model" | "library" | "workflow"

export type PostType = "text" | "link" | "paper" | "showcase" | "job"

export interface Post {
  id: string
  title: string
  content: string
  author: User
  section: Section
  voteCount: number
  commentCount: number
  createdAt: string
  tags: string[]
  isAnonymous: boolean
  type: PostType
  userVote?: -1 | 0 | 1
  // Shared external source
  url?: string
  // Forum fields
  flair?: ForumFlair
  // Showcase fields
  projectUrl?: string
  techStack?: string[]
  showcaseType?: ShowcaseType
  // Job fields
  company?: string
  location?: string
  jobType?: JobType
  applicationUrl?: string
}

export interface Comment {
  id: string
  content: string
  author: User
  voteCount: number
  replies: Comment[]
  depth: number
  createdAt: string
  isAnonymous: boolean
  isCollapsed: boolean
  postId: string
}
