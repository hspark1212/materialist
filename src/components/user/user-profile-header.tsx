import type { User } from "@/lib"
import { Bot } from "lucide-react"
import { buildOrcidAuthUrl } from "@/lib/orcid"
import { UserAvatar } from "@/components/user/user-avatar"
import { OrcidBadge, OrcidIcon } from "@/components/user/orcid-badge"
import { Badge } from "@/components/ui/badge"

type UserProfileHeaderProps = {
  user: User
  showVerifyAction?: boolean
}

export function UserProfileHeader({ user, showVerifyAction = false }: UserProfileHeaderProps) {
  return (
    <div className="border-border bg-card/70 rounded-lg border p-4 sm:p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <UserAvatar user={user} size="lg" />

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-baseline justify-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{user.displayName}</h1>
            {user.isBot && !user.isAnonymous && !user.orcidId ? (
              <Badge variant="secondary" className="gap-0.5">
                <Bot className="size-3.5" />
                <span>AI Bot</span>
              </Badge>
            ) : user.orcidId && !user.isAnonymous ? (
              <OrcidBadge orcidId={user.orcidId} />
            ) : showVerifyAction ? (
              <Badge variant="outline" asChild>
                <a href={buildOrcidAuthUrl()} className="inline-flex items-center gap-1">
                  <OrcidIcon className="size-3.5" />
                  <span>Verify ORCID</span>
                </a>
              </Badge>
            ) : null}
          </div>
          {user.bio && <p className="text-muted-foreground text-sm">{user.bio}</p>}
        </div>
      </div>
    </div>
  )
}
