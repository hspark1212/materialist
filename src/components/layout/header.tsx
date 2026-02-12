"use client"

import Link from "next/link"
import {
  Component,
  type ErrorInfo,
  type FormEvent,
  type ReactNode,
  useSyncExternalStore,
} from "react"
import { usePathname } from "next/navigation"
import {
  LogIn,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  User,
  LogOut,
  Sun,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib"
import { useAuth } from "@/lib/auth"
import { sections } from "@/lib/sections"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { LeftSidebar } from "@/components/layout/left-sidebar"
import { MobileSearch } from "@/components/layout/mobile-search"
import { UserAvatar } from "@/components/user/user-avatar"
import { CrystalLogo } from "@/components/brand/crystal-logo"
import { LogoText } from "@/components/brand/logo-text"
import { useSearchFilter } from "@/features/posts/presentation/use-search-filter"

// Error boundary to prevent avatar crashes from hiding the entire profile menu
class AvatarErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
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

const subscribe = () => () => {}

function useIsHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false)
}

export function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  const pathname = usePathname()
  const { status, user, signOut } = useAuth()
  const { activeQuery, submitSearch } = useSearchFilter()
  const isHydrated = useIsHydrated()

  const avatarFallback = <User className="size-5 text-muted-foreground" />
  const effectiveStatus = isHydrated ? status : "loading"
  const isLoading = effectiveStatus === "loading"
  const showSignedInMenu =
    effectiveStatus === "authenticated" || effectiveStatus === "verified"

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    submitSearch(String(formData.get("q") ?? ""))
  }

  return (
    <header className="bg-card fixed inset-x-0 top-0 z-50 h-[var(--header-height)] border-b border-border">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-2 px-3 md:px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="min-h-11 min-w-11 md:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center justify-end border-b border-border px-2 py-2">
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="min-h-11 min-w-11"
                    aria-label="Close menu"
                  >
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
          <CrystalLogo size="sm" className="text-primary" />
          <LogoText size="sm" />
        </Link>

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
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
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

          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden md:inline-flex"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Moon className="size-4 dark:hidden" />
            <Sun className="size-4 hidden dark:block" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-9 rounded-full p-0" aria-label="User menu">
                {isLoading ? (
                  <div className="size-8 animate-pulse rounded-full bg-muted" />
                ) : user ? (
                  <AvatarErrorBoundary fallback={avatarFallback}>
                    <UserAvatar user={user} size="md" />
                  </AvatarErrorBoundary>
                ) : (
                  avatarFallback
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {showSignedInMenu ? (
                <>
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
