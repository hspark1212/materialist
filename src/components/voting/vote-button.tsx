"use client"

import { useEffect, useState } from "react"
import { ArrowBigDown, ArrowBigUp } from "lucide-react"

import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib"
import { event } from "@/lib/analytics/gtag"

type VoteButtonProps = {
  targetType: "post" | "comment"
  targetId: string
  initialCount: number
  initialUserVoteAnonymous?: -1 | 0 | 1
  initialUserVoteVerified?: -1 | 0 | 1
  isAnonymous?: boolean
  orientation?: "vertical" | "horizontal"
  size?: "default" | "sm"
  compact?: boolean
  countMode?: "net" | "nonNegative"
  className?: string
}

type VoteStyleParams = {
  compact: boolean
  orientation: "vertical" | "horizontal"
  size: "default" | "sm"
}

function getIconSize({ compact, orientation, size }: VoteStyleParams) {
  if (!compact) return size === "sm" ? "size-4" : "size-5"
  if (size === "sm") return orientation === "horizontal" ? "size-3 md:size-4" : "size-3.5 md:size-4"
  return "size-3.5 md:size-5"
}

function getCountSize({ compact, size }: VoteStyleParams) {
  if (!compact) return size === "sm" ? "text-xs" : "text-sm"
  return size === "sm" ? "text-[11px] md:text-xs" : "text-[11px] md:text-sm"
}

function getButtonSizeClass({ compact, orientation }: VoteStyleParams) {
  if (!compact) return "min-h-11 min-w-11 md:min-h-0 md:min-w-0"
  if (orientation === "horizontal") return "min-h-7 min-w-7 md:min-h-0 md:min-w-0"
  return "min-h-8 min-w-8 md:min-h-0 md:min-w-0"
}

function getContainerClass({ compact, orientation }: VoteStyleParams) {
  if (orientation === "horizontal") {
    return compact ? "flex-row gap-0.5 px-0 py-0 md:gap-1 md:px-1 md:py-0.5" : "flex-row px-1 py-0.5"
  }

  return compact ? "w-9 flex-col gap-0.5 py-0.5 md:w-12 md:gap-1.5 md:py-1" : "w-12 flex-col py-1"
}

const VOTE_SYNC_EVENT = "vote-sync"

type VoteSyncDetail = {
  targetType: "post" | "comment"
  targetId: string
  isAnonymous: boolean
  userVote: -1 | 0 | 1
  voteCount: number
}

const VOTE_SYNC_STORAGE_PREFIX = "vote-sync:"

type StoredVoteSync = VoteSyncDetail & { timestamp: number }

function persistVoteSync(detail: VoteSyncDetail) {
  try {
    const key = `${VOTE_SYNC_STORAGE_PREFIX}${detail.targetType}:${detail.targetId}`
    localStorage.setItem(key, JSON.stringify({ ...detail, timestamp: Date.now() }))
  } catch {
    // localStorage unavailable (SSR, quota exceeded)
  }
}

function readPersistedVoteSync(targetType: string, targetId: string): StoredVoteSync | null {
  try {
    const key = `${VOTE_SYNC_STORAGE_PREFIX}${targetType}:${targetId}`
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as StoredVoteSync
  } catch {
    return null
  }
}

function broadcastVoteSync(detail: VoteSyncDetail) {
  window.dispatchEvent(new CustomEvent(VOTE_SYNC_EVENT, { detail }))
  persistVoteSync(detail)
}

