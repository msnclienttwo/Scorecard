import { api } from './api';
import type { Notification, PaginatedResponse } from '@/types';

interface NotificationFilters {
  read?: boolean;
  page?: string;
  limit?: string;
}

export class NotificationService {
  static async getNotifications(
    params?: NotificationFilters
  ): Promise<PaginatedResponse<Notification>> {
    const response = await api.get<Notification[]>(
      '/api/notifications',
      params as Record<string, string>
    );
    return response as unknown as PaginatedResponse<Notification>;
  }

  static async markAsRead(id: string): Promise<Notification> {
    const response = await api.patch<Notification>(`/api/notifications/${id}`, {
      read: true,
    });
    return response.data!;
  }

  static async markAllRead(): Promise<void> {
    await api.patch('/api/notifications/read-all');
  }

  static async getUnreadCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/api/notifications/unread-count');
    return response.data!;
  }

  static async deleteNotification(id: string): Promise<void> {
    await api.delete(`/api/notifications/${id}`);
  }
}
