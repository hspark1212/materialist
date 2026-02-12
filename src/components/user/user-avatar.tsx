import type { User } from "@/lib"
import { Check } from "lucide-react"

import { AnonymousAvatar } from "./anonymous-avatar"

type UserAvatarProps = {
  user: User
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
}

const badgeClasses = {
  sm: "size-2 [&>svg]:hidden",
  md: "size-2.5 [&>svg]:size-2",
  lg: "size-3 [&>svg]:size-2",
}

export function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const px = sizeMap[size]
  const username = user.username || "anonymous"
  const isOrcidVerified = !user.isAnonymous && !!user.orcidVerifiedAt
  const avatarSeed = isOrcidVerified
    ? (user.orcidName || user.displayName)
    : (user.generatedDisplayName || username)

  const avatarContent = (
    <div className="overflow-hidden rounded-full">
      <AnonymousAvatar seed={avatarSeed} size={px} />
    </div>
  )

  return (
    <div className="relative inline-flex">
      {isOrcidVerified ? (
        <div className="avatar-verified-ring">
          <div className="rounded-full bg-background p-[1.5px]">
            {avatarContent}
          </div>
        </div>
      ) : (
        avatarContent
      )}
      {isOrcidVerified && (
        <span
          className={`absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-blue-600 ring-2 ring-background ${badgeClasses[size]}`}
          aria-label="ORCID verified"
        >
          <Check className="text-white" />
        </span>
      )}
    </div>
  )
}
