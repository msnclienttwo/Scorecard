"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Trophy,
  Users,
  Calendar,
  MessageCircle,
  Check,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, typeof Trophy> = {
  match: Trophy,
  team: Users,
  tournament: Calendar,
  message: MessageCircle,
};

const mockNotifications = [
  { id: "1", type: "match", title: "Match Completed", message: "MI vs CSK has ended. MI won by 5 wickets.", time: "2 hours ago", read: false },
  { id: "2", type: "match", title: "Live Match", message: "RCB vs KKR is now live.", time: "4 hours ago", read: false },
  { id: "3", type: "team", title: "New Player Added", message: "Arjun Patel has been added to Mumbai Indians.", time: "6 hours ago", read: false },
  { id: "4", type: "tournament", title: "Tournament Update", message: "IPL 2026 qualifiers have been announced.", time: "1 day ago", read: true },
  { id: "5", type: "message", title: "New Comment", message: "Rahul commented on RCB vs KKR scorecard.", time: "1 day ago", read: true },
  { id: "6", type: "match", title: "Match Scheduled", message: "DC vs RR has been scheduled for Jul 25.", time: "2 days ago", read: true },
  { id: "7", type: "team", title: "Squad Updated", message: "RR has updated their playing XI.", time: "3 days ago", read: true },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-muted">{unreadCount} unread notifications</p>}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted transition-all hover:bg-white/10 hover:text-foreground"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
        {notifications.map((notif) => {
          const Icon = iconMap[notif.type] || Bell;
          return (
            <motion.div key={notif.id} variants={item}>
              <div
                className={cn(
                  "glass-card flex items-start gap-4 rounded-2xl p-4 transition-all",
                  !notif.read && "border-l-2 border-l-primary"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  !notif.read ? "bg-primary/10" : "bg-white/5"
                )}>
                  <Icon className={cn("h-5 w-5", !notif.read ? "text-primary" : "text-muted")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={cn("text-sm", !notif.read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                      {notif.title}
                    </h3>
                    {!notif.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{notif.message}</p>
                  <p className="mt-1 text-xs text-muted/60">{notif.time}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {notifications.length === 0 && (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
            <Bell className="h-10 w-10 text-muted/50" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">No notifications</h3>
          <p className="mt-1 text-sm text-muted">You&apos;re all caught up!</p>
        </motion.div>
      )}
    </motion.div>
  );
}
