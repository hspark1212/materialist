import type { SupabaseClient } from "@supabase/supabase-js"

import type { NotificationWithContextRow } from "../domain/types"
import type { NotificationsRepository } from "../application/ports"

const PROFILE_COLUMNS = [
  "id",
  "display_name",
  "generated_display_name",
  "avatar_url",
  "is_anonymous",
  "is_bot",
].join(",")

const NOTIFICATIONS_SELECT = [
  "id",
  "recipient_id",
  "actor_id",
  "type",
  "post_id",
  "comment_id",
  "is_read",
  "created_at",
].join(",")

const NOTIFICATIONS_WITH_CONTEXT = `${NOTIFICATIONS_SELECT},profiles!notifications_actor_id_fkey(${PROFILE_COLUMNS}),posts(title),comments(content,is_anonymous)`

function throwIfError(error: { message: string } | null, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`)
  }
}

export function createSupabaseNotificationsRepository(
  supabase: SupabaseClient,
): NotificationsRepository {
  return {
    async listNotifications(
      recipientId: string,
      limit: number,
      offset: number,
    ): Promise<NotificationWithContextRow[]> {
      const { data, error } = await supabase
        .from("notifications")
        .select(NOTIFICATIONS_WITH_CONTEXT)
        .eq("recipient_id", recipientId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      throwIfError(error, "Failed to list notifications")
      return (data ?? []) as unknown as NotificationWithContextRow[]
    },

    async getUnreadCount(recipientId: string): Promise<number> {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", recipientId)
        .eq("is_read", false)

      throwIfError(error, "Failed to get unread count")
      return count ?? 0
    },

    async markAsRead(
      recipientId: string,
      notificationIds: string[],
    ): Promise<number> {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", recipientId)
        .in("id", notificationIds)
        .eq("is_read", false)
        .select("id")

      throwIfError(error, "Failed to mark notifications as read")
      return (data ?? []).length
    },

    async markAllAsRead(recipientId: string): Promise<number> {
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", recipientId)
        .eq("is_read", false)
        .select("id")

      throwIfError(error, "Failed to mark all notifications as read")
      return (data ?? []).length
    },
  }
}
