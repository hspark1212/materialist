"use client"

import { useState } from "react"
import { ArrowBigDown, ArrowBigUp, ThumbsUp } from "lucide-react"

import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib"

type VoteButtonProps = {
  targetType: "post" | "comment"
  targetId: string
  initialCount: number
  initialUserVote?: -1 | 0 | 1
  orientation?: "vertical" | "horizontal"
  size?: "default" | "sm"
  compact?: boolean
  hideDownvote?: boolean
  countMode?: "net" | "nonNegative"
  countLabel?: string
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
    return compact
      ? "flex-row gap-0.5 px-0 py-0 md:gap-1 md:px-1 md:py-0.5"
      : "flex-row px-1 py-0.5"
  }

  return compact
    ? "w-9 flex-col gap-0.5 py-0.5 md:w-12 md:gap-1.5 md:py-1"
    : "w-12 flex-col py-1"
}

export function VoteButton({
  targetType,
  targetId,
  initialCount,
  initialUserVote = 0,
  orientation = "vertical",
  size = "default",
  compact = false,
  hideDownvote = false,
  countMode = "net",
  countLabel,
  className,
}: VoteButtonProps) {
  const { status } = useAuth()
  const [userVote, setUserVote] = useState<-1 | 0 | 1>(initialUserVote)
  const [voteCount, setVoteCount] = useState(initialCount)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canVote = status !== "loading" && status !== "anonymous"

  const handleVote = async (direction: -1 | 1) => {
    if (!canVote) {
      toast.info("Sign in to vote.")
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
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to cast vote")
      }

      setUserVote(payload.userVote as -1 | 0 | 1)
      setVoteCount(payload.voteCount as number)
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
  const upvoteLabel = hideDownvote ? "Like" : "Upvote"

  if (hideDownvote) {
    return (
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => handleVote(1)}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-upvote disabled:opacity-60 touch-manipulation",
          className,
        )}
        aria-label={upvoteLabel}
      >
        <ThumbsUp className={cn("size-3.5", userVote === 1 && "text-upvote")} />
        <span
          className={cn(
            "font-medium tabular-nums text-sm",
            userVote === 1 ? "text-upvote" : "text-muted-foreground",
          )}
        >
          <span className={countLabel ? "sm:hidden" : ""}>{displayCount}</span>
          {countLabel ? <span className="hidden sm:inline">{displayCount} {countLabel}</span> : null}
        </span>
      </button>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md",
        getContainerClass(styleParams),
        className,
      )}
    >
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => handleVote(1)}
        className={cn(
          "flex items-center justify-center text-muted-foreground transition-transform hover:text-upvote active:scale-95 disabled:opacity-60 touch-manipulation",
          buttonSizeClass,
        )}
        aria-label={upvoteLabel}
      >
        <ArrowBigUp className={cn(iconSize, userVote === 1 && "text-upvote")} />
      </button>
      <span
        className={cn(
          "text-center font-semibold tabular-nums",
          isCompactHorizontal ? "min-w-3" : "min-w-4",
          countSize,
          userVote === 1 && "text-upvote",
          userVote === -1 && "text-downvote",
          userVote === 0 && "text-muted-foreground"
        )}
      >
        {displayCount}
      </span>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => handleVote(-1)}
        className={cn(
          "flex items-center justify-center text-muted-foreground transition-transform hover:text-downvote active:scale-95 disabled:opacity-60 touch-manipulation",
          buttonSizeClass,
        )}
        aria-label="Downvote"
      >
        <ArrowBigDown className={cn(iconSize, userVote === -1 && "text-downvote")} />
      </button>
    </div>
  )
}
