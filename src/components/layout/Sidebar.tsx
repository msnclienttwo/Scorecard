"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Trophy,
  PlusCircle,
  Users,
  User,
  Calendar,
  BarChart3,
  Search,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Trophy, label: "Matches", href: "/matches" },
  { icon: PlusCircle, label: "Create Match", href: "/matches/create" },
  { icon: Users, label: "Teams", href: "/teams" },
  { icon: User, label: "Players", href: "/players" },
  { icon: Calendar, label: "Tournaments", href: "/tournaments" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Search, label: "Search", href: "/search" },
  { icon: Bell, label: "Notifications", href: "/notifications", badge: 5 },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="glass sticky top-0 hidden h-screen flex-col justify-between overflow-hidden border-r border-white/6 lg:flex"
    >
      <div className="flex flex-col">
        <div className="flex h-16 items-center justify-between border-b border-white/6 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="gradient-text whitespace-nowrap text-lg font-bold"
                >
                  ScoreBolt
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r from-primary/20 to-accent/10 text-foreground"
                        : "text-muted hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/10"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        "relative z-10 h-5 w-5 shrink-0",
                        isActive ? "text-primary" : "text-muted group-hover:text-foreground"
                      )}
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="relative z-10 truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!collapsed && item.badge && (
                      <span className="relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                    {collapsed && item.badge && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-white/6 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
            {generateInitials(user?.name || "U")}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="truncate text-sm font-medium text-foreground">
                  {user?.name || "User"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
