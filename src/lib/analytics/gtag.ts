export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""

// https://developers.google.com/analytics/devguides/collection/ga4/page-view
export function pageview(url: string) {
  if (!GA_MEASUREMENT_ID) return
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url })
}

// https://developers.google.com/analytics/devguides/collection/ga4/event-parameters
export function event(action: string, params?: Record<string, string | number | boolean>) {
  if (!GA_MEASUREMENT_ID) return
  window.gtag("event", action, params)
}

declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "set" | "consent",
      targetOrAction: string | Date,
      params?: Record<string, unknown>,
    ) => void
    dataLayer: Record<string, unknown>[]
  }
}
