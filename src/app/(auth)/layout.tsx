export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-start px-4 pt-6 md:justify-center md:pt-0">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
