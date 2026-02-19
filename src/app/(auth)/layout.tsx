import Link from "next/link"
import { CrystalLogo } from "@/components/brand/crystal-logo"
import { LogoText } from "@/components/brand/logo-text"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <CrystalLogo size="md" className="text-primary" />
          <LogoText size="md" />
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
