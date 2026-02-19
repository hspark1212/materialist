import { FileText, MessageSquare, Rocket, Briefcase, type LucideIcon } from "lucide-react"

import type { ForumFlair, JobType, Section, ShowcaseType } from "./types"

export type SectionMeta = {
  key: Section
  label: string
  href: string
  icon: LucideIcon
  color: string
  description: string
}

export const sections: SectionMeta[] = [
  {
    key: "papers",
    label: "Papers",
    href: "/papers",
    icon: FileText,
    color: "var(--section-papers)",
    description: "Paper discussions, source links, AI summaries, and citations",
  },
  {
    key: "forum",
    label: "Forum",
    href: "/forum",
    icon: MessageSquare,
    color: "var(--section-forum)",
    description: "Free discussion — questions, career advice, news, and community topics",
  },
  {
    key: "showcase",
    label: "Showcase",
    href: "/showcase",
    icon: Rocket,
    color: "var(--section-showcase)",
    description: "Show Materialist — share your tools, datasets, models, and projects",
  },
  {
    key: "jobs",
    label: "Jobs",
    href: "/jobs",
    icon: Briefcase,
    color: "var(--section-jobs)",
    description: "Job postings — postdoc, PhD, industry, and internship opportunities",
  },
]

export const sectionByKey: Record<Section, SectionMeta> = Object.fromEntries(sections.map((s) => [s.key, s])) as Record<
  Section,
  SectionMeta
>

export function getSectionLabel(section: Section): string {
  return sectionByKey[section]?.label ?? section
}

export function getSectionHref(section: Section): string {
  return sectionByKey[section]?.href ?? "/"
}

export type FlairMeta = {
  key: ForumFlair
  label: string
  className: string
}

export const forumFlairs: FlairMeta[] = [
  {
    key: "discussion",
    label: "Discussion",
    className: "bg-[var(--flair-discussion)]/20 text-[var(--flair-discussion)]",
  },
  {
    key: "question",
    label: "Question",
    className: "bg-[var(--flair-question)]/20 text-[var(--flair-question)]",
  },
  {
    key: "career",
    label: "Career",
    className: "bg-[var(--flair-career)]/20 text-[var(--flair-career)]",
  },
  {
    key: "news",
    label: "News",
    className: "bg-[var(--flair-news)]/20 text-[var(--flair-news)]",
  },
]

export const flairByKey: Record<ForumFlair, FlairMeta> = Object.fromEntries(
  forumFlairs.map((f) => [f.key, f]),
) as Record<ForumFlair, FlairMeta>

export const jobTypeLabels: Record<JobType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  remote: "Remote",
  internship: "Internship",
  postdoc: "Postdoc",
  phd: "PhD Position",
}

export const showcaseTypeLabels: Record<ShowcaseType, string> = {
  tool: "Tool",
  dataset: "Dataset",
  model: "Model",
  library: "Library",
  workflow: "Workflow",
}

export const showcaseTypeFilters: ShowcaseType[] = ["tool", "dataset", "model", "library", "workflow"]

export const jobLocationFilters = ["Remote", "USA", "Europe", "Asia", "Global"]
