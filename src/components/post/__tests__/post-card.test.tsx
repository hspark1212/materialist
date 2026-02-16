import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { Post } from "@/lib"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock auth context
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: null, status: "anonymous" }),
}))

const mockPost: Post = {
  id: "test-post-1",
  title: "Test Post Title",
  content: "Test content for the post",
  author: {
    id: "user-1",
    username: "testuser",
    displayName: "Test User",
    avatar: "https://example.com/avatar.png",
    email: "test@example.com",
    isAnonymous: false,
    isBot: false,
    karma: 100,
    joinDate: "2024-01-01",
  },
  section: "forum",
  voteCount: 10,
  commentCount: 5,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  tags: [],
  isAnonymous: false,
  type: "text",
  userVote: 0,
}

// Import after mocks
const { PostCard } = await import("../post-card")
const { PostCardCompact } = await import("../post-card-compact")

afterEach(() => {
  cleanup()
})

describe("PostCard", () => {
  it("renders tags when present", () => {
    const post = { ...mockPost, tags: ["dft", "vasp", "ml"] }
    render(<PostCard post={post} />)

    expect(screen.getByText("#dft")).toBeInTheDocument()
    expect(screen.getByText("#vasp")).toBeInTheDocument()
    expect(screen.getByText("#ml")).toBeInTheDocument()
  })

  it("does not render tags section when empty", () => {
    const post = { ...mockPost, tags: [] }
    render(<PostCard post={post} />)

    expect(screen.queryByText("#dft")).not.toBeInTheDocument()
  })
})

describe("PostCardCompact", () => {
  it("renders tags when present", () => {
    const post = { ...mockPost, tags: ["dft", "vasp"] }
    render(<PostCardCompact post={post} />)

    expect(screen.getByText("#dft")).toBeInTheDocument()
    expect(screen.getByText("#vasp")).toBeInTheDocument()
  })

  it("does not render tags section when empty", () => {
    const post = { ...mockPost, tags: [] }
    render(<PostCardCompact post={post} />)

    expect(screen.queryByText("#dft")).not.toBeInTheDocument()
  })
})
