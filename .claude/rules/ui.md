# UI Rules

## Tailwind v4
- CSS-only config. All theming lives in `src/app/globals.css` via `@theme inline {}` block (36+ variable mappings) and CSS custom properties in `:root` / `.dark`. There is no `tailwind.config.ts`.
- CSS variables are the single source of truth for colors, radius, fonts, and layout (e.g. `--header-height`, `--section-papers`, `--upvote`, `--radius`).
- Fonts: IBM Plex Sans (body via `--font-ibm-plex-sans`), JetBrains Mono (code via `--font-jetbrains-mono`).

## shadcn/ui
- 20 components in `src/components/ui/` — all read-only. Never edit them directly.
- Customize by wrapping or overriding with Tailwind classes in consuming components.
- Component conventions: `data-slot` attributes for CSS targeting, `data-variant`/`data-size` for state styling, CVA for type-safe variants, `cn()` for class merging.

## Hydration
- `suppressHydrationWarning` is on `<html>` in `src/app/layout.tsx`. Time-based rendering (`formatDistanceToNow`) used in 6+ components — hydration errors not caught by lint/build, check browser console.

## Custom Utilities
- Mobile safe-area: `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe` (via `@utility` in globals.css)
- `scrollbar-hide` — hides scrollbar on horizontal scroll containers
- `.prose-materialist` / `.prose-compact` — markdown rendering styles with KaTeX support
- `.avatar-verified-ring` / `.avatar-bot-ring` — animated/gradient avatar borders

## Props
- When removing a prop from a component, grep all usages across the codebase first.
