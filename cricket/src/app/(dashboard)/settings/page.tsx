"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Palette,
  AlertTriangle,
  Mail,
  Phone,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-white/10"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [matchEvents, setMatchEvents] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [profilePublic, setProfilePublic] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-3xl space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </motion.div>

      <motion.div variants={item} className="glass-card rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Account</h2>
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Add phone number"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
          >
            Save Changes
          </button>
        </form>
      </motion.div>

      <motion.div variants={item} className="glass-card rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-foreground">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Match Events</p>
              <p className="text-xs text-muted">Get notified about live match updates</p>
            </div>
            <Toggle checked={matchEvents} onChange={() => setMatchEvents(!matchEvents)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Weekly Digest</p>
              <p className="text-xs text-muted">Receive a weekly summary email</p>
            </div>
            <Toggle checked={weeklyDigest} onChange={() => setWeeklyDigest(!weeklyDigest)} />
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-card rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-success" />
          <h2 className="font-semibold text-foreground">Privacy</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Public Profile</p>
              <p className="text-xs text-muted">Make your profile visible to others</p>
            </div>
            <Toggle checked={profilePublic} onChange={() => setProfilePublic(!profilePublic)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Show Email</p>
              <p className="text-xs text-muted">Display email on your public profile</p>
            </div>
            <Toggle checked={showEmail} onChange={() => setShowEmail(!showEmail)} />
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-card rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-warning" />
          <h2 className="font-semibold text-foreground">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Dark Mode</p>
            <p className="text-xs text-muted">Toggle between dark and light theme</p>
          </div>
          <Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
        </div>
      </motion.div>

      <motion.div variants={item} className="glass-card rounded-2xl border border-danger/20 p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-danger" />
          <h2 className="font-semibold text-danger">Danger Zone</h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-5 py-2.5 text-sm font-semibold text-danger transition-all hover:bg-danger/20 active:scale-[0.98]">
          <Trash2 className="h-4 w-4" />
          Delete Account
        </button>
      </motion.div>
    </motion.div>
  );
}
