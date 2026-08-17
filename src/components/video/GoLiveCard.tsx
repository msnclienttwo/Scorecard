"use client";

import { useEffect, useMemo } from "react";
import { CircleAlert, Loader2, Radio, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "@/store/useSocketStore";
import { Button } from "@/components/ui/Button";
import type { BroadcastState } from "@/types/video";

/**
 * Compact "Go Live / Live Video" action for the scoring console. It reads the
 * same broadcast API + react-query cache as <BroadcastManager> (single source
 * of truth) and only navigates to the studio or files a broadcast request —
 * it never duplicates stream/provider logic.
 *
 * States handled:
 *  - provider not configured  -> setup message, no fake streaming
 *  - creator/admin or APPROVED -> Go Live Studio link (LIVE badge when on air)
 *  - REQUESTED                -> pending badge
 *  - REJECTED / no broadcaster -> request flow via POST /broadcast
 */
export function GoLiveCard({ matchId }: { matchId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
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
    const handler = () =>
      queryClient.invalidateQueries({ queryKey: ["broadcast", matchId] });
    on("stream:updated", handler);
    return () => off("stream:updated", handler);
  }, [isConnected, matchId, on, off, queryClient]);

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
    onSuccess: (body) => {
      queryClient.invalidateQueries({ queryKey: ["broadcast", matchId] });
      const status = body?.broadcaster?.status;
      if (status === "APPROVED") {
        router.push(`/matches/${matchId}/broadcast`);
      }
    },
  });

  const canGoLive = useMemo(
    () => !!data && (data.canManage || data.broadcaster?.status === "APPROVED"),
    [data]
  );

  if (isLoading) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
        <p className="text-xs text-muted">Loading broadcast state…</p>
      </div>
    );
  }

  if (!data) return null;

  const isLive = data.stream?.status === "LIVE";
  const status = data.broadcaster?.status ?? null;
  const studioHref = `/matches/${matchId}/broadcast`;

  let message = "Stream this match live and auto-clip the big moments.";
  let title = "Go Live";
  if (!data.configured) {
    title = "Live Video";
    message =
      data.setupMessage ??
      "Live video isn't configured on this server yet.";
  } else if (isLive) {
    title = "On Air";
    message = "Your broadcast is live. Manage the stream from the studio.";
  } else if (data.stream?.status === "ENDED") {
    title = "Go Live";
    message = "Your last broadcast has ended. You can start a new one.";
  } else if (status === "REQUESTED") {
    title = "Request Pending";
    message = "Broadcast request pending approval by the match creator.";
  } else if (status === "REJECTED") {
    title = "Request Declined";
    message = "Your broadcast request was declined by the match creator.";
  } else if (status !== "APPROVED") {
    title = "Go Live";
    message =
      "Want to film this match? Request broadcast access from the creator.";
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/15">
        <Radio className="h-5 w-5 text-danger" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-white">{title}</p>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-semibold text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              LIVE
            </span>
          )}
          {status === "REQUESTED" && (
            <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-[11px] font-semibold text-warning">
              PENDING
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted">{message}</p>
      </div>

      <div className="shrink-0">
        {!data.configured ? (
          <div className="flex items-center gap-1.5 text-xs text-warning">
            <CircleAlert className="h-4 w-4" />
            Not configured
          </div>
        ) : canGoLive ? (
          <Link
            href={studioHref}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <Video className="h-4 w-4" />
            {isLive ? "Manage Live" : "Go Live Studio"}
          </Link>
        ) : status === "REQUESTED" ? (
          <Button size="md" variant="secondary" disabled>
            Request Pending
          </Button>
        ) : (
          <Button
            size="md"
            variant="danger"
            onClick={() => requestMutation.mutate()}
            loading={requestMutation.isPending}
          >
            <Radio className="h-4 w-4" />
            {status === "REJECTED" ? "Request Again" : "Request to Broadcast"}
          </Button>
        )}
      </div>
    </div>
  );
}
