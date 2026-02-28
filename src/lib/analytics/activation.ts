import { event } from "@/lib/analytics/gtag"

/**
 * Fire `activated` event at most once per activation_type per session.
 * Uses sessionStorage for dedup — silently no-ops in SSR or when storage is unavailable.
 */
export function trackActivation(type: "vote" | "comment" | "post") {
  const key = `activated:${type}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, "1")
    event("activated", { activation_type: type })
  } catch {
    // SSR or sessionStorage unavailable
  }
}
