"use client"

import Link from "next/link"
import { Lock, ShieldCheck } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { useIdentity } from "@/lib/identity"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { OrcidIcon } from "@/components/user/orcid-badge"

export function VerificationRequiredDialog() {
  const { status } = useAuth()
  const { isVerificationDialogOpen, closeVerificationDialog } = useIdentity()

  const isLoggedIn = status === "authenticated" || status === "verified"

  return (
    <Dialog
      open={isVerificationDialogOpen}
      onOpenChange={(open) => {
        if (!open) closeVerificationDialog()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div className="bg-primary/10 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
            {isLoggedIn ? <ShieldCheck className="text-primary size-6" /> : <Lock className="text-primary size-6" />}
          </div>
          <DialogTitle className="text-center">
            {isLoggedIn ? "Researcher Verification Required" : "Sign In Required"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLoggedIn ? (
              <>
                Link your ORCID iD to get two profiles: anonymous + verified. Switch between them freely — your
                anonymous identity stays untouched.
              </>
            ) : (
              <>Sign in to access identity features. Verified mode requires ORCID verification after signing in.</>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoggedIn && (
          <div className="text-muted-foreground mx-auto flex items-center justify-center gap-3 text-xs">
            <span className="bg-muted rounded-full px-2.5 py-1 font-medium">🌙 Anonymous</span>
            <span>↔</span>
            <span className="bg-muted rounded-full px-2.5 py-1 font-medium">☀️ Verified</span>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {isLoggedIn ? (
            <Button asChild className="w-full gap-2" onClick={closeVerificationDialog}>
              <Link href="/settings#verification">
                <OrcidIcon className="size-4" />
                Connect ORCID
              </Link>
            </Button>
          ) : (
            <Button asChild className="w-full" onClick={closeVerificationDialog}>
              <Link href="/login">Sign In</Link>
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={closeVerificationDialog}>
            Not Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
