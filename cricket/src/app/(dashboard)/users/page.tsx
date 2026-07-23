"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MoreHorizontal, Shield, UserCheck, UserX, Eye } from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";

const roles = ["All", "Admin", "Scorer", "Viewer"] as const;

const mockUsers = [
  { id: "1", name: "John Doe", email: "john@example.com", role: "Admin", joined: "Jan 12, 2026", status: "active" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", role: "Scorer", joined: "Feb 8, 2026", status: "active" },
  { id: "3", name: "Rahul Sharma", email: "rahul@example.com", role: "Scorer", joined: "Mar 15, 2026", status: "active" },
  { id: "4", name: "Priya Patel", email: "priya@example.com", role: "Viewer", joined: "Apr 2, 2026", status: "inactive" },
  { id: "5", name: "Alex Turner", email: "alex@example.com", role: "Admin", joined: "May 20, 2026", status: "active" },
  { id: "6", name: "Sarah Wilson", email: "sarah@example.com", role: "Viewer", joined: "Jun 11, 2026", status: "active" },
  { id: "7", name: "Mike Johnson", email: "mike@example.com", role: "Scorer", joined: "Jul 1, 2026", status: "active" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const roleColors: Record<string, string> = {
  Admin: "bg-primary/10 text-primary",
  Scorer: "bg-accent/10 text-accent",
  Viewer: "bg-muted/10 text-muted",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState<(typeof roles)[number]>("All");

  const filtered = mockUsers.filter((u) => {
    if (activeRole !== "All" && u.role !== activeRole) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted">Manage platform users and roles</p>
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activeRole === role
                  ? "bg-primary/20 text-primary"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Joined</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
                        {generateInitials(user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", roleColors[user.role] || roleColors.Viewer)}>
                      {user.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-sm text-muted">{user.joined}</td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      user.status === "active" ? "bg-success/10 text-success" : "bg-muted/10 text-muted"
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", user.status === "active" ? "bg-success" : "bg-muted")} />
                      {user.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground">
                        <Shield className="h-4 w-4" />
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-danger">
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {filtered.length === 0 && (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <UserCheck className="h-8 w-8 text-muted" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">No users found</p>
          <p className="text-xs text-muted">Try adjusting your search or filter</p>
        </motion.div>
      )}
    </motion.div>
  );
}
