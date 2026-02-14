export type ConsentState = {
  analytics: boolean
}

export type AnalyticsEvent =
  | { name: "vote"; params: { target_type: "post" | "comment"; direction: -1 | 1; result_direction: -1 | 0 | 1 } }
  | { name: "post_created"; params: { section: string; is_anonymous: boolean } }
  | { name: "comment_created"; params: { is_anonymous: boolean; is_reply: boolean } }
  | { name: "auth_login"; params: { method: string } }
  | { name: "auth_logout"; params: Record<string, never> }
  | { name: "identity_mode_switch"; params: { from: string; to: string } }
