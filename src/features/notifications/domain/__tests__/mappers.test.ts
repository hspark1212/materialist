import { describe, expect, it } from "vitest"

import type { NotificationWithContextRow } from "../types"
import { mapNotificationRowToNotification } from "../mappers"

function makeRow(overrides: Partial<NotificationWithContextRow> = {}): NotificationWithContextRow {
  return {
    id: "notif-1",
    recipient_id: "user-1",
    actor_id: "user-2",
    type: "comment_on_post",
    post_id: "post-1",
    comment_id: "comment-1",
    is_read: false,
    created_at: "2026-02-19T10:00:00Z",
    profiles: {
      id: "user-2",
      username: "jdoe",
      display_name: "Jane Doe",
      generated_display_name: "CryptoChemist42",
      avatar_url: "https://example.com/avatar.jpg",
      email: null,
      bio: null,
      karma: 100,
      is_anonymous: false,
      is_bot: false,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      orcid_id: null,
      orcid_name: null,
      orcid_verified_at: null,
    },
    posts: { title: "Test Post Title" },
    comments: { content: "This is a test comment", is_anonymous: false },
    ...overrides,
  }
}

describe("mapNotificationRowToNotification", () => {
  it("maps a standard notification correctly", () => {
    const result = mapNotificationRowToNotification(makeRow())

    expect(result.id).toBe("notif-1")
    expect(result.type).toBe("comment_on_post")
    expect(result.actorDisplayName).toBe("Jane Doe")
    expect(result.actorAvatar).toBe("https://example.com/avatar.jpg")
    expect(result.actorIsAnonymous).toBe(false)
    expect(result.postId).toBe("post-1")
    expect(result.postTitle).toBe("Test Post Title")
    expect(result.commentSnippet).toBe("This is a test comment")
    expect(result.isRead).toBe(false)
    expect(result.createdAt).toBe("2026-02-19T10:00:00Z")
  })

  it("masks actor identity for anonymous comments", () => {
    const result = mapNotificationRowToNotification(
      makeRow({
        comments: { content: "Anon comment", is_anonymous: true },
      }),
    )

    expect(result.actorDisplayName).toBe("Anonymous")
    expect(result.actorAvatar).toBe("")
    expect(result.actorIsAnonymous).toBe(true)
  })

  it("truncates comment content to 120 characters", () => {
    const longContent = "A".repeat(200)
    const result = mapNotificationRowToNotification(
      makeRow({
        comments: { content: longContent, is_anonymous: false },
      }),
    )

    expect(result.commentSnippet).toHaveLength(123) // 120 chars + "..."
    expect(result.commentSnippet!.endsWith("...")).toBe(true)
  })

  it("does not truncate content at or under 120 characters", () => {
    const shortContent = "A".repeat(120)
    const result = mapNotificationRowToNotification(
      makeRow({
        comments: { content: shortContent, is_anonymous: false },
      }),
    )

    expect(result.commentSnippet).toBe(shortContent)
  })

  it("handles null comment gracefully", () => {
    const result = mapNotificationRowToNotification(
      makeRow({ comments: null, comment_id: null }),
    )

    expect(result.commentSnippet).toBeNull()
    // Without a comment to check is_anonymous, actor shows real identity
    expect(result.actorIsAnonymous).toBe(false)
  })

  it("handles null profile gracefully", () => {
    const result = mapNotificationRowToNotification(
      makeRow({ profiles: null }),
    )

    expect(result.actorDisplayName).toBe("Unknown")
    expect(result.actorAvatar).toBe("")
  })

  it("handles null post gracefully", () => {
    const result = mapNotificationRowToNotification(
      makeRow({ posts: null }),
    )

    expect(result.postTitle).toBe("Deleted post")
  })

  it("unwraps array-shaped profile (Supabase join edge case)", () => {
    const result = mapNotificationRowToNotification(
      makeRow({
        profiles: [
          {
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
        ],
      }),
    )

    expect(result.actorDisplayName).toBe("Jane Doe")
  })

  it("maps reply_to_comment type", () => {
    const result = mapNotificationRowToNotification(
      makeRow({ type: "reply_to_comment" }),
    )

    expect(result.type).toBe("reply_to_comment")
  })
})
