"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { LogOut, Mail, Trash2 } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { buildOrcidAuthUrl } from "@/lib/orcid"
import { ProfileEditForm } from "@/components/user/profile-edit-form"
import { DeleteAccountDialog } from "@/components/user/delete-account-dialog"
import { OrcidBadge } from "@/components/user/orcid-badge"
import { OrcidDisconnectDialog } from "@/components/user/orcid-disconnect-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function SettingsPage() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card className="py-4">
        <CardContent className="space-y-3 px-4">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Profile</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.displayName ?? "Anonymous"}</p>
              <p className="text-muted-foreground text-sm">u/{user?.username}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card id="verification" className="scroll-mt-20 py-4">
        <CardContent className="space-y-3 px-4">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Verification</h2>
          {user?.orcidId ? (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <OrcidBadge orcidId={user.orcidId} />
                {user.orcidName ? <p className="text-muted-foreground text-sm">{user.orcidName}</p> : null}
                {user.orcidVerifiedAt ? (
                  <p className="text-muted-foreground text-xs">
                    Verified {formatDistanceToNow(new Date(user.orcidVerifiedAt), { addSuffix: true })}
                  </p>
                ) : null}
              </div>
              <Button variant="outline" size="sm" onClick={() => setDisconnectOpen(true)}>
                Disconnect ORCID
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Verify your researcher identity by linking your ORCID iD.</p>
              <Button variant="outline" size="sm" asChild>
                <a href={buildOrcidAuthUrl()}>Connect ORCID</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardContent className="space-y-3 px-4">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Account</h2>
          {profile?.email ? (
            <div className="flex items-center gap-3">
              <Mail className="text-muted-foreground size-4" />
              <p className="text-sm">{profile.email}</p>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Sign out and return to anonymous mode</p>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50 py-4">
        <CardContent className="space-y-3 px-4">
          <h2 className="text-destructive text-xs font-semibold tracking-wide uppercase">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-muted-foreground text-sm">Permanently delete your account and all associated data</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {profile ? (
        <>
          <ProfileEditForm profile={profile} open={editOpen} onOpenChange={setEditOpen} onSaved={refreshProfile} />
          <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
          {user?.orcidId ? (
            <OrcidDisconnectDialog
              open={disconnectOpen}
              onOpenChange={setDisconnectOpen}
              orcidId={user.orcidId}
              onDisconnected={refreshProfile}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
