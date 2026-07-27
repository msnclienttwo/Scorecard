"use client";

import { motion } from "framer-motion";

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 ${className || ""}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-8 w-48" />
        <SkeletonPulse className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPulse key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonPulse className="h-64 rounded-2xl" />
        <SkeletonPulse className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-8 w-40" />
        <SkeletonPulse className="h-10 w-36 rounded-xl" />
      </div>
      <SkeletonPulse className="h-10 w-80 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonPulse key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <SkeletonPulse className="h-6 w-32 rounded-lg" />
      <SkeletonPulse className="h-48 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPulse key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <SkeletonPulse className="h-64 rounded-2xl" />
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <SkeletonPulse className="h-8 w-40" />
      <SkeletonPulse className="h-10 w-64 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonPulse key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ScorecardSkeleton() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <SkeletonPulse className="h-40 rounded-2xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonPulse className="h-64 rounded-2xl" />
        <SkeletonPulse className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export function CreateFormSkeleton() {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <SkeletonPulse className="h-8 w-48" />
      <SkeletonPulse className="h-12 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <SkeletonPulse className="h-12 rounded-xl" />
        <SkeletonPulse className="h-12 rounded-xl" />
      </div>
      <SkeletonPulse className="h-12 rounded-xl" />
      <SkeletonPulse className="h-12 rounded-xl" />
    </div>
  );
}
