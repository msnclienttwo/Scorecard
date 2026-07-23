"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="relative w-full max-w-md px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-2xl p-8"
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="mt-1 text-sm text-muted">Join ScoreCast and start scoring</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="John Doe"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-11 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your password"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-11 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={agreed}
                onChange={() => setAgreed(!agreed)}
                className="peer sr-only"
              />
              <div className="h-4 w-4 rounded border border-white/20 bg-white/5 transition-all peer-checked:border-primary peer-checked:bg-primary" />
              {agreed && (
                <svg className="absolute left-0.5 top-0.5 h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </div>
            <span className="text-sm text-muted">
              I agree to the{" "}
              <span className="text-primary hover:text-primary-light cursor-pointer">Terms of Service</span>
              {" "}and{" "}
              <span className="text-primary hover:text-primary-light cursor-pointer">Privacy Policy</span>
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
          >
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-light transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
