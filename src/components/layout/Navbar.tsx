"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { signOut } from "next-auth/react";

const navLinks = [
  { label: "Live", href: "/live" },
  { label: "Matches", href: "/matches" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Teams", href: "/teams" },
  { label: "Players", href: "/players" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.95]);
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backgroundColor: useTransform(bgOpacity, (v) => `rgba(7, 11, 20, ${v})`),
          borderBottomColor: useTransform(borderOpacity, (v) => `rgba(255,255,255,${v * 0.06})`),
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        />
        <motion.div
          className="relative border-b"
          style={{
            borderColor: useTransform(borderOpacity, (v) => `rgba(255,255,255,${v * 0.06})`),
          }}
        >
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="gradient-text text-xl font-bold tracking-tight">
                  ScoreBolt
                </span>
              </Link>

              <div className="hidden items-center gap-1 md:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "text-muted hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-muted transition-all hover:border-white/20 hover:text-foreground sm:flex"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>

              <button className="relative rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-foreground md:hidden">
                <Search className="h-5 w-5" />
              </button>

              {isAuthenticated ? (
                <>
                  <button className="relative rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                      3
                    </span>
                  </button>

                  <div className="relative hidden md:block">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/5"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white">
                        {generateInitials(user?.name || "U")}
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted" />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0d1220] shadow-2xl"
                        >
                          <div className="border-b border-white/6 p-3">
                            <p className="text-sm font-medium text-foreground">{user?.name}</p>
                            <p className="text-xs text-muted">{user?.email}</p>
                          </div>
                          <div className="p-1.5">
                            {[
                              { icon: User, label: "Profile", href: "/profile" },
                              { icon: Settings, label: "Settings", href: "/settings" },
                            ].map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                                onClick={() => setProfileOpen(false)}
                              >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                              </Link>
                            ))}
                          </div>
                          <div className="border-t border-white/6 p-1.5">
                            <button
                              onClick={() => {
                                logout();
                                setProfileOpen(false);
                                signOut({ callbackUrl: "/login" });
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
                            >
                              <LogOut className="h-4 w-4" />
                              Sign out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="hidden items-center gap-2 md:flex">
                  <Link
                    href="/login"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                  >
                    Register
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-foreground md:hidden"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 h-5" />}
              </button>
            </div>
          </nav>
        </motion.div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-white/6 bg-[#0a0f1c]/95 p-4 backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t border-white/6" />
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="rounded-lg px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="rounded-lg px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-danger text-left transition-colors hover:bg-danger/10"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white text-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 pt-[20vh] backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0d1220] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-white/6 px-4 py-3">
                <Search className="h-5 w-5 text-muted" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search matches, teams, players..."
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Quick links
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  {["Live Matches", "Tournaments", "My Teams"].map((item) => (
                    <button
                      key={item}
                      className="rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
