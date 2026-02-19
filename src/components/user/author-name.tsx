import Link from "next/link"

import type { User } from "@/lib"
import { cn } from "@/lib"

export function AuthorName({ user, className }: { user: User; className?: string }) {
  if (user.isAnonymous) {
    return <span className={cn("text-foreground font-medium", className)}>{user.displayName}</span>
  }
  return (
    <Link href={`/u/${user.username}`} className={cn("text-foreground hover:text-primary font-medium", className)}>
      {user.displayName}
    </Link>
  )
}
