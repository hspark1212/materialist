import Link from "next/link"

import type { User } from "@/lib"
import { cn } from "@/lib"

export function AuthorName({ user, className }: { user: User; className?: string }) {
  if (user.isAnonymous) {
    return <span className={cn("font-medium text-foreground", className)}>{user.displayName}</span>
  }
  return (
    <Link href={`/u/${user.username}`} className={cn("font-medium text-foreground hover:text-primary", className)}>
      {user.displayName}
    </Link>
  )
}
