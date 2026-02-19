import type { Notification, NotificationWithContextRow } from "./types"

function unwrapSingle<T>(raw: T | T[] | null): T | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  return raw
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + "..."
}

export function mapNotificationRowToNotification(
  row: NotificationWithContextRow,
): Notification {
  const profile = unwrapSingle(row.profiles)
  const post = unwrapSingle(row.posts)
  const comment = unwrapSingle(row.comments)

  // If the comment was posted anonymously, mask the actor identity
  const isAnonymousComment = comment?.is_anonymous ?? false

  return {
    id: row.id,
    type: row.type,
    actorDisplayName: isAnonymousComment
      ? "Anonymous"
      : (profile?.display_name ?? "Unknown"),
    actorAvatar: isAnonymousComment ? "" : (profile?.avatar_url ?? ""),
    actorIsAnonymous: isAnonymousComment,
    postId: row.post_id,
    postTitle: post?.title ?? "Deleted post",
    commentSnippet: comment ? truncate(comment.content, 120) : null,
    isRead: row.is_read,
    createdAt: row.created_at,
  }
}
