import type { User } from "@/lib/types"

export type IdentityMode = "verified" | "anonymous"

export interface IdentityContextValue {
  mode: IdentityMode
  isAnonymousMode: boolean
  activeUser: User | null
  canUseVerifiedMode: boolean
  isVerificationDialogOpen: boolean
  switchMode: (mode: IdentityMode) => void
  requestVerification: () => void
  closeVerificationDialog: () => void
}
