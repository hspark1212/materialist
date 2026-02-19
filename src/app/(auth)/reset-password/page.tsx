"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { useAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingRecovery, setCheckingRecovery] = useState(true)
  const [isRecoveryReady, setIsRecoveryReady] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || !session) return
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setIsRecoveryReady(true)
        setCheckingRecovery(false)
        setError("")
      }
    })

    const init = async () => {
      const code = searchParams.get("code")
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (cancelled) return
        if (exchangeError) {
          const {
            data: { session: existingSession },
          } = await supabase.auth.getSession()
          if (cancelled) return
          if (!existingSession) {
            setError("This reset link is invalid or has expired. Request a new one.")
            setCheckingRecovery(false)
            return
          }
        }
        window.history.replaceState({}, "", "/reset-password")
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return

      if (session) {
        setIsRecoveryReady(true)
      } else {
        setError("Recovery session not found. Please request a new reset link.")
      }
      setCheckingRecovery(false)
    }

    void init()

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [searchParams])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    const result = await updatePassword(password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(true)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Set a new password</CardTitle>
        <CardDescription>Choose a strong password for your Materialist account.</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">Password updated successfully.</p>
            <Button className="w-full" asChild>
              <Link href="/">Continue</Link>
            </Button>
          </div>
        ) : checkingRecovery ? (
          <p className="text-muted-foreground text-sm">Verifying your reset link...</p>
        ) : isRecoveryReady ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="new-password"
              />
              <p className="text-muted-foreground text-xs">At least 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating password..." : "Update password"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/forgot-password">Request new reset link</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
