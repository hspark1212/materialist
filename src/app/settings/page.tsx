"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Moon, Sun, LogOut, Mail, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"

import { useAuth } from "@/lib/auth"
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
  const { resolvedTheme, setTheme } = useTheme()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const isDarkMode = resolvedTheme === "dark"

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
                  href={`https://orcid.org/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${typeof window !== "undefined" ? encodeURIComponent(window.location.origin + "/api/orcid/callback") : ""}`}
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
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-toggle" className="text-sm">
              Dark mode
            </Label>
            <div className="flex items-center gap-2">
              <Sun className={`size-4 ${isDarkMode ? "text-muted-foreground" : "text-foreground"}`} />
              <Switch
                id="theme-toggle"
                checked={isDarkMode}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="Toggle dark mode"
              />
              <Moon className={`size-4 ${isDarkMode ? "text-foreground" : "text-muted-foreground"}`} />
            </div>
          </div>
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
