import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib"
import { useIsHydrated } from "@/hooks/use-is-hydrated"
import type { IdentityMode } from "@/lib/identity/types"

type IdentitySwitchProps = {
  isAnonymousMode: boolean
  onSwitch: (mode: IdentityMode) => void
  fullWidth?: boolean
}

export function IdentitySwitch({ isAnonymousMode, onSwitch, fullWidth }: IdentitySwitchProps) {
  const hydrated = useIsHydrated()

  const isAnon = hydrated ? isAnonymousMode : true

  return (
    <div className={cn(
      "flex items-center rounded-full p-0.5",
      fullWidth ? "w-full gap-1" : "border border-border bg-muted/60",
    )}>
      <button
        type="button"
        onClick={() => onSwitch("verified")}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
          fullWidth && "flex-1 py-1.5 text-sm",
          !isAnon
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Sun className={cn("size-3.5", fullWidth && "size-4")} />
        <span>Verified</span>
      </button>

      <button
        type="button"
        onClick={() => onSwitch("anonymous")}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
          fullWidth && "flex-1 py-1.5 text-sm",
          isAnon
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Moon className={cn("size-3.5", fullWidth && "size-4")} />
        <span>Anonymous</span>
      </button>
    </div>
  )
}
