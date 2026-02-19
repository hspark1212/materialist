import type { NotificationWithContextRow } from "../domain/types"

export interface NotificationsRepository {
  listNotifications(recipientId: string, limit: number, offset: number): Promise<NotificationWithContextRow[]>

  getUnreadCount(recipientId: string): Promise<number>

  markAsRead(recipientId: string, notificationIds: string[]): Promise<number>

  markAllAsRead(recipientId: string): Promise<number>
}
