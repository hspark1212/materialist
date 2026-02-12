import { Badge } from "@/components/ui/badge"

type OrcidBadgeProps = {
  orcidId?: string
}

export function OrcidIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M256 128c0 70.7-57.3 128-128 128S0 198.7 0 128 57.3 0 128 0s128 57.3 128 128z"
        fill="#A6CE39"
      />
      <path
        d="M86.3 186.2H70.9V79.1h15.4v107.1zm22.2 0h42.6c52.4 0 61.5-43.3 61.5-53.6 0-32.5-22-53.6-56.8-53.6h-47.3v107.2zm15.4-93h26.5c37.2 0 42.4 26.3 42.4 39.4 0 21.4-11.8 39.3-42.4 39.3h-26.5V93.2zM108.5 64c-5.7 0-10.3 4.6-10.3 10.3s4.6 10.3 10.3 10.3 10.3-4.6 10.3-10.3-4.6-10.3-10.3-10.3z"
        fill="#fff"
      />
    </svg>
  )
}

export function OrcidBadge({ orcidId }: OrcidBadgeProps) {
  if (!orcidId) return null

  return (
    <Badge variant="outline" asChild>
      <a
        href={`https://orcid.org/${orcidId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1"
      >
        <OrcidIcon className="size-3.5" />
        <span>Verified</span>
      </a>
    </Badge>
  )
}
