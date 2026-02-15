import type { PostType, Section } from "@/lib"

import type {
  CreatePostInput,
  PostInsertPayload,
  PostUpdatePayload,
  UpdatePostInput,
} from "./types"

function cleanOptional(value?: string): string | null {
  const next = value?.trim()
  return next ? next : null
}

function cleanArray(values?: string[]): string[] {
  if (!values?.length) return []
  return values.map((value) => value.trim()).filter(Boolean)
}

function resolvePostType(section: Section, url: string | null): PostType {
  if (section === "papers") return "paper"
  if (section === "showcase") return "showcase"
  if (section === "jobs") return "job"
  return url ? "link" : "text"
}

export function buildCreatePostInsert(authorId: string, input: CreatePostInput): PostInsertPayload {
  const title = input.title.trim()
  const content = input.content.trim()

  if (!title) {
    throw new Error("Title is required")
  }

  if (!content) {
    throw new Error("Content is required")
  }

  const url = cleanOptional(input.url)

  return {
    title,
    content,
    author_id: authorId,
    section: input.section,
    type: resolvePostType(input.section, url),
    tags: cleanArray(input.tags),
    is_anonymous: input.isAnonymous,
    doi: cleanOptional(input.doi),
    arxiv_id: cleanOptional(input.arxivId),
    url,
    flair: input.section === "forum" ? input.flair ?? null : null,
    project_url: input.section === "showcase" ? cleanOptional(input.projectUrl) : null,
    tech_stack: input.section === "showcase" ? cleanArray(input.techStack) : [],
    showcase_type: input.section === "showcase" ? input.showcaseType ?? null : null,
    company: input.section === "jobs" ? cleanOptional(input.company) : null,
    location: input.section === "jobs" ? cleanOptional(input.location) : null,
    job_type: input.section === "jobs" ? input.jobType ?? null : null,
    application_url: input.section === "jobs" ? cleanOptional(input.applicationUrl) : null,
    deadline: input.section === "jobs" ? cleanOptional(input.deadline) : null,
  }
}

export function buildUpdatePostPatch(
  currentSection: Section,
  currentUrl: string | null,
  input: UpdatePostInput,
): PostUpdatePayload {
  const patch: PostUpdatePayload = {}
  const nextSection = input.section ?? currentSection
  const nextUrl = input.url === undefined ? currentUrl : cleanOptional(input.url)

  if (input.title !== undefined) {
    const title = input.title.trim()
    if (!title) {
      throw new Error("Title is required")
    }
    patch.title = title
  }

  if (input.content !== undefined) {
    const content = input.content.trim()
    if (!content) {
      throw new Error("Content is required")
    }
    patch.content = content
  }

  if (input.section !== undefined) patch.section = input.section
  if (input.tags !== undefined) patch.tags = cleanArray(input.tags)
  if (input.isAnonymous !== undefined) patch.is_anonymous = input.isAnonymous

  if (input.url !== undefined) patch.url = nextUrl

  if (input.flair !== undefined) {
    patch.flair = nextSection === "forum" ? input.flair ?? null : null
  } else if (input.section === "forum") {
    patch.flair = null
  }

  if (input.projectUrl !== undefined) {
    patch.project_url = nextSection === "showcase" ? cleanOptional(input.projectUrl) : null
  }

  if (input.techStack !== undefined) {
    patch.tech_stack = nextSection === "showcase" ? cleanArray(input.techStack) : []
  }

  if (input.showcaseType !== undefined) {
    patch.showcase_type = nextSection === "showcase" ? input.showcaseType ?? null : null
  }

  if (input.company !== undefined) {
    patch.company = nextSection === "jobs" ? cleanOptional(input.company) : null
  }

  if (input.location !== undefined) {
    patch.location = nextSection === "jobs" ? cleanOptional(input.location) : null
  }

  if (input.jobType !== undefined) {
    patch.job_type = nextSection === "jobs" ? input.jobType ?? null : null
  }

  if (input.applicationUrl !== undefined) {
    patch.application_url = nextSection === "jobs" ? cleanOptional(input.applicationUrl) : null
  }

  if (input.deadline !== undefined) {
    patch.deadline = nextSection === "jobs" ? cleanOptional(input.deadline) : null
  }

  patch.type = resolvePostType(nextSection, nextUrl)

  return patch
}
