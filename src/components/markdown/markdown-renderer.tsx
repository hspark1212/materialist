"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import rehypeKatex from "rehype-katex"

import { sanitizeUrl } from "@/lib/url"
import { cn } from "@/lib/utils"

type MarkdownRendererProps = {
  content: string
  className?: string
  compact?: boolean
}

export function MarkdownRenderer({ content, className, compact = false }: MarkdownRendererProps) {
  return (
    <div className={cn("prose-materialist", compact && "prose-compact", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          h4: ({ children }) => <h4>{children}</h4>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          a: ({ href, children }) => {
            const safeHref = sanitizeUrl(href)
            if (!safeHref) return <span>{children}</span>
            return (
              <a href={safeHref} target="_blank" rel="noreferrer">
                {children}
              </a>
            )
          },
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          del: ({ children }) => <del>{children}</del>,
          blockquote: ({ children }) => <blockquote>{children}</blockquote>,
          code: ({ className, children }) => {
            const isInline = !className || !className.startsWith("language-")
            if (isInline) {
              return <code>{children}</code>
            }
            return <code className={className}>{children}</code>
          },
          pre: ({ children }) => <pre>{children}</pre>,
          table: ({ children }) => <table>{children}</table>,
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => <td>{children}</td>,
          hr: () => <hr />,
          img: ({ src, alt }) => {
            const safeSrc = typeof src === "string" ? sanitizeUrl(src) : undefined
            if (!safeSrc) return null
            return <img src={safeSrc} alt={alt || ""} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
