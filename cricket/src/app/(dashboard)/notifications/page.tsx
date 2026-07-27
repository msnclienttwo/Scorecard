"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Trophy,
  Zap,
  Radio,
  TrendingUp,
  CheckCheck,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const iconMap: Record<string, typeof Trophy> = {
  MATCH_STARTED: Radio,
  BOUNDARY: Zap,
  SIX: Zap,
  WICKET: Trophy,
  RESULT: Trophy,
  INNINGS_BREAK: Radio,
  MILESTONE: TrendingUp,
};

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?page=1&limit=50");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json() as Promise<{ notifications: Notification[]; unreadCount: number }>;
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData<{ notifications: Notification[]; unreadCount: number }>(["notifications"]);
      if (prev) {
        queryClient.setQueryData(["notifications"], {
          ...prev,
          unreadCount: 0,
          notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["notifications"], context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-muted">{unreadCount} unread notifications</p>}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted transition-all hover:bg-white/10 hover:text-foreground disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            {markAllMutation.isPending ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card animate-pulse flex items-start gap-4 rounded-2xl p-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-white/5" />
                <div className="h-3 w-64 rounded bg-white/5" />
                <div className="h-3 w-16 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
            <Bell className="h-10 w-10 text-muted/50" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">No notifications yet</h3>
          <p className="mt-1 text-sm text-muted">You&apos;re all caught up!</p>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {notifications.map((notif) => {
            const Icon = iconMap[notif.type] || Bell;
            return (
              <motion.div key={notif.id} variants={item}>
                <div
                  className={cn(
                    "glass-card flex items-start gap-4 rounded-2xl p-4 transition-all",
                    !notif.isRead && "border-l-2 border-l-primary"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    !notif.isRead ? "bg-primary/10" : "bg-white/5"
                  )}>
                    <Icon className={cn("h-5 w-5", !notif.isRead ? "text-primary" : "text-muted")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn("text-sm", !notif.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{notif.message}</p>
                    <p className="mt-1 text-xs text-muted/60">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
