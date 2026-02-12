"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FileText,
  Home,
  MessageSquare,
  Plus,
  User,
} from "lucide-react"

import { cn } from "@/lib"
import { useAuth } from "@/lib/auth"

export function BottomNav() {
  const pathname = usePathname()
  const { profile } = useAuth()

  const profileHref = profile ? `/u/${profile.username}` : "/u/me"

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/papers", icon: FileText, label: "Papers" },
    { href: "/forum", icon: MessageSquare, label: "Forum" },
    { href: "/create", icon: Plus, label: "Create", isCreate: true },
    { href: "/insights", icon: BarChart3, label: "Stats" },
    { href: profileHref, icon: User, label: "Profile" },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-safe backdrop-blur-md md:hidden">
      <ul className="flex h-14 items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          if (item.isCreate) {
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-0.5 touch-manipulation"
                  aria-label={item.label}
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <Icon className="size-6" />
                  </span>
                </Link>
              </li>
            )
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg px-3 transition-colors touch-manipulation",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:bg-accent"
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
