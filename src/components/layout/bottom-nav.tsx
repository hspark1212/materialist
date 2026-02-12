"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Grid2x2, Home, Lock, Moon, Plus, Sun, User } from "lucide-react"

import { cn } from "@/lib"
import { useAuth } from "@/lib/auth"
import { useIdentity } from "@/lib/identity"
import { useIsHydrated } from "@/hooks/use-is-hydrated"
import { sections } from "@/lib/sections"

export function BottomNav() {
  const pathname = usePathname()
  const { profile } = useAuth()
  const { isAnonymousMode, canUseVerifiedMode, switchMode } = useIdentity()
  const hydrated = useIsHydrated()
  const [sectionsOpenOnPath, setSectionsOpenOnPath] = useState<string | null>(null)
  const [modeOpenOnPath, setModeOpenOnPath] = useState<string | null>(null)

  const profileHref = profile ? `/u/${profile.username}` : "/u/me"
  const isSectionsOpen = sectionsOpenOnPath === pathname
  const isModeOpen = modeOpenOnPath === pathname
  const closeSections = () => setSectionsOpenOnPath(null)
  const closeMode = () => setModeOpenOnPath(null)
  const closeAll = () => { closeSections(); closeMode() }
  const isPathActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)
  const currentSection = sections.find((section) => isPathActive(section.href)) ?? null
  const isSectionsActive = currentSection !== null
  const isHomeActive = pathname === "/"
  const isCreateActive = pathname === "/create"
  const sectionsLabel = currentSection?.label ?? "Sections"
  const SectionsIcon = currentSection?.icon ?? Grid2x2
  const isProfileActive = pathname.startsWith("/u/")

  const baseNavClassName =
    "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg px-3 transition-colors touch-manipulation"

  const showLock = hydrated && !canUseVerifiedMode

  const modeOptions = [
    {
      key: "verified" as const,
      label: "Verified",
      icon: showLock ? Lock : Sun,
      active: hydrated && !isAnonymousMode,
      locked: showLock,
    },
    {
      key: "anonymous" as const,
      label: "Anonymous",
      icon: Moon,
      active: hydrated && isAnonymousMode,
      locked: false,
    },
  ]

  return (
    <>
      {(isSectionsOpen || isModeOpen) ? (
        <button
          type="button"
          aria-label="Close panel"
          className="fixed inset-0 z-40 bg-transparent md:hidden"
          onClick={closeAll}
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
                  onClick={closeAll}
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

      <div
        id="mobile-mode-panel"
        className={cn(
          "fixed inset-x-2 z-[55] md:hidden",
          "bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] transition-all duration-200",
          isModeOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        )}
      >
        <ul className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card/95 p-2 shadow-lg backdrop-blur-md">
          {modeOptions.map((option) => {
            const Icon = option.icon
            return (
              <li key={option.key}>
                <button
                  type="button"
                  onClick={() => {
                    switchMode(option.key)
                    if (!option.locked) closeAll()
                  }}
                  className={cn(
                    "flex w-full min-h-12 flex-col items-center justify-center gap-1 rounded-md border px-1 py-1.5 text-[11px] font-medium",
                    "transition-colors touch-manipulation",
                    option.locked && "opacity-50",
                    option.active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/70 bg-background/70 text-foreground/85 active:bg-accent"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{option.label}</span>
                </button>
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
              onClick={closeAll}
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
                closeMode()
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
              onClick={closeAll}
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
            <button
              type="button"
              className={cn(
                baseNavClassName,
                isModeOpen
                  ? "text-primary"
                  : "text-muted-foreground active:bg-accent"
              )}
              aria-expanded={isModeOpen}
              aria-controls="mobile-mode-panel"
              aria-label="Identity mode"
              onClick={() => {
                closeSections()
                setModeOpenOnPath((prev) => (prev === pathname ? null : pathname))
              }}
            >
              {hydrated && isAnonymousMode ? (
                <Moon className="size-5" />
              ) : (
                <Sun className="size-5" />
              )}
              <span className="text-[10px] font-medium">Mode</span>
            </button>
          </li>

          <li>
            <Link
              href={profileHref}
              onClick={closeAll}
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
