import type { Notification } from "../domain/types"
import { mapNotificationRowToNotification } from "../domain/mappers"
import type { NotificationsRepository } from "./ports"

export async function listNotificationsUseCase(
  repository: NotificationsRepository,
  recipientId: string,
  limit: number,
  offset: number,
): Promise<Notification[]> {
  const rows = await repository.listNotifications(recipientId, limit, offset)
  return rows.map(mapNotificationRowToNotification)
}

export async function getUnreadCountUseCase(
  repository: NotificationsRepository,
  recipientId: string,
): Promise<number> {
  return repository.getUnreadCount(recipientId)
}

export async function markAsReadUseCase(
  repository: NotificationsRepository,
  recipientId: string,
  ids: string[] | "all",
): Promise<number> {
  if (ids === "all") {
    return repository.markAllAsRead(recipientId)
  }
  return repository.markAsRead(recipientId, ids)
}
