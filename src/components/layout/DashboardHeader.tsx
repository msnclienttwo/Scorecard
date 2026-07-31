"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Command,
  CheckCheck,
  Trophy,
  Zap,
  Radio,
  TrendingUp,
  Swords,
  UserPlus,
  Calendar,
  CircleCheck,
  BellRing,
} from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotifications } from "@/hooks/useNotifications";
import { signOut } from "next-auth/react";
import type { NotificationItem } from "@/services/notification.service";

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

const iconMap: Record<string, typeof Trophy> = {
  SYSTEM: BellRing,
  MATCH_CREATED: Calendar,
  MATCH_STARTED: Radio,
  MATCH_COMPLETED: CircleCheck,
  TEAM_CREATED: Swords,
  PLAYER_CREATED: UserPlus,
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

export default function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAll,
  } = useNotifications();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    setShowNotifications(false);
    router.push("/notifications");
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || isMarkingAll) return;
    markAllAsRead();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-16 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:w-80"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5">
              <Command className="h-3 w-3 text-muted" />
              <span className="text-[10px] text-muted">K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-[#0a0f1a] shadow-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                    <p className="text-sm font-medium text-foreground">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        disabled={isMarkingAll}
                        className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-50"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {isLoading ? (
                      <div className="space-y-2 p-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
                        ))}
                      </div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                        <Bell className="h-8 w-8 text-muted/40" />
                        <p className="mt-3 text-sm font-medium text-foreground">No notifications yet</p>
                        <p className="mt-1 text-xs text-muted">You&apos;re all caught up!</p>
                      </div>
                    ) : (
                      recentNotifications.map((notif) => {
                        const Icon = iconMap[notif.type] || BellRing;
                        return (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={cn(
                              "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5",
                              !notif.isRead && "border-l-2 border-l-primary bg-white/[0.02]"
                            )}
                          >
                            <div
                              className={cn(
                                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                !notif.isRead ? "bg-primary/10" : "bg-white/5"
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-4 w-4",
                                  !notif.isRead ? "text-primary" : "text-muted"
                                )}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  "truncate text-sm",
                                  !notif.isRead
                                    ? "font-semibold text-foreground"
                                    : "font-medium text-foreground/80"
                                )}
                              >
                                {notif.title}
                              </p>
                              <p className="truncate text-xs text-muted">{notif.message}</p>
                              <p className="mt-0.5 text-[10px] text-muted/60">
                                {timeAgo(notif.createdAt)}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="block border-t border-white/5 px-4 py-3 text-center text-sm font-medium text-primary transition-colors hover:bg-white/5"
                  >
                    View all notifications
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3 transition-colors hover:bg-white/5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                {generateInitials(user?.name || "U")}
              </div>
              <span className="hidden text-sm font-medium text-foreground md:block">{user?.name || "User"}</span>
              <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", showUserMenu && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#0a0f1a] p-1.5 shadow-xl"
                >
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
                    <p className="text-xs text-muted">{user?.email || ""}</p>
                  </div>
                  <div className="my-1 border-t border-white/5" />
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <div className="my-1 border-t border-white/5" />
                  <button
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
