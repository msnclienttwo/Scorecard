"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Radio, Video, VideoOff, Check, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "@/store/useSocketStore";
import { ViewerLiveVideo } from "@/components/video/ViewerLiveVideo";
import type { BroadcastState } from "@/types/video";
import { cn } from "@/lib/utils";

function StatusDot({ status }: { status: string }) {
  if (status === "LIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-semibold text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
        LIVE
      </span>
    );
  }
  if (status === "ENDED") {
    return (
      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-muted">
        ENDED
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-muted">
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function BroadcastManager({ matchId }: { matchId: string }) {
  const queryClient = useQueryClient();
  const { isConnected, on, off } = useSocketStore();

  const { data, isLoading } = useQuery({
    queryKey: ["broadcast", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}/broadcast`);
      if (!res.ok) throw new Error("Failed to load broadcast state");
      return res.json() as Promise<BroadcastState>;
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!isConnected) return;
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["broadcast", matchId] });
    };
    on("stream:updated", handler);
    return () => off("stream:updated", handler);
  }, [isConnected, matchId, on, off, queryClient]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["broadcast", matchId] });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/matches/${matchId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Request failed");
      }
      return res.json();
    },
    onSuccess: invalidate,
  });

  const decideMutation = useMutation({
    mutationFn: async ({
      broadcasterId,
      action,
    }: {
      broadcasterId: string;
      action: "approve" | "reject";
    }) => {
      const res = await fetch(`/api/matches/${matchId}/broadcast`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcasterId, action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Update failed");
      }
      return res.json();
    },
    onSuccess: invalidate,
  });

  const pendingRequests = useMemo(
    () => (data?.broadcasters ?? []).filter((b) => b.status === "REQUESTED"),
    [data]
  );
  const approvedCount = (data?.broadcasters ?? []).filter(
    (b) => b.status === "APPROVED"
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </div>
    );
  }

  if (!data) return null;

  const myApproved = data.broadcaster?.status === "APPROVED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-danger/15">
            <Radio className="h-4 w-4 text-danger" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Live Video</p>
            <p className="text-[11px] text-muted">
              Broadcast the match and auto-clip the big moments
            </p>
          </div>
        </div>
        {data.stream && <StatusDot status={data.stream.status} />}
      </div>

      <div className="space-y-4 p-4">
        {!data.configured && (
          <p className="rounded-xl border border-warning/20 bg-warning/5 px-3 py-2.5 text-xs text-warning">
            {data.setupMessage ??
              "Live video is not configured on this server yet."}
          </p>
        )}

        {data.stream?.status === "LIVE" && (
          <div className="overflow-hidden rounded-xl bg-black">
            <ViewerLiveVideo matchId={matchId} />
          </div>
        )}

        {data.stream?.status !== "LIVE" && data.configured && (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-xs text-muted">
            <VideoOff className="h-4 w-4" />
            {data.stream?.status === "ENDED"
              ? "Broadcast ended. Highlights from the recording are below."
              : "No broadcast is running right now."}
          </div>
        )}

        {data.canManage ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {data.configured && (
                <Link
                  href={`/matches/${matchId}/broadcast`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-danger/20 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/30"
                >
                  <Video className="h-3.5 w-3.5" />
                  {data.stream?.status === "LIVE"
                    ? "Go Live Studio"
                    : data.stream?.status === "ENDED"
                      ? "Studio"
                      : "Go Live Studio"}
                </Link>
              )}
              {approvedCount > 0 && (
                <span className="text-[11px] text-muted">
                  {approvedCount} approved broadcaster
                  {approvedCount === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {data.broadcasters.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted">
                  Broadcasters
                </p>
                {data.broadcasters.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">
                        {b.user.name ?? b.user.email}
                      </p>
                      <p className="text-[11px] text-muted capitalize">
                        {b.status.toLowerCase()}
                      </p>
                    </div>
                    {b.status === "REQUESTED" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            decideMutation.mutate({
                              broadcasterId: b.id,
                              action: "approve",
                            })
                          }
                          disabled={decideMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success transition-colors hover:bg-success/25"
                        >
                          <Check className="h-3 w-3" />
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            decideMutation.mutate({
                              broadcasterId: b.id,
                              action: "reject",
                            })
                          }
                          disabled={decideMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:bg-white/10"
                        >
                          <X className="h-3 w-3" />
                          Reject
                        </button>
                      </div>
                    )}
                    {b.status === "APPROVED" && (
                      <Link
                        href={`/matches/${matchId}/broadcast`}
                        className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-white/10"
                      >
                        Go Live
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
            {pendingRequests.length > 0 && data.broadcasters.length === 0 && (
              <p className="text-xs text-muted">
                Broadcast requests will appear here for you to approve.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {data.broadcaster ? (
              <div
                className={cn(
                  "rounded-xl px-3 py-2.5 text-xs font-medium",
                  data.broadcaster.status === "APPROVED" &&
                    "bg-success/10 text-success",
                  data.broadcaster.status === "REQUESTED" &&
                    "bg-warning/10 text-warning",
                  data.broadcaster.status === "REJECTED" &&
                    "bg-danger/10 text-danger"
                )}
              >
                {data.broadcaster.status === "APPROVED" &&
                  "You are an approved broadcaster."}
                {data.broadcaster.status === "REQUESTED" &&
                  "Broadcast request pending approval."}
                {data.broadcaster.status === "REJECTED" &&
                  "Your broadcast request was declined."}
              </div>
            ) : (
              <p className="text-xs text-muted">
                Want to film this match? Request access from the match creator
                and stream it live.
              </p>
            )}
            {data.broadcaster?.status === "APPROVED" && data.configured ? (
              <Link
                href={`/matches/${matchId}/broadcast`}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-danger/20 px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/30"
              >
                <Video className="h-4 w-4" />
                Go Live
              </Link>
            ) : (
              <button
                onClick={() => requestMutation.mutate()}
                disabled={
                  requestMutation.isPending ||
                  data.broadcaster?.status === "REQUESTED" ||
                  data.broadcaster?.status === "REJECTED"
                }
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {requestMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Radio className="h-4 w-4 text-danger" />
                )}
                Request to Broadcast
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
