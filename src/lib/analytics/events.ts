import type { AnalyticsEvent } from "./types"

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined" || !window.gtag) return
  window.gtag("event", event.name, event.params)
}

export function trackVote(
  targetType: "post" | "comment",
  direction: -1 | 1,
  resultDirection: -1 | 0 | 1,
): void {
  trackEvent({
    name: "vote",
    params: { target_type: targetType, direction, result_direction: resultDirection },
  })
}

export function trackPostCreated(section: string, isAnonymous: boolean): void {
  trackEvent({ name: "post_created", params: { section, is_anonymous: isAnonymous } })
}

export function trackCommentCreated(isAnonymous: boolean, isReply: boolean): void {
  trackEvent({ name: "comment_created", params: { is_anonymous: isAnonymous, is_reply: isReply } })
}

export function trackAuthEvent(
  action: "auth_login" | "auth_logout",
  method?: string,
): void {
  if (action === "auth_logout") {
    trackEvent({ name: "auth_logout", params: {} })
  } else {
    trackEvent({ name: "auth_login", params: { method: method ?? "unknown" } })
  }
}

export function trackIdentityModeSwitch(from: string, to: string): void {
  trackEvent({ name: "identity_mode_switch", params: { from, to } })
}
