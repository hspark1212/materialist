import type { ForumFlair, JobType, ShowcaseType } from "@/lib"

export function normalizeSearchQuery(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().replace(/\s+/g, " ")
  if (normalized.length < 2) return undefined
  return normalized.slice(0, 120)
}

// Canonical tag normalization
export function normalizeTag(value: string | null | undefined): string | undefined {
  if (!value) return undefined

  // 1) trim and collapse whitespace
  let t = value.trim().replace(/\s+/g, " ")

  // 2) strip leading '#'
  if (t.startsWith("#")) {
    t = t.slice(1)
  }

  // 3) lowercase
  t = t.toLowerCase()

  // 4) replace spaces with '-'
  t = t.replace(/\s+/g, "-")

  // 5) remove disallowed chars, allow [a-z0-9-_.+]
  t = t.replace(/[^a-z0-9_\-\.\+]/g, "")

  // 6) max length of 40
  if (t.length > 40) return undefined

  // 7) empty -> undefined
  if (t.length === 0) return undefined

  return t
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
