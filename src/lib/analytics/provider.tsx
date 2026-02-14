"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { GoogleAnalytics } from "@next/third-parties/google"
import Script from "next/script"

import {
  getConsentState,
  hasRespondedToConsent,
  initConsentDefaults,
  updateConsent,
} from "./consent"
import type { ConsentState } from "./types"

type ConsentPhase = "loading" | "banner" | "granted" | "denied"

type AnalyticsContextValue = {
  consentGiven: boolean
  showBanner: boolean
  acceptAll: () => void
  rejectAll: () => void
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null)

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? ""

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<ConsentPhase>("loading")
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    initConsentDefaults()

    if (hasRespondedToConsent()) {
      setPhase(getConsentState().analytics ? "granted" : "denied")
    } else {
      setPhase("banner")
    }
  }, [])

  const consentGiven = phase === "granted"
  const showBanner = phase === "banner"

  const acceptAll = useCallback(() => {
    const consent: ConsentState = { analytics: true }
    updateConsent(consent)
    setPhase("granted")
  }, [])

  const rejectAll = useCallback(() => {
    const consent: ConsentState = { analytics: false }
    updateConsent(consent)
    setPhase("denied")
  }, [])

  return (
    <AnalyticsContext value={{ consentGiven, showBanner, acceptAll, rejectAll }}>
      {consentGiven && GA_MEASUREMENT_ID ? (
        <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      ) : null}

      {consentGiven && CLARITY_PROJECT_ID ? (
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`,
          }}
        />
      ) : null}

      {children}
    </AnalyticsContext>
  )
}

export function useAnalyticsConsent(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext)
  if (!ctx) {
    throw new Error("useAnalyticsConsent must be used within AnalyticsProvider")
  }
  return ctx
}
