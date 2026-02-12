"use client"

import { useState } from "react"

import { useAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type OrcidDisconnectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orcidId: string
  onDisconnected: () => Promise<void>
}

export function OrcidDisconnectDialog({
  open,
  onOpenChange,
  orcidId,
  onDisconnected,
}: OrcidDisconnectDialogProps) {
  const { profile } = useAuth()
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDisconnect = async () => {
    if (!profile?.id) return

    setDisconnecting(true)
    setError(null)

    const supabase = createClient()
    const { error: dbError } = await supabase
      .from("profiles")
      .update({
        orcid_id: null,
        orcid_name: null,
        orcid_verified_at: null,
        display_name: profile.generated_display_name ?? profile.display_name,
        is_anonymous: true,
      })
      .eq("id", profile.id)

    if (dbError) {
      setError(dbError.message)
      setDisconnecting(false)
      return
    }

    await onDisconnected()
    setDisconnecting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!disconnecting}>
        <DialogHeader>
          <DialogTitle>Disconnect ORCID</DialogTitle>
          <DialogDescription>
            Are you sure you want to disconnect your ORCID iD ({orcidId})?
            You can re-verify at any time.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={disconnecting}>
            Cancel
          </Button>
          <Button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
