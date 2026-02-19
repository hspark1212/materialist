import type { ReactNode } from "react"

type ThreeColumnLayoutProps = {
  leftSidebar: ReactNode
  rightSidebar: ReactNode
  children: ReactNode
}

export function ThreeColumnLayout({ leftSidebar, rightSidebar, children }: ThreeColumnLayoutProps) {
  return (
    <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 md:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)_20rem]">
      <aside className="border-border/70 hidden border-r md:block">{leftSidebar}</aside>

      <main className="min-h-[calc(100vh-var(--header-height))] px-3 pt-1 pb-20 md:px-5 md:pt-4 md:pb-4">
        {children}
      </main>

      <aside className="hidden px-4 xl:block">{rightSidebar}</aside>
    </div>
  )
}
