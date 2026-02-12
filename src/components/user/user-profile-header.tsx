import type { User } from "@/lib"
import { buildOrcidAuthUrl } from "@/lib/orcid"
import { UserAvatar } from "@/components/user/user-avatar"
import { OrcidBadge, OrcidIcon } from "@/components/user/orcid-badge"
import { Button } from "@/components/ui/button"

type UserProfileHeaderProps = {
  user: User
  isOwnProfile?: boolean
}

export function UserProfileHeader({ user, isOwnProfile }: UserProfileHeaderProps) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-4 sm:p-6">
      <div className="flex flex-col items-center text-center gap-4">
        <UserAvatar user={user} size="lg" />

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-baseline justify-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{user.displayName}</h1>
            {user.orcidId && !user.isAnonymous ? (
              <OrcidBadge orcidId={user.orcidId} />
            ) : isOwnProfile && !user.isAnonymous ? (
              <Button variant="outline" size="sm" asChild>
                <a href={buildOrcidAuthUrl()}>
                  <OrcidIcon className="size-3.5" />
                  Verify ORCID
                </a>
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {user.position ? <span className="text-muted-foreground">{user.position}</span> : null}
            {user.institution ? (
              <span className="text-muted-foreground">
                {user.institution}
                {user.country ? ` · ${user.country}` : ""}
              </span>
            ) : null}
          </div>

          {user.bio ? <p className="text-muted-foreground pt-1 text-sm leading-relaxed">{user.bio}</p> : null}
        </div>
      </div>
    </div>
  )
}
