"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Moon, Sun, LogOut, Mail, Trash2 } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { useIdentity } from "@/lib/identity"
import { buildOrcidAuthUrl } from "@/lib/orcid"
import { ProfileEditForm } from "@/components/user/profile-edit-form"
import { DeleteAccountDialog } from "@/components/user/delete-account-dialog"
import { OrcidBadge } from "@/components/user/orcid-badge"
import { OrcidDisconnectDialog } from "@/components/user/orcid-disconnect-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const { isAnonymousMode, switchMode } = useIdentity()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card className="py-4">
        <CardContent className="space-y-3 px-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Profile
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.displayName ?? "Anonymous"}</p>
              <p className="text-sm text-muted-foreground">u/{user?.username}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card id="verification" className="py-4 scroll-mt-20">
        <CardContent className="space-y-3 px-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Verification
          </h2>
          {user?.orcidId ? (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <OrcidBadge orcidId={user.orcidId} />
                {user.orcidName ? (
                  <p className="text-sm text-muted-foreground">{user.orcidName}</p>
                ) : null}
                {user.orcidVerifiedAt ? (
                  <p className="text-xs text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                Verify your researcher identity by linking your ORCID iD.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={buildOrcidAuthUrl()}
                >
                  Connect ORCID
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardContent className="space-y-3 px-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Account
          </h2>
          {profile?.email ? (
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" />
              <p className="text-sm">{profile.email}</p>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Sign out and return to anonymous mode
            </p>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardContent className="space-y-3 px-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Identity & Appearance
          </h2>
          <div className="flex items-center justify-between">
            <Label htmlFor="identity-toggle" className="text-sm">
              Anonymous mode
            </Label>
            <div className="flex items-center gap-2">
              <Sun className={`size-4 ${isAnonymousMode ? "text-muted-foreground" : "text-foreground"}`} />
              <Switch
                id="identity-toggle"
                checked={isAnonymousMode}
                onCheckedChange={(checked) => switchMode(checked ? "anonymous" : "verified")}
                aria-label="Toggle identity mode"
              />
              <Moon className={`size-4 ${isAnonymousMode ? "text-foreground" : "text-muted-foreground"}`} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {isAnonymousMode
              ? "You are in anonymous mode. Posts will be attributed to your anonymous identity."
              : "You are in verified mode. Posts will be attributed to your verified profile."}
          </p>
        </CardContent>
      </Card>

      <Card className="border-destructive/50 py-4">
        <CardContent className="space-y-3 px-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-destructive">
            Danger Zone
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
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
          <ProfileEditForm
            profile={profile}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSaved={refreshProfile}
          />
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
