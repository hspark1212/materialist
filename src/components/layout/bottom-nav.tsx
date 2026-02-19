"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { BarChart3, Grid2x2, Home, Plus, User } from "lucide-react"

import { cn } from "@/lib"
import { useAuth } from "@/lib/auth"
import { sections } from "@/lib/sections"

export function BottomNav() {
  const pathname = usePathname()
  const { profile } = useAuth()
  const [sectionsOpenOnPath, setSectionsOpenOnPath] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const profileHref = mounted && profile ? `/u/${profile.username}` : "/login"
  const isSectionsOpen = sectionsOpenOnPath === pathname
  const closeSections = () => setSectionsOpenOnPath(null)
  const isPathActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)
  const currentSection = sections.find((section) => isPathActive(section.href)) ?? null
  const isSectionsActive = currentSection !== null
  const isHomeActive = pathname === "/"
  const isCreateActive = pathname === "/create"
  const sectionsLabel = currentSection?.label ?? "Sections"
  const SectionsIcon = currentSection?.icon ?? Grid2x2
  const isProfileActive = pathname.startsWith("/u/")
  const isInsightsActive = pathname === "/insights"

  const baseNavClassName =
    "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg px-3 transition-colors touch-manipulation"

  return (
    <>
      {isSectionsOpen ? (
        <button
          type="button"
          aria-label="Close panel"
          className="fixed inset-0 z-40 bg-transparent md:hidden"
          onClick={closeSections}
        />
      ) : null}

      <div
        id="mobile-sections-panel"
        className={cn(
          "fixed inset-x-2 z-[55] md:hidden",
          "bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] transition-all duration-200",
          isSectionsOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        )}
      >
        <ul className="grid grid-cols-4 gap-2 rounded-xl border border-border bg-card/95 p-2 shadow-lg backdrop-blur-md">
          {sections.map((section) => {
            const isCurrentSection = isPathActive(section.href)
            const Icon = section.icon

            return (
              <li key={section.key}>
                <Link
                  href={section.href}
                  onClick={closeSections}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md border px-1 py-1.5 text-[11px] font-medium",
                    "transition-colors touch-manipulation",
                    isCurrentSection
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/70 bg-background/70 text-foreground/85 active:bg-accent"
                  )}
                >
                  <Icon
                    className="size-4 shrink-0"
                    style={{ color: section.color }}
                  />
                  <span>{section.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-safe backdrop-blur-md md:hidden">
        <ul className="flex h-14 items-center justify-around">
          <li>
            <Link
              href="/"
              onClick={closeSections}
              className={cn(
                baseNavClassName,
                isHomeActive
                  ? "text-primary"
                  : "text-muted-foreground active:bg-accent"
              )}
              aria-label="Home"
              aria-current={isHomeActive ? "page" : undefined}
            >
              <Home className="size-5" />
              <span className="text-[10px] font-medium">Home</span>
            </Link>
          </li>

          <li>
            <button
              type="button"
              className={cn(
                baseNavClassName,
                isSectionsActive || isSectionsOpen
                  ? "text-primary"
                  : "text-muted-foreground active:bg-accent"
              )}
              aria-current={isSectionsActive ? "page" : undefined}
              aria-expanded={isSectionsOpen}
              aria-controls="mobile-sections-panel"
              aria-label="Sections navigation"
              onClick={() => {
                setSectionsOpenOnPath((prev) => (prev === pathname ? null : pathname))
              }}
            >
              <SectionsIcon className="size-5" />
              <span className="text-[10px] font-medium">{sectionsLabel}</span>
            </button>
          </li>

          <li>
            <Link
              href="/create"
              onClick={closeSections}
              className="flex flex-col items-center justify-center gap-0.5 touch-manipulation"
              aria-label="Create"
              aria-current={isCreateActive ? "page" : undefined}
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Plus className="size-6" />
              </span>
            </Link>
          </li>

          <li>
            <Link
              href="/insights"
              onClick={closeSections}
              className={cn(
                baseNavClassName,
                isInsightsActive
                  ? "text-primary"
                  : "text-muted-foreground active:bg-accent"
              )}
              aria-label="Insights"
              aria-current={isInsightsActive ? "page" : undefined}
            >
              <BarChart3 className="size-5" />
              <span className="text-[10px] font-medium">Insights</span>
            </Link>
          </li>

          <li>
            <Link
              href={profileHref}
              onClick={closeSections}
              className={cn(
                baseNavClassName,
                isProfileActive
                  ? "text-primary"
                  : "text-muted-foreground active:bg-accent"
              )}
              aria-label="Profile"
              aria-current={isProfileActive ? "page" : undefined}
            >
              <User className="size-5" />
              <span className="text-[10px] font-medium">Profile</span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  )
}
