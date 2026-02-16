"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "next-themes"

import type { User } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import type { IdentityContextValue, IdentityMode } from "./types"

const IdentityContext = createContext<IdentityContextValue | null>(null)

function buildAnonymousUser(user: User): User {
  return {
    ...user,
    displayName: user.generatedDisplayName ?? "Anonymous",
    avatar: "",
    isAnonymous: true,
    orcidVerifiedAt: undefined,
    orcidId: undefined,
    orcidName: undefined,
  }
}

function buildVerifiedUser(user: User): User {
  return {
    ...user,
    isAnonymous: false,
  }
}

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme()
  const { user, status } = useAuth()
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false)

  const isAnonymousMode = resolvedTheme === "dark"
  const mode: IdentityMode = isAnonymousMode ? "anonymous" : "verified"

  const isAuthenticated = status === "authenticated" || status === "verified"

  // ORCID verification is the gate for Verified mode
  const canUseVerifiedMode = isAuthenticated && !!user?.orcidVerifiedAt

  // Track previous auth status for detecting transitions
  const prevStatusRef = useRef(status)

  const activeUser = useMemo<User | null>(() => {
    if (!user || !isAuthenticated) return null
    return isAnonymousMode ? buildAnonymousUser(user) : buildVerifiedUser(user)
  }, [user, isAuthenticated, isAnonymousMode])

  // Auto-switch identity mode based on auth status transitions
  useEffect(() => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = status

    // 1. Logout detected: verified/authenticated → anonymous
    if ((prevStatus === "verified" || prevStatus === "authenticated") && status === "anonymous") {
      setTheme("dark") // Switch to anonymous mode
      return
    }

    // 2. ORCID-verified user login detected: → verified with canUseVerifiedMode
    if (prevStatus !== "verified" && status === "verified" && canUseVerifiedMode) {
      setTheme("light") // Switch to verified mode
      return
    }
  }, [status, canUseVerifiedMode, setTheme])

  // Force dark mode for unverified users who somehow end up in light mode
  useEffect(() => {
    if (!canUseVerifiedMode && resolvedTheme === "light") {
      setTheme("dark")
    }
  }, [canUseVerifiedMode, resolvedTheme, setTheme])

  const requestVerification = useCallback(() => {
    setIsVerificationDialogOpen(true)
  }, [])

  const closeVerificationDialog = useCallback(() => {
    setIsVerificationDialogOpen(false)
  }, [])

  const switchMode = useCallback(
    (target: IdentityMode) => {
      if (target === "verified" && !canUseVerifiedMode) {
        requestVerification()
        return
      }
      setTheme(target === "anonymous" ? "dark" : "light")
    },
    [canUseVerifiedMode, requestVerification, setTheme],
  )

  const value = useMemo<IdentityContextValue>(
    () => ({
      mode,
      isAnonymousMode,
      activeUser,
      canUseVerifiedMode,
      isVerificationDialogOpen,
      switchMode,
      requestVerification,
      closeVerificationDialog,
    }),
    [mode, isAnonymousMode, activeUser, canUseVerifiedMode, isVerificationDialogOpen, switchMode, requestVerification, closeVerificationDialog],
  )

  return <IdentityContext value={value}>{children}</IdentityContext>
}

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext)
  if (!ctx) {
    throw new Error("useIdentity must be used within an IdentityProvider")
  }
  return ctx
}
