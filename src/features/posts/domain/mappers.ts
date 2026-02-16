import type { Comment, Post, User } from "@/lib"

import type {
  CommentWithAuthorRow,
  PostWithAuthorRow,
  ProfileRow,
} from "./types"

export function resolveAuthorIdentity(user: User, contentIsAnonymous: boolean): User {
  if (!contentIsAnonymous) return user
  return {
    ...user,
    displayName: user.generatedDisplayName ?? "Anonymous",
    avatar: "",
    isAnonymous: true,
    orcidVerifiedAt: undefined,
    orcidId: undefined,
    orcidName: undefined,
  }
}

function unwrapProfile(raw: ProfileRow | ProfileRow[] | null): ProfileRow | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  return raw
}

function trimToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function resolvePostUrl(row: PostWithAuthorRow): string | undefined {
  const directUrl = trimToNull(row.url)
  if (directUrl) return directUrl

  const arxivId = trimToNull(row.arxiv_id)?.replace(/^arxiv:/i, "")
  if (arxivId) return `https://arxiv.org/abs/${arxivId}`

  const doi = trimToNull(row.doi)?.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
  if (doi) return `https://doi.org/${doi}`

  return undefined
}

export function mapProfileRowToUser(profile: ProfileRow | null): User {
  return {
    id: profile?.id ?? "unknown",
    username: profile?.username ?? "unknown",
    displayName: profile?.display_name ?? "Anonymous",
    generatedDisplayName: profile?.generated_display_name ?? undefined,
    avatar: profile?.avatar_url ?? "",
    email: profile?.email ?? undefined,
    isAnonymous: profile?.is_anonymous ?? true,
    isBot: profile?.is_bot ?? false,
    institution: profile?.institution ?? undefined,
    karma: profile?.karma ?? 0,
    joinDate: profile?.created_at ?? new Date(0).toISOString(),
    bio: profile?.bio ?? undefined,
    position: profile?.position ?? undefined,
    department: profile?.department ?? undefined,
    country: profile?.country ?? undefined,
    websiteUrl: profile?.website_url ?? undefined,
    researchInterests: profile?.research_interests ?? [],
    orcidId: profile?.orcid_id ?? undefined,
    orcidName: profile?.orcid_name ?? undefined,
    orcidVerifiedAt: profile?.orcid_verified_at ?? undefined,
  }
}

export function mapPostRowToPost(row: PostWithAuthorRow): Post {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    author: resolveAuthorIdentity(mapProfileRowToUser(unwrapProfile(row.profiles)), row.is_anonymous),
    section: row.section,
    voteCount: row.vote_count,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ?? [],
    isAnonymous: row.is_anonymous,
    type: row.type,
    url: resolvePostUrl(row),
    flair: row.flair ?? undefined,
    projectUrl: row.project_url ?? undefined,
    techStack: row.tech_stack ?? [],
    showcaseType: row.showcase_type ?? undefined,
    company: row.company ?? undefined,
    location: row.location ?? undefined,
    jobType: row.job_type ?? undefined,
    applicationUrl: row.application_url ?? undefined,
    deadline: row.deadline ?? undefined,
  }
}

type CommentTreeRow = CommentWithAuthorRow & {
  replies: CommentTreeRow[]
}

function mapCommentNode(row: CommentTreeRow): Comment {
  return {
    id: row.id,
    content: row.content,
    author: resolveAuthorIdentity(mapProfileRowToUser(unwrapProfile(row.profiles)), row.is_anonymous),
    voteCount: row.vote_count,
    replies: row.replies.map(mapCommentNode),
    depth: row.depth,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isAnonymous: row.is_anonymous,
    isCollapsed: false,
    postId: row.post_id,
  }
}

export function mapCommentRowToComment(row: CommentWithAuthorRow): Comment {
  return mapCommentNode({ ...row, replies: [] })
}

export function mapCommentTreeToComments(rows: CommentTreeRow[]): Comment[] {
  return rows.map(mapCommentNode)
}
