import { cn } from "@/lib"

const sizes = {
  sm: "size-5",
  md: "size-6",
  lg: "size-8",
}

interface CrystalLogoProps {
  size?: keyof typeof sizes
  className?: string
}

/**
 * Isometric cubic unit cell — atoms (filled circles) at vertices,
 * bonds (stroked lines) along edges. Uses currentColor for theming.
 */
export function CrystalLogo({ size = "md", className }: CrystalLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(sizes[size], className)}
      aria-hidden="true"
    >
      {/* Bonds (edges of the unit cell) */}
      <path
        d="M12 5L18 8.5L18 15.5L12 19L6 15.5L6 8.5Z M12 12L12 19 M12 12L6 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Accent edge - center to top-right */}
      <path
        d="M12 12L18 8.5"
        stroke="var(--brand-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Atoms (vertices) */}
      <g fill="currentColor">
        <circle cx="12" cy="5" r="1.5" />
        <circle cx="18" cy="15.5" r="1.5" />
        <circle cx="12" cy="19" r="1.5" />
        <circle cx="6" cy="15.5" r="1.5" />
        <circle cx="6" cy="8.5" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
      </g>
      {/* Accent atom - top-right */}
      <circle cx="18" cy="8.5" r="1.5" fill="var(--brand-accent)" />
    </svg>
  )
}
