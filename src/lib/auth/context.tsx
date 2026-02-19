"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, AuthChangeEvent } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import type { AuthContextValue, AuthStatus, Profile } from "./types"
import { deriveStatus, isValidReturnTo, profileToUser } from "./utils"

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
    if (error) {
      console.warn("fetchProfile error:", error.message)
      return null
    }
    return data as Profile | null
  } catch (err) {
    console.warn("fetchProfile exception:", err)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [pendingSignIn, setPendingSignIn] = useState(false)
  const hasReceivedInitialSession = useRef(false)
  const hasProcessedSignIn = useRef(false)

  const supabase = useMemo(() => createClient(), [])

  const refreshProfile = useCallback(async () => {
    try {
      const {
        data: { session: current },
      } = await supabase.auth.getSession()
      if (current?.user) {
        const p = await fetchProfile(current.user.id)
        setProfile(p)
      }
    } catch {
      // Supabase unavailable
    }
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session: current },
        } = await supabase.auth.getSession()

        if (current) {
          setSession(current)
          const p = await fetchProfile(current.user.id)
          setProfile(p)
        }
      } catch (err) {
        console.warn("Supabase auth init failed:", err)
      } finally {
        setInitialized(true)
      }
    }

    init()
  }, [supabase])

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, newSession) => {
      if (event === "INITIAL_SESSION") {
        hasReceivedInitialSession.current = true
        return
      }

      setSession(newSession)

      if (event === "SIGNED_OUT") {
        hasProcessedSignIn.current = false
        setProfile(null)
        setPendingSignIn(false)
        router.push("/")
        return
      }

      if (event === "SIGNED_IN") {
        if (!hasReceivedInitialSession.current) return
        if (hasProcessedSignIn.current) return
        hasProcessedSignIn.current = true
        setProfile(null)
        setPendingSignIn(true)
        return
      }
    })

    return () => data.subscription.unsubscribe()
  }, [supabase, router])

  useEffect(() => {
    if (!pendingSignIn || !session?.user?.id) return

    let cancelled = false
    fetchProfile(session.user.id)
      .then((p) => {
        if (cancelled) return
        setProfile(p)
        setPendingSignIn(false)
      })
      .catch(() => {
        if (cancelled) return
        setPendingSignIn(false)
      })

    return () => {
      cancelled = true
    }
  }, [pendingSignIn, session?.user?.id])

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return {}
    },
    [supabase],
  )

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) return { error: error.message }
      return {}
    },
    [supabase],
  )

  const signInWithOAuth = useCallback(
    async (provider: "google" | "github", returnTo?: string) => {
      const callbackUrl = new URL("/auth/callback", window.location.origin)
      if (returnTo && isValidReturnTo(returnTo)) {
        callbackUrl.searchParams.set("returnTo", returnTo)
      }
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl.toString() },
      })
    },
    [supabase],
  )

  const resetPassword = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) return { error: error.message }
      return {}
    },
    [supabase],
  )

  const updatePassword = useCallback(
    async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return { error: error.message }
      return {}
    },
    [supabase],
  )

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn("signOut error:", err)
      setSession(null)
      setProfile(null)
      router.push("/")
    }
  }, [supabase, router])

  const deleteAccount = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        return { error: data.error || "Failed to delete account" }
      }

      // Sign out locally so SIGNED_OUT event fires and redirects to /
      await supabase.auth.signOut()

      return {}
    } catch (err) {
      console.error("deleteAccount error:", err)
      return { error: "An unexpected error occurred" }
    }
  }, [supabase])

  const status: AuthStatus = !initialized ? "loading" : deriveStatus(session, profile)

  let user = null
  if (profile) {
    try {
      user = profileToUser(profile)
    } catch (err) {
      console.warn("profileToUser failed:", err)
    }
  }

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!session?.user?.id) return
      const supabaseClient = createClient()
      await supabaseClient.from("profiles").update(updates).eq("id", session.user.id)
      await refreshProfile()
    },
    [session?.user?.id, refreshProfile],
  )

  const isNavigating = pendingSignIn

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      profile,
      user,
      isNavigating,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      resetPassword,
      updatePassword,
      signOut,
      deleteAccount,
      refreshProfile,
      updateProfile,
    }),
    [
      status,
      profile,
      user,
      isNavigating,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      resetPassword,
      updatePassword,
      signOut,
      deleteAccount,
      refreshProfile,
      updateProfile,
    ],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
