"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { signOut } from "next-auth/react";

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

export default function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
              5
            </span>
          </Link>

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
