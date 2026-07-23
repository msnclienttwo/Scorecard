"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="relative w-full max-w-md px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-2xl p-8"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Forgot password?</h1>
          <p className="mt-1 text-sm text-muted">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
          >
            <Send className="h-4 w-4" />
            Send Reset Link
          </button>
        </form>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </motion.div>
    </div>
  );
}
