"use client";

import { Suspense } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AuthProvider } from "@/lib/auth";
import { IdentityProvider } from "@/lib/identity";
import { AnalyticsProvider, PageTracker } from "@/lib/analytics";
import { VerificationRequiredDialog } from "@/components/identity/verification-required-dialog";
import { ConsentBanner } from "@/components/analytics/consent-banner";

export function Providers({ children, countryCode }: { children: React.ReactNode; countryCode: string | null }) {
  return (
    <AnalyticsProvider countryCode={countryCode}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
      >
        <AuthProvider>
          <IdentityProvider>
            {children}
            <VerificationRequiredDialog />
            <ConsentBanner />
            <Suspense>
              <PageTracker />
            </Suspense>
          </IdentityProvider>
        </AuthProvider>
      </NextThemesProvider>
    </AnalyticsProvider>
  );
}
