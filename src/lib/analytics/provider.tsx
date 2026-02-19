"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"
import { GA_MEASUREMENT_ID, pageview } from "./gtag"

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? ""

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return
    const url = searchParams?.size ? `${pathname}?${searchParams.toString()}` : pathname
    pageview(url)
  }, [pathname, searchParams])

  return null
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const hasGA = !!GA_MEASUREMENT_ID
  const hasClarity = !!CLARITY_PROJECT_ID

  if (!hasGA && !hasClarity) return <>{children}</>

  return (
    <>
      {hasGA && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
          </Script>
          <PageviewTracker />
        </>
      )}
      {hasClarity && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${CLARITY_PROJECT_ID}");`}
        </Script>
      )}
      {children}
    </>
  )
}
