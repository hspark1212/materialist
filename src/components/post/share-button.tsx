"use client"

import { useEffect, useRef, useState, type ComponentProps } from "react"
import { Check, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ShareButtonProps = {
  postId: string
  className?: string
  iconClassName?: string
  labelClassName?: string
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
}

const copyToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.warn(error)
    }
  }

  try {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand("copy")
    textarea.remove()
    return success
  } catch (error) {
    console.warn(error)
    return false
  }
}

export function ShareButton({
  postId,
  className,
  iconClassName,
  labelClassName = "hidden sm:inline",
  variant = "ghost",
  size = "sm",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${postId}`
    const ok = await copyToClipboard(url)
    if (!ok) return

    setCopied(true)
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={handleShare}>
      {copied ? <Check className={cn("text-primary", iconClassName)} /> : <Share2 className={iconClassName} />}
      <span className={labelClassName}>{copied ? "Copied" : "Share"}</span>
      {copied ? <span className="text-muted-foreground text-[11px] sm:hidden">Copied</span> : null}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </Button>
  )
}
