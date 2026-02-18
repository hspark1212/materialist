"use client"

import katex from "katex"

export function InlineLatex({ content }: { content: string }) {
  if (!content.includes("$")) return <>{content}</>

  const parts = content.split(/\$([^$]+)\$/)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 0 ? (
          part
        ) : (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part, { throwOnError: false }),
            }}
          />
        ),
      )}
    </>
  )
}
