import { format } from "date-fns"

import type { User } from "@/lib"
import { UserAvatar } from "@/components/user/user-avatar"
import { OrcidBadge, OrcidIcon } from "@/components/user/orcid-badge"
import { Button } from "@/components/ui/button"

function buildOrcidAuthUrl() {
  const redirectUri = encodeURIComponent(
    `${window.location.origin}/api/orcid/callback`
  )
  return `https://orcid.org/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${redirectUri}`
}

type UserProfileHeaderProps = {
  user: User
  postCount: number
  isOwnProfile?: boolean
}

export function UserProfileHeader({ user, postCount, isOwnProfile }: UserProfileHeaderProps) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-4 sm:p-6">
      <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:items-start sm:text-left sm:gap-5">
        <UserAvatar user={user} size="lg" />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{user.displayName}</h1>
            {user.orcidId ? (
              <OrcidBadge orcidId={user.orcidId} />
            ) : isOwnProfile ? (
              <Button variant="outline" size="sm" asChild>
                <a href={buildOrcidAuthUrl()}>
                  <OrcidIcon className="size-3.5" />
                  Verify ORCID
                </a>
              </Button>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm">u/{user.username}</p>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {user.position ? <span className="text-muted-foreground">{user.position}</span> : null}
            {user.institution ? (
              <span className="text-muted-foreground">
                {user.institution}
                {user.country ? ` · ${user.country}` : ""}
              </span>
            ) : null}
          </div>

          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>Joined {format(new Date(user.joinDate), "MMM yyyy")}</span>
            <span>{postCount} posts</span>
          </div>

          {user.bio ? <p className="text-muted-foreground pt-1 text-sm leading-relaxed">{user.bio}</p> : null}
        </div>
      </div>
    </div>
  )
}
