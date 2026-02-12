"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AuthProvider } from "@/lib/auth";
import { IdentityProvider } from "@/lib/identity";
import { VerificationRequiredDialog } from "@/components/identity/verification-required-dialog";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      <AuthProvider>
        <IdentityProvider>
          {children}
          <VerificationRequiredDialog />
        </IdentityProvider>
      </AuthProvider>
    </NextThemesProvider>
  );
}
