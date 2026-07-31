import { api } from './api';
import type { Notification } from '@/types';

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  matchId: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface NotificationFilters {
  page?: string;
  limit?: string;
  unread?: string;
}

export class NotificationService {
  static async getNotifications(
    params?: NotificationFilters
  ): Promise<NotificationsResponse> {
    return (await api.get<NotificationsResponse>(
      '/api/notifications',
      params as Record<string, string>
    )) as unknown as NotificationsResponse;
  }

  static async createNotification(data: {
    userId?: string;
    type?: string;
    title: string;
    message: string;
    matchId?: string;
    data?: unknown;
  }): Promise<Notification> {
    const response = await api.post<Notification>('/api/notifications', data);
    return response.data!;
  }

  static async markAsRead(id: string): Promise<{ unreadCount: number }> {
    const response = await api.patch<{ unreadCount: number }>(
      `/api/notifications/${id}`,
      { isRead: true }
    );
    return response.data!;
  }

  static async markAllRead(): Promise<{ unreadCount: number }> {
    const response = await api.put<{ unreadCount: number }>(
      '/api/notifications',
      { markAllAsRead: true }
    );
    return response.data!;
  }

  static async deleteNotification(id: string): Promise<{ unreadCount: number }> {
    const response = await api.delete<{ unreadCount: number }>(
      `/api/notifications/${id}`
    );
    return response.data!;
  }
}
