"use client"

import { useState } from "react"

import type { Profile } from "@/lib/auth"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type ProfileEditFormProps = {
  profile: Profile
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => Promise<void>
}

export function ProfileEditForm({ profile, open, onOpenChange, onSaved }: ProfileEditFormProps) {
  const [bio, setBio] = useState(profile.bio ?? "")
  const [institution, setInstitution] = useState(profile.institution ?? "")
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [position, setPosition] = useState(profile.position ?? "")
  const [department, setDepartment] = useState(profile.department ?? "")
  const [country, setCountry] = useState(profile.country ?? "")
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url ?? "")
  const [researchInterests, setResearchInterests] = useState(
    (profile.research_interests ?? []).join(", "),
  )
  const [saving, setSaving] = useState(false)

  const isOrcidLinked = !!profile.orcid_id

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from("profiles")
      .update({
        bio: bio || null,
        institution: institution || null,
        avatar_url: avatarUrl,
        position: position || null,
        department: department || null,
        country: country || null,
        website_url: websiteUrl || null,
        research_interests: researchInterests
          ? researchInterests.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      })
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
              placeholder="Tell the community about yourself"
              className="min-h-20 resize-y"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-institution" className="text-sm font-medium">Institution</label>
            <Input
              id="edit-institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="University or organization"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-avatar" className="text-sm font-medium">Avatar URL</label>
            <Input
              id="edit-avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-position" className="text-sm font-medium">Position / Title</label>
            <Input
              id="edit-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g., PhD Student, Postdoc, Professor"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-department" className="text-sm font-medium">Department</label>
            <Input
              id="edit-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Materials Science & Engineering"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-country" className="text-sm font-medium">Country</label>
            <Input
              id="edit-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g., South Korea, United States"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-website" className="text-sm font-medium">Website</label>
            <Input
              id="edit-website"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://your-website.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-interests" className="text-sm font-medium">Research Interests</label>
            <Input
              id="edit-interests"
              value={researchInterests}
              onChange={(e) => setResearchInterests(e.target.value)}
              placeholder="e.g., DFT, MOFs, machine learning (comma-separated)"
            />
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
