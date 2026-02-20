"use client"

import Link from "next/link"
import { Component, type ErrorInfo, type FormEvent, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { ChevronDown, LogIn, LogOut, Menu, Moon, Plus, Search, Settings, ShieldCheck, Sun, User, X } from "lucide-react"

import { cn } from "@/lib"
import { useAuth } from "@/lib/auth"
import { useIdentity } from "@/lib/identity"
import { sections } from "@/lib/sections"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { LeftSidebar } from "@/components/layout/left-sidebar"
import { MobileSearch } from "@/components/layout/mobile-search"
import { UserAvatar } from "@/components/user/user-avatar"
import { CrystalLogo } from "@/components/brand/crystal-logo"
import { LogoText } from "@/components/brand/logo-text"
import { IdentitySwitch } from "@/components/layout/identity-switch"
import { NotificationBell } from "@/features/notifications/presentation/notification-bell"
import { useIsHydrated } from "@/hooks/use-is-hydrated"
import { useSearchFilter } from "@/features/posts/presentation/use-search-filter"

// Error boundary to prevent avatar crashes from hiding the entire profile menu
class AvatarErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("AvatarErrorBoundary caught:", error, info)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

export function Header() {
  const pathname = usePathname()
  const { status, user, signOut } = useAuth()
  const { activeQuery, submitSearch } = useSearchFilter()
  const { isAnonymousMode, activeUser, switchMode } = useIdentity()
  const isHydrated = useIsHydrated()

  const avatarFallback = <User className="text-muted-foreground size-5" />
  const effectiveStatus = isHydrated ? status : "loading"
  const isLoading = effectiveStatus === "loading"
  const showSignedInMenu = effectiveStatus === "authenticated" || effectiveStatus === "verified"

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    submitSearch(String(formData.get("q") ?? ""))
  }

  return (
    <header className="bg-card border-border fixed inset-x-0 top-0 z-50 h-[var(--header-height)] border-b">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 md:px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="min-h-11 min-w-11 md:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-border flex items-center justify-end border-b px-2 py-2">
                <SheetClose asChild>
                  <Button variant="ghost" size="icon-sm" className="min-h-11 min-w-11" aria-label="Close menu">
                    <X className="size-5" />
                  </Button>
                </SheetClose>
              </div>
              <div className="min-h-0 flex-1">
                <LeftSidebar inSheet />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center gap-2">
          <CrystalLogo size="md" className="text-primary" />
          <LogoText size="sm" className="hidden min-[420px]:inline" />
        </Link>

        {/* Mobile Mode Pill Dropdown (md:hidden) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "border-border bg-muted/60 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                "hover:bg-muted min-h-8 transition-colors md:hidden",
              )}
            >
              {isHydrated && isAnonymousMode ? (
                <>
                  <Moon className="size-3.5" />
                  <span>A</span>
                </>
              ) : (
                <>
                  <Sun className="size-3.5" />
                  <span>V</span>
                </>
              )}
              <ChevronDown className="text-muted-foreground size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <div className="px-2 py-1.5">
              <p className="text-muted-foreground text-[11px]">Choose how others see you</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={isAnonymousMode ? "anonymous" : "verified"}
              onValueChange={(v) => switchMode(v as "verified" | "anonymous")}
            >
              <DropdownMenuRadioItem value="verified">
                <Sun className="size-4" />
                Verified
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="anonymous">
                <Moon className="size-4" />
                Anonymous
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Desktop IdentitySwitch */}
        <div className="hidden md:contents">
          <IdentitySwitch isAnonymousMode={isAnonymousMode} onSwitch={switchMode} />
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {sections.map((section) => {
            const isActive = pathname === section.href || pathname.startsWith(section.href + "/")
            const Icon = section.icon
            return (
              <Link
                key={section.key}
                href={section.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden lg:inline">{section.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mx-2 hidden flex-1 md:block">
          <form className="relative" onSubmit={handleSearchSubmit}>
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              name="q"
              type="search"
              placeholder="Search papers, discussions, and tools"
              className="bg-background/60 pl-9"
              defaultValue={activeQuery ?? ""}
              key={activeQuery ?? "__empty_query"}
            />
          </form>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <MobileSearch />

          <Button asChild variant="default" size="sm" className="hidden md:inline-flex">
            <Link href="/create">
              <Plus className="size-4" />
              <span className="hidden xl:inline">Create</span>
            </Link>
          </Button>

          {showSignedInMenu && <NotificationBell enabled={showSignedInMenu} />}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-9 rounded-full p-0" aria-label="User menu">
                {isLoading ? (
                  <div className="bg-muted size-8 animate-pulse rounded-full" />
                ) : activeUser || user ? (
                  <AvatarErrorBoundary fallback={avatarFallback}>
                    <UserAvatar user={(activeUser || user)!} size="md" />
                  </AvatarErrorBoundary>
                ) : (
                  avatarFallback
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {showSignedInMenu ? (
                <>
                  <div className="px-2 py-1.5">
                    <p className="text-muted-foreground text-xs">
                      {isAnonymousMode ? "Anonymous mode" : "Verified mode"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {user ? (
                    <DropdownMenuItem asChild>
                      <Link href={`/u/${user.username}`} className="cursor-pointer">
                        <User className="size-4" />
                        View Profile
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem asChild>
                    <Link href="/settings#verification" className="cursor-pointer">
                      <ShieldCheck className="size-4" />
                      Verification
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="size-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="size-4" />
                    Sign Out
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link
                    href={pathname === "/" ? "/login" : `/login?returnTo=${encodeURIComponent(pathname)}`}
                    className="cursor-pointer"
                  >
                    <LogIn className="size-4" />
                    Sign In
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
