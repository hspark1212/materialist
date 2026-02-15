import Link from "next/link"

import { cn } from "@/lib/utils"

type TagLinkProps = {
  tag: string
  size?: "sm" | "md"
  className?: string
}

const sizeStyles = {
  sm: "px-1.5",
  md: "px-2",
}

export function TagLink({ tag, size = "md", className }: TagLinkProps) {
  return (
    <Link
      href={`/?tag=${encodeURIComponent(tag)}`}
      className={cn(
        "inline-flex rounded-full border border-border/70 bg-background/70 py-0.5 transition-colors hover:text-primary",
        sizeStyles[size],
        className
      )}
    >
      #{tag}
    </Link>
  )
}
