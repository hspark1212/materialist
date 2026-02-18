"use client"

import { useState } from "react"

import type { Profile } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

type ProfileEditFormProps = {
  profile: Profile
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => Promise<void>
}

export function ProfileEditForm({ profile, open, onOpenChange, onSaved }: ProfileEditFormProps) {
  const [bio, setBio] = useState(profile.bio ?? "")
  const [saving, setSaving] = useState(false)

  const isOrcidLinked = !!profile.orcid_id

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from("profiles")
      .update({ bio: bio.trim() || null })
      .eq("id", profile.id)
    await onSaved()
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your public profile information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-displayname" className="text-sm font-medium">Display Name</label>
            <Input
              id="edit-displayname"
              value={profile.display_name}
              disabled
              placeholder="Your display name"
            />
            <p className="text-xs text-muted-foreground">
              {isOrcidLinked
                ? "Managed by ORCID."
                : "Auto-generated. Link ORCID to use your real name."}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-bio" className="text-sm font-medium">Bio</label>
            <Textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/300
            </p>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
