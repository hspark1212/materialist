import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { Notification } from "../../domain/types"

// Stub next/link as a plain <a> tag
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { NotificationItem } from "../notification-item"

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notif-1",
    type: "comment_on_post",
    actorDisplayName: "Jane Doe",
    actorAvatar: "https://example.com/avatar.jpg",
    actorIsAnonymous: false,
    postId: "post-1",
    postTitle: "Test Post",
    commentSnippet: "A test comment",
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("NotificationItem", () => {
  const onRead = vi.fn()

  it("renders comment_on_post with 'commented on' text", () => {
    render(<NotificationItem notification={makeNotification()} onRead={onRead} />)

    expect(screen.getByText("commented on")).toBeInTheDocument()
  })

  it("renders reply_to_comment with 'replied to your comment on' text", () => {
    render(<NotificationItem notification={makeNotification({ type: "reply_to_comment" })} onRead={onRead} />)

    expect(screen.getByText("replied to your comment on")).toBeInTheDocument()
  })

  it("renders comment_on_voted_post with voted-post text and vote icon", () => {
    render(<NotificationItem notification={makeNotification({ type: "comment_on_voted_post" })} onRead={onRead} />)

    expect(screen.getByText(/commented on a post you voted on:/)).toBeInTheDocument()
  })

  it("shows unread indicator and background for unread notifications", () => {
    const { container } = render(<NotificationItem notification={makeNotification({ isRead: false })} onRead={onRead} />)

    const link = container.querySelector("a")!
    expect(link.className).toContain("bg-primary/[0.04]")
    // Blue dot exists
    const dot = container.querySelector(".bg-primary.rounded-full")
    expect(dot).toBeInTheDocument()
  })

  it("hides unread indicator and background for read notifications", () => {
    const { container } = render(<NotificationItem notification={makeNotification({ isRead: true })} onRead={onRead} />)

    const link = container.querySelector("a")!
    expect(link.className).not.toContain("bg-primary/[0.04]")
    // No blue dot
    const dot = container.querySelector(".bg-primary.rounded-full")
    expect(dot).not.toBeInTheDocument()
  })
})
