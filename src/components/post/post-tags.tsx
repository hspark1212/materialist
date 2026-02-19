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
        "border-border/70 bg-background/70 hover:text-primary inline-flex rounded-full border py-0.5 transition-colors",
        sizeStyles[size],
        className,
      )}
    >
      #{tag}
    </Link>
  )
}
