import { describe, expect, it, vi } from "vitest"

import { listNotificationsUseCase, getUnreadCountUseCase, markAsReadUseCase } from "../use-cases"
import type { NotificationsRepository } from "../ports"

function makeRepository(): NotificationsRepository {
  return {
    listNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  }
}

const sampleRow = {
  id: "notif-1",
  recipient_id: "user-1",
  actor_id: "user-2",
  type: "comment_on_post" as const,
  post_id: "post-1",
  comment_id: "comment-1",
  is_read: false,
  created_at: "2026-02-19T10:00:00Z",
  profiles: {
    id: "user-2",
    username: "jdoe",
    display_name: "Jane Doe",
    generated_display_name: null,
    avatar_url: null,
    email: null,
    bio: null,
    karma: 0,
    is_anonymous: false,
    is_bot: false,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    orcid_id: null,
    orcid_name: null,
    orcid_verified_at: null,
  },
  posts: { title: "Test Post" },
  comments: { content: "Hello", is_anonymous: false },
}

describe("listNotificationsUseCase", () => {
  it("fetches and maps notifications", async () => {
    const repo = makeRepository()
    vi.mocked(repo.listNotifications).mockResolvedValue([sampleRow])

    const result = await listNotificationsUseCase(repo, "user-1", 20, 0)

    expect(repo.listNotifications).toHaveBeenCalledWith("user-1", 20, 0)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("notif-1")
    expect(result[0].actorDisplayName).toBe("Jane Doe")
    expect(result[0].postTitle).toBe("Test Post")
  })
})

describe("getUnreadCountUseCase", () => {
  it("returns unread count", async () => {
    const repo = makeRepository()
    vi.mocked(repo.getUnreadCount).mockResolvedValue(5)

    const result = await getUnreadCountUseCase(repo, "user-1")

    expect(repo.getUnreadCount).toHaveBeenCalledWith("user-1")
    expect(result).toBe(5)
  })
})

describe("markAsReadUseCase", () => {
  it("marks specific notification ids as read", async () => {
    const repo = makeRepository()
    vi.mocked(repo.markAsRead).mockResolvedValue(2)

    const result = await markAsReadUseCase(repo, "user-1", ["notif-1", "notif-2"])

    expect(repo.markAsRead).toHaveBeenCalledWith("user-1", ["notif-1", "notif-2"])
    expect(result).toBe(2)
  })

  it("marks all notifications as read when 'all' is passed", async () => {
    const repo = makeRepository()
    vi.mocked(repo.markAllAsRead).mockResolvedValue(10)

    const result = await markAsReadUseCase(repo, "user-1", "all")

    expect(repo.markAllAsRead).toHaveBeenCalledWith("user-1")
    expect(result).toBe(10)
  })
})
