import type { ForumFlair, JobType, ShowcaseType } from "@/lib"

export function normalizeSearchQuery(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().replace(/\s+/g, " ")
  if (normalized.length < 2) return undefined
  return normalized.slice(0, 120)
}

export function normalizeTag(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().replace(/\s+/g, " ")
  if (!normalized) return undefined
  return normalized.slice(0, 60)
}

const VALID_FORUM_FLAIRS: ForumFlair[] = ["discussion", "question", "career", "news"]
const VALID_SHOWCASE_TYPES: ShowcaseType[] = ["tool", "dataset", "model", "library", "workflow"]
const VALID_JOB_TYPES: JobType[] = ["full-time", "part-time", "contract", "remote", "internship", "postdoc", "phd"]

function normalizeEnumValue<T extends string>(
  value: string | null | undefined,
  validValues: readonly T[],
): T | undefined {
  if (!value) return undefined
  return validValues.includes(value as T) ? (value as T) : undefined
}

export function normalizeForumFlair(value: string | null | undefined): ForumFlair | undefined {
  return normalizeEnumValue(value, VALID_FORUM_FLAIRS)
}

export function normalizeShowcaseType(value: string | null | undefined): ShowcaseType | undefined {
  return normalizeEnumValue(value, VALID_SHOWCASE_TYPES)
}

export function normalizeJobType(value: string | null | undefined): JobType | undefined {
  return normalizeEnumValue(value, VALID_JOB_TYPES)
}

export function normalizeLocationFilter(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().replace(/\s+/g, " ")
  if (!normalized) return undefined

  const sanitized = normalized.slice(0, 40)
  if (!/^[A-Za-z0-9 -]+$/.test(sanitized)) return undefined
  return sanitized
}
