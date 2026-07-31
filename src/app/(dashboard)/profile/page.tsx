"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Mail,
  Phone,
  FileText,
  Save,
  Trophy,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, bio }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      updateUser(data.user);
      setFeedback({ type: "success", message: "Profile updated successfully!" });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-3xl space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      </motion.div>

      <motion.div variants={item} className="glass-card rounded-2xl p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-2xl font-bold text-white">
              {generateInitials(user?.name || "U")}
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:bg-primary-light">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-foreground">
              {user?.name || "User"}
            </h2>
            <p className="text-sm text-muted">{user?.email || ""}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {(user?.role as string) || "User"}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={item}
        className="glass-card rounded-2xl p-6 text-center"
      >
        <p className="text-sm text-muted">
          Start scoring matches and creating teams to see your stats here.
        </p>
      </motion.div>

      {feedback && (
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium",
            feedback.type === "success"
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {feedback.message}
        </motion.div>
      )}

      <motion.div variants={item} className="glass-card rounded-2xl p-6">
        <h3 className="mb-4 font-semibold text-foreground">Edit Profile</h3>
        <form className="space-y-4" onSubmit={handleSave}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Add phone number"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">
              Bio
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted" />
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">
              Profile Image
            </label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/5 border border-dashed border-white/10">
                <Camera className="h-6 w-6 text-muted" />
              </div>
              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted transition-all hover:bg-white/10 hover:text-foreground"
              >
                Upload Image
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
