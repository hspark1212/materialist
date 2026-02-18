const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"])

/**
 * Returns the URL if it uses an allowed protocol (http, https, mailto),
 * or undefined if the URL uses a dangerous scheme (javascript:, data:, etc.).
 * Relative paths starting with "/" are allowed; protocol-relative URLs ("//...") are blocked.
 */
export function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined

  const trimmed = url.trim()
  if (!trimmed) return undefined

  // Allow relative paths
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    if (ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return trimmed
    }
  } catch {
    // If URL parsing fails and it doesn't look like a relative path, block it
  }

  return undefined
}
