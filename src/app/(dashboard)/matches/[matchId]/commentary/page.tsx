"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Zap, MessageSquare, Loader2 } from "lucide-react";

interface CommentaryEntry {
  id: string;
  content: string;
  overNumber: number | null;
  ballNumber: number | null;
  inningsNumber: number | null;
  isAutomatic: boolean;
  isHighlight: boolean;
  eventType: string | null;
  emoji: string | null;
  createdAt: string;
  user?: { id: string; name: string; image: string | null } | null;
}

interface CommentaryResponse {
  commentary: CommentaryEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function CommentaryPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const [commentary, setCommentary] = useState<CommentaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "highlights">("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });

  useEffect(() => {
    async function fetchCommentary() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/matches/${matchId}/commentary?page=${page}&limit=50`
        );
        const data: CommentaryResponse = await res.json();
        setCommentary(data.commentary || []);
        setPagination(data.pagination);
      } catch {
        console.error("Failed to fetch commentary");
      } finally {
        setLoading(false);
      }
    }
    if (matchId) fetchCommentary();
  }, [matchId, page]);

  const filtered =
    filter === "highlights"
      ? commentary.filter((c) => c.isHighlight)
      : commentary;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Commentary</h2>
          </div>
          <div className="flex gap-2">
            {(["all", "highlights"] as const).map((f) => (
              <motion.button
                key={f}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-white/5 text-muted"
                )}
              >
                {f === "highlights" ? (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Highlights
                  </span>
                ) : (
                  "All"
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted text-sm">No commentary available yet</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />

          <div className="space-y-6">
            {filtered.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="relative pl-14"
              >
                <div
                  className={cn(
                    "absolute left-4 top-5 w-4 h-4 rounded-full border-2 z-10",
                    entry.isHighlight
                      ? "bg-primary border-primary"
                      : entry.isAutomatic
                      ? "bg-white/10 border-white/20"
                      : "bg-accent border-accent"
                  )}
                />

                <div
                  className={cn(
                    "bg-white/5 backdrop-blur-xl border rounded-2xl p-5 transition-all hover:bg-white/[0.07]",
                    entry.isHighlight
                      ? "border-primary/30"
                      : "border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {entry.overNumber != null &&
                      entry.ballNumber != null && (
                        <span className="text-xs text-muted font-mono">
                          {entry.overNumber}.{entry.ballNumber}
                        </span>
                      )}
                    <span className="text-xs text-muted">
                      {formatTimestamp(entry.createdAt)}
                    </span>
                    {entry.emoji && (
                      <span className="text-lg">{entry.emoji}</span>
                    )}
                    {entry.isHighlight && (
                      <span className="text-[10px] font-medium text-primary bg-primary/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        KEY MOMENT
                      </span>
                    )}
                    {entry.isAutomatic && (
                      <span className="text-[10px] text-muted/60 bg-white/5 px-2 py-0.5 rounded-full">
                        AUTO
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "leading-relaxed",
                      entry.isHighlight
                        ? "text-white font-medium"
                        : "text-white/80"
                    )}
                  >
                    {entry.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
              page <= 1
                ? "bg-white/5 text-muted/40 cursor-not-allowed"
                : "bg-white/5 text-muted hover:bg-white/10"
            )}
          >
            Previous
          </motion.button>
          <span className="text-xs text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page >= pagination.totalPages}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
              page >= pagination.totalPages
                ? "bg-white/5 text-muted/40 cursor-not-allowed"
                : "bg-white/5 text-muted hover:bg-white/10"
            )}
          >
            Next
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
