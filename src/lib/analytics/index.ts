export { AnalyticsProvider, useAnalyticsConsent } from "./provider"
export { PageTracker } from "./page-tracker"
export {
  trackEvent,
  trackVote,
  trackPostCreated,
  trackCommentCreated,
  trackAuthEvent,
  trackIdentityModeSwitch,
} from "./events"
export type { AnalyticsEvent, ConsentState } from "./types"
