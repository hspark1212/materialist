"use client"

import { useState } from "react"
import Link from "next/link"

import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    const result = await resetPassword(email.trim())
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
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>Enter your account email and we&apos;ll send you a secure reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              If an account exists for <span className="text-foreground font-medium">{email}</span>, a reset link has
              been sent.
            </p>
            <p className="text-muted-foreground text-xs">
              Didn&apos;t receive it? Check your spam folder or try again in a minute.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/login">Back to sign in</Link>
              </Button>
              <Button className="flex-1" onClick={() => setSuccess(false)} type="button">
                Send again
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending reset link..." : "Send reset link"}
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              Remember your password?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
