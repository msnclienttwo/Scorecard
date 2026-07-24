"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft } from "lucide-react";
import { registerSchema } from "@/lib/validations";
import { useToast } from "@/hooks/useToast";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    const result = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      if (!agreed) {
        fieldErrors.terms = "You must accept the terms and conditions";
      }
      setErrors(fieldErrors);
      return;
    }

    if (!agreed) {
      setErrors({ terms: "You must accept the terms and conditions" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrors({ email: data.error || "An account with this email already exists." });
        } else {
          toast({ message: data.error || "Something went wrong. Please try again.", type: "error" });
        }
        return;
      }

      setSuccess(true);
      toast({ message: "Registration successful. Please login.", type: "success" });

      setTimeout(() => {
        router.push(`/login${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
      }, 1500);
    } catch {
      toast({ message: "Network error. Please check your connection and try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">Account created!</h2>
          <p className="mt-2 text-sm text-muted">Redirecting you to login...</p>
        </motion.div>
      </div>
    );
  }

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

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={`w-full rounded-xl border bg-white/5 py-2.5 pl-11 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:ring-1 ${
                  errors.name
                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50"
                    : "border-white/10 focus:border-primary/50 focus:ring-primary/50"
                }`}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full rounded-xl border bg-white/5 py-2.5 pl-11 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:ring-1 ${
                  errors.email
                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50"
                    : "border-white/10 focus:border-primary/50 focus:ring-primary/50"
                }`}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className={`w-full rounded-xl border bg-white/5 py-2.5 pl-11 pr-11 text-sm text-foreground placeholder-muted outline-none transition-all focus:ring-1 ${
                  errors.password
                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50"
                    : "border-white/10 focus:border-primary/50 focus:ring-primary/50"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={`w-full rounded-xl border bg-white/5 py-2.5 pl-11 pr-11 text-sm text-foreground placeholder-muted outline-none transition-all focus:ring-1 ${
                  errors.confirmPassword
                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50"
                    : "border-white/10 focus:border-primary/50 focus:ring-primary/50"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
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
          {errors.terms && <p className="text-xs text-red-400">{errors.terms}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href={`/login${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
            className="font-medium text-primary hover:text-primary-light transition-colors"
          >
            Sign in
          </Link>
        </p>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="relative w-full max-w-md px-4">
        <div className="glass-card rounded-2xl p-8">
          <div className="text-center text-muted">Loading...</div>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
