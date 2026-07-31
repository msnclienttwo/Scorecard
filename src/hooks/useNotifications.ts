"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  NotificationService,
  type NotificationsResponse,
} from "@/services/notification.service";

const NOTIFICATIONS_KEY = ["notifications"] as const;

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => NotificationService.getNotifications({ limit: "50" }),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  const notifications = query.data?.notifications ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });

  const markAsRead = useMutation({
    mutationFn: (id: string) => NotificationService.markAsRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const prev =
        queryClient.getQueryData<NotificationsResponse>(NOTIFICATIONS_KEY);
      if (prev) {
        const target = prev.notifications.find((n) => n.id === id);
        queryClient.setQueryData<NotificationsResponse>(NOTIFICATIONS_KEY, {
          ...prev,
          unreadCount: Math.max(
            0,
            prev.unreadCount - (target && !target.isRead ? 1 : 0)
          ),
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.prev);
      }
    },
    onSettled: () => invalidate(),
  });

  const markAllAsRead = useMutation({
    mutationFn: () => NotificationService.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const prev =
        queryClient.getQueryData<NotificationsResponse>(NOTIFICATIONS_KEY);
      if (prev) {
        queryClient.setQueryData<NotificationsResponse>(NOTIFICATIONS_KEY, {
          ...prev,
          unreadCount: 0,
          notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.prev);
      }
    },
    onSettled: () => invalidate(),
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) => NotificationService.deleteNotification(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const prev =
        queryClient.getQueryData<NotificationsResponse>(NOTIFICATIONS_KEY);
      if (prev) {
        const target = prev.notifications.find((n) => n.id === id);
        queryClient.setQueryData<NotificationsResponse>(NOTIFICATIONS_KEY, {
          ...prev,
          unreadCount: Math.max(
            0,
            prev.unreadCount - (target && !target.isRead ? 1 : 0)
          ),
          notifications: prev.notifications.filter((n) => n.id !== id),
        });
      }
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.prev);
      }
    },
    onSettled: () => invalidate(),
  });

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    isMarkingAll: markAllAsRead.isPending,
  };
}
