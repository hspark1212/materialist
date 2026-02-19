import type { ProfileRow } from "@/features/posts/domain/types"

export type NotificationType = "comment_on_post" | "reply_to_comment"

export type NotificationRow = {
  id: string
  recipient_id: string
  actor_id: string
  type: NotificationType
  post_id: string
  comment_id: string | null
  is_read: boolean
  created_at: string
}

export type NotificationWithContextRow = NotificationRow & {
  profiles: ProfileRow | ProfileRow[] | null
  posts: { title: string } | { title: string }[] | null
  comments: { content: string; is_anonymous: boolean } | { content: string; is_anonymous: boolean }[] | null
}

export type Notification = {
  id: string
  type: NotificationType
  actorDisplayName: string
  actorAvatar: string
  actorIsAnonymous: boolean
  postId: string
  postTitle: string
  commentSnippet: string | null
  isRead: boolean
  createdAt: string
}
