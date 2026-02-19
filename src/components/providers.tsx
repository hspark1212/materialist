"use client"

import { Suspense } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

import { AuthProvider } from "@/lib/auth"
import { IdentityProvider } from "@/lib/identity"
import { AnalyticsProvider } from "@/lib/analytics/provider"
import { VerificationRequiredDialog } from "@/components/identity/verification-required-dialog"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <AuthProvider>
        <IdentityProvider>
          <Suspense>
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </Suspense>
          <VerificationRequiredDialog />
        </IdentityProvider>
      </AuthProvider>
    </NextThemesProvider>
  )
}
