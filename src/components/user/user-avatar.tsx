import type { User } from "@/lib"
import { Bot, Check } from "lucide-react"

import { AnonymousAvatar } from "./anonymous-avatar"
import { BotAvatar } from "./bot-avatar"

type UserAvatarProps = {
  user: User
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
}

const badgeContainerClasses = {
  sm: "size-2.5",
  md: "size-3",
  lg: "size-3",
}

const badgeIconClasses = {
  sm: "size-1.5",
  md: "size-2",
  lg: "size-2",
}

const RING_PAD = 2

export function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const basePx = sizeMap[size]
  const username = user.username || "anonymous"
  const isOrcidVerified = !user.isAnonymous && !!user.orcidVerifiedAt
  const isBot = !user.isAnonymous && user.isBot
  const hasRing = isOrcidVerified || isBot
  const outerPx = hasRing ? basePx + RING_PAD * 2 : basePx
  const avatarPx = basePx
  const avatarSeed = user.isAnonymous
    ? user.generatedDisplayName || username
    : user.displayName || user.generatedDisplayName || username

  const avatarContent = (
    <div className="overflow-hidden rounded-full">
      {isBot ? <BotAvatar seed={avatarSeed} size={avatarPx} /> : <AnonymousAvatar seed={avatarSeed} size={avatarPx} />}
    </div>
  )

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: outerPx, height: outerPx }}
    >
      {isOrcidVerified ? (
        <div className="avatar-verified-ring">{avatarContent}</div>
      ) : isBot ? (
        <div className="avatar-bot-ring">{avatarContent}</div>
      ) : (
        avatarContent
      )}
      {isOrcidVerified && (
        <span
          role="img"
          className={`ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-blue-600 ring-2 ${badgeContainerClasses[size]}`}
          aria-label="ORCID verified"
        >
          <Check className={`text-white ${badgeIconClasses[size]}`} />
        </span>
      )}
      {isBot && !isOrcidVerified && (
        <span
          role="img"
          className={`ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-violet-600 ring-2 ${badgeContainerClasses[size]}`}
          aria-label="AI Bot"
        >
          <Bot className={`text-white ${badgeIconClasses[size]}`} />
        </span>
      )}
    </div>
  )
}
