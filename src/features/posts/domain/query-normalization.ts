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
