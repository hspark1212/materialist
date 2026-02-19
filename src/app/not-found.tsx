import Link from "next/link"

import { Button } from "@/components/ui/button"
import { sections } from "@/lib/sections"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Page not found. The page you're looking for doesn't exist or has been
        moved.
      </p>

      <Button asChild className="mt-8">
        <Link href="/">Go Home</Link>
      </Button>

      <nav className="mt-10">
        <p className="text-sm font-medium text-muted-foreground">
          Or browse a section
        </p>
        <ul className="mt-3 flex flex-wrap justify-center gap-3">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <li key={section.key}>
                <Button variant="outline" size="sm" asChild>
                  <Link href={section.href}>
                    <Icon
                      className="size-4"
                      style={{ color: section.color }}
                    />
                    {section.label}
                  </Link>
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
