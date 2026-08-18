"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard, Download, Flame, Play, Rocket, Target, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "@/store/useSocketStore";
import type { HighlightRef } from "@/types/video";
import { cn, formatStoredOvers } from "@/lib/utils";

const EVENT_STYLES: Record<
  string,
  { icon: typeof Flame; color: string; bg: string; label: string }
> = {
  FOUR: {
    icon: Flame,
    color: "text-accent",
    bg: "bg-accent/15",
    label: "🔥 FOUR",
  },
  SIX: {
    icon: Rocket,
    color: "text-warning",
    bg: "bg-warning/15",
    label: "🚀 SIX",
  },
  WICKET: {
    icon: Target,
    color: "text-danger",
    bg: "bg-danger/15",
    label: "🎯 WICKET",
  },
};

export function HighlightsSection({
  matchId,
  compact = false,
}: {
  matchId: string;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const { isConnected, on, off } = useSocketStore();
  const [watchId, setWatchId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["highlights", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}/highlights`);
      if (!res.ok) throw new Error("Failed to load highlights");
      return res.json() as Promise<{ highlights: HighlightRef[] }>;
    },
    refetchInterval: (query) => {
      const hs = query.state.data?.highlights ?? [];
      return hs.some((h) => h.status === "PENDING" || h.status === "PROCESSING")
        ? 20_000
        : false;
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!isConnected) return;
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["highlights", matchId] });
    };
    on("highlight:updated", handler);
    return () => off("highlight:updated", handler);
  }, [isConnected, matchId, on, off, queryClient]);

  const highlights = useMemo(
    () => data?.highlights ?? [],
    [data]
  );
  const watching = highlights.find((h) => h.id === watchId) ?? null;
  const readyCount = highlights.filter((h) => h.status === "READY").length;
  const failedCount = highlights.filter((h) => h.status === "FAILED").length;
  const pendingCount = highlights.filter(
    (h) => h.status === "PENDING" || h.status === "PROCESSING"
  ).length;

  if (isLoading) return null;

  if (highlights.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <Clapperboard className="mx-auto mb-2 h-8 w-8 text-muted" />
        <p className="text-sm text-white font-medium">No highlights yet</p>
        <p className="mt-1 text-xs text-muted">
          When a live broadcast is recording, the best deliveries (fours, sixes
          and wickets) are clipped automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted">
          Match Highlights
          <span className="ml-2 text-white font-semibold">{readyCount}</span>
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
              {pendingCount} processing
            </span>
          )}
          {failedCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted">
              {failedCount} failed
            </span>
          )}
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((h, i) => {
          const style = EVENT_STYLES[h.eventType] ?? EVENT_STYLES.FOUR!;
          const Icon = style.icon;
          const overText = formatStoredOvers((h.overNumber - 1) * 6 + h.ballNumber);
          const ready = h.status === "READY" && h.playbackUrl;
          return (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
            >
              <button
                onClick={() => ready && setWatchId(h.id)}
                disabled={!ready}
                className={cn(
                  "relative block aspect-video w-full overflow-hidden bg-[#0a0f1a]",
                  ready ? "cursor-pointer" : "cursor-default"
                )}
              >
                {h.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={h.thumbnailUrl}
                    alt={h.title}
                    className="h-full w-full object-cover opacity-80"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon className={cn("h-10 w-10", style.color)} />
                  </div>
                )}
                {ready && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black">
                      <Play className="h-5 w-5" fill="currentColor" />
                    </span>
                  </span>
                )}
                <span
                  className={cn(
                    "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold",
                    style.bg,
                    style.color
                  )}
                >
                  {style.label}
                </span>
                <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {h.status === "READY"
                    ? `${h.duration}s clip`
                    : h.status === "FAILED"
                      ? "upload failed"
                      : "processing\u2026"}
                </span>
              </button>

              <div className="p-3">
                <p className="text-sm font-semibold text-white leading-snug">
                  {h.title}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-muted tabular-nums">
                    Over {overText}
                  </span>
                  {ready && (
                    <a
                      href={`/api/matches/${h.matchId}/highlights/${h.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {watching && watching.playbackUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setWatchId(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setWatchId(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video">
              <video
                key={watching.playbackUrl}
                src={watching.playbackUrl}
                poster={watching.thumbnailUrl ?? undefined}
                controls
                autoPlay
                playsInline
                className="h-full w-full bg-black"
              />
            </div>
            <div className="flex items-center justify-between bg-[#0a0f1a] px-4 py-3">
              <p className="text-sm font-semibold text-white">{watching.title}</p>
              <a
                href={`/api/matches/${watching.matchId}/highlights/${watching.id}/download`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