export function VoteButton({
  targetType,
  targetId,
  initialCount,
  initialUserVoteAnonymous = 0,
  initialUserVoteVerified = 0,
  isAnonymous = false,
  orientation = "vertical",
  size = "default",
  compact = false,
  countMode = "net",
  className,
}: VoteButtonProps) {
  const { status } = useAuth()
  const [anonVote, setAnonVote] = useState<-1 | 0 | 1>(initialUserVoteAnonymous)
  const [verifiedVote, setVerifiedVote] = useState<-1 | 0 | 1>(initialUserVoteVerified)
  const [voteCount, setVoteCount] = useState(initialCount)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const userVote = isAnonymous ? anonVote : verifiedVote

  const canVote = status !== "loading" && status !== "anonymous"

  // Parent data can change without remounting (e.g. profile identity-mode switches).
  // Keep local state aligned with server-derived props so the active mode shows the correct vote.
  useEffect(() => {
    setAnonVote(initialUserVoteAnonymous)
  }, [initialUserVoteAnonymous])

  useEffect(() => {
    setVerifiedVote(initialUserVoteVerified)
  }, [initialUserVoteVerified])

  useEffect(() => {
    setVoteCount(initialCount)
  }, [initialCount])

  // Sync vote state from other VoteButton instances for the same target
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<VoteSyncDetail>).detail
      if (detail.targetType === targetType && detail.targetId === targetId) {
        setVoteCount(detail.voteCount)
        if (detail.isAnonymous) setAnonVote(detail.userVote)
        else setVerifiedVote(detail.userVote)
      }
    }
    window.addEventListener(VOTE_SYNC_EVENT, handler)
    return () => window.removeEventListener(VOTE_SYNC_EVENT, handler)
  }, [targetType, targetId])

  // Cross-page vote sync via localStorage (survives client-side navigation).
  // Only applies when the server-rendered vote state is stale (differs from persisted).
  // When they match (e.g. full page reload), skip to preserve the server's fresher voteCount.
  useEffect(() => {
    const persisted = readPersistedVoteSync(targetType, targetId)
    if (persisted) {
      const serverVote = persisted.isAnonymous ? initialUserVoteAnonymous : initialUserVoteVerified
      if (persisted.userVote !== serverVote) {
        setVoteCount(initialCount + (persisted.userVote - serverVote))
        if (persisted.isAnonymous) setAnonVote(persisted.userVote)
        else setVerifiedVote(persisted.userVote)
      }
    }

    const handler = (e: StorageEvent) => {
      if (!e.key?.startsWith(VOTE_SYNC_STORAGE_PREFIX) || !e.newValue) return
      try {
        const detail = JSON.parse(e.newValue) as StoredVoteSync
        if (detail.targetType === targetType && detail.targetId === targetId) {
          setVoteCount(detail.voteCount)
          if (detail.isAnonymous) setAnonVote(detail.userVote)
          else setVerifiedVote(detail.userVote)
        }
      } catch {
        // ignore parse errors
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- omits initialCount/initialUserVote*; re-running on prop changes would fight prop-sync effects
  }, [targetType, targetId])

  const handleVote = async (direction: -1 | 1) => {
    if (!canVote) {
      toast.info("Sign in to vote.", {
        action: {
          label: "Sign in",
          onClick: () => (window.location.href = "/login"),
        },
      })
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetType,
          targetId,
          direction,
          isAnonymous,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to cast vote")
      }

      const newUserVote = payload.userVote as -1 | 0 | 1
      const newVoteCount = payload.voteCount as number
      if (isAnonymous) setAnonVote(newUserVote)
      else setVerifiedVote(newUserVote)
      setVoteCount(newVoteCount)
      broadcastVoteSync({ targetType, targetId, isAnonymous, userVote: newUserVote, voteCount: newVoteCount })
      event("vote_cast", { target_type: targetType, target_id: targetId, direction, is_anonymous: isAnonymous })
    } catch (error) {
      console.error("[VoteButton] Vote failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const styleParams: VoteStyleParams = { compact, orientation, size }
  const iconSize = getIconSize(styleParams)
  const countSize = getCountSize(styleParams)
  const buttonSizeClass = getButtonSizeClass(styleParams)
  const isCompactHorizontal = compact && orientation === "horizontal"
  const displayCount = countMode === "nonNegative" ? Math.max(0, voteCount) : voteCount

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-transparent transition-colors",
        userVote === 0 && "hover:border-border hover:bg-muted/50",
        getContainerClass(styleParams),
        userVote === 1 && "border-upvote/20 bg-upvote/10 hover:bg-upvote/15",
        userVote === -1 && "border-downvote/20 bg-downvote/10 hover:bg-downvote/15",
        className,
      )}
    >
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => handleVote(1)}
        className={cn(
          "text-muted-foreground hover:text-upvote flex touch-manipulation items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-60",
          buttonSizeClass,
        )}
        aria-label="Upvote"
      >
        <ArrowBigUp className={cn(iconSize, userVote === 1 && "fill-upvote text-upvote")} />
      </button>
      <span
        className={cn(
          "text-center font-semibold tabular-nums",
          isCompactHorizontal ? "min-w-3" : "min-w-4",
          countSize,
          userVote === 1 && "text-upvote",
          userVote === -1 && "text-downvote",
          userVote === 0 && "text-muted-foreground",
        )}
      >
        {displayCount}
      </span>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => handleVote(-1)}
        className={cn(
          "text-muted-foreground hover:text-downvote flex touch-manipulation items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-60",
          buttonSizeClass,
        )}
        aria-label="Downvote"
      >
        <ArrowBigDown className={cn(iconSize, userVote === -1 && "fill-downvote text-downvote")} />
      </button>
    </div>
  )
}
