import type { Post } from "@/lib"

const MARKDOWN_CODE_BLOCK_PATTERN = /```[\s\S]*?```/g
const MARKDOWN_INLINE_CODE_PATTERN = /`([^`]+)`/g
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\((?:[^)]+)\)/g
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((?:[^)]+)\)/g
const ARXIV_PATH_PATTERN = /arxiv\.org\/(?:abs|pdf)\/([^?#/]+?)(?:\.pdf)?\/?(?:[?#].*)?$/i

const SUB = "₀₁₂₃₄₅₆₇₈₉"
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹"
const toSub = (s: string) => s.replace(/[0-9]/g, (c) => SUB[+c])
const toSup = (s: string) => s.replace(/[0-9]/g, (c) => SUP[+c])

export type PostMetaLink = {
  key: string
  label: string
  href: string
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function trimToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

function stripLatex(content: string): string {
  return content
    .replace(/\$_\{?([^}$]+)\}?\$/g, (_m, s: string) => toSub(s))
    .replace(/\$\^\{?([^}$]+)\}?\$/g, (_m, s: string) => toSup(s))
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/_\{([^}]+)\}/g, (_m, s: string) => toSub(s))
    .replace(/\^\{([^}]+)\}/g, (_m, s: string) => toSup(s))
}

function stripMarkdown(content: string): string {
  return normalizeWhitespace(
    stripLatex(content)
      .replace(MARKDOWN_CODE_BLOCK_PATTERN, " ")
      .replace(MARKDOWN_INLINE_CODE_PATTERN, "$1")
      .replace(MARKDOWN_IMAGE_PATTERN, "$1")
      .replace(MARKDOWN_LINK_PATTERN, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/^\s*>\s?/gm, "")
      .replace(/[*_~]/g, "")
      .replace(/\r?\n+/g, " "),
  )
}

function sourceUrl(url: string | undefined): string | null {
  return trimToNull(url)
}

function isPaperPost(post: Post): boolean {
  return post.section === "papers" || post.type === "paper"
}

function extractArxivIdFromUrl(url: string): string | null {
  const match = url.match(ARXIV_PATH_PATTERN)
  const id = match?.[1]?.trim()
  return id || null
}

export function getPostPreviewText(content: string, maxLength = 280): string {
  const plain = stripMarkdown(content)
  if (!plain) return ""
  return truncate(plain, maxLength)
}

export function getPostPrimaryLink(post: Post): string | null {
  if (isPaperPost(post)) {
    return sourceUrl(post.url)
  }

  const isShowcase = post.section === "showcase" || post.type === "showcase"
  if (isShowcase) {
    return sourceUrl(post.projectUrl) ?? sourceUrl(post.url)
  }

  const isJob = post.section === "jobs" || post.type === "job"
  if (isJob) {
    return sourceUrl(post.applicationUrl) ?? sourceUrl(post.url)
  }

  return sourceUrl(post.url)
}

export function getPaperMetaLinks(post: Post): PostMetaLink[] {
  if (!isPaperPost(post)) return []

  const paperUrl = sourceUrl(post.url)
  if (!paperUrl) return []

  const arxivId = extractArxivIdFromUrl(paperUrl)
  if (arxivId) {
    return [{
      key: `arxiv:${arxivId}`,
      label: `arXiv ${arxivId}`,
      href: `https://arxiv.org/abs/${arxivId}`,
    }]
  }

  return [{
    key: `paper:${paperUrl}`,
    label: truncate(paperUrl, 42),
    href: paperUrl,
  }]
}
