"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Radio, Users, WifiOff, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "@/store/useSocketStore";
import { useWebRTCViewer } from "@/hooks/useWebRTCViewer";
import type { BroadcastState, ClientIceServer } from "@/types/video";

/**
 * Live video block for the public score page. Sits above the score banner.
 * Media flows peer-to-peer over WebRTC; the Socket.IO server only relays
 * signaling. Renders as soon as the stream row is LIVE and keeps the score
 * banner independent of any video failure.
 */
export function ViewerLiveVideo({ matchId }: { matchId: string }) {
  const queryClient = useQueryClient();
  const { isConnected, on, off, connect } = useSocketStore();

  const { data } = useQuery({
    queryKey: ["broadcast", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}/broadcast`);
      if (!res.ok) throw new Error("Failed to load stream");
      return res.json() as Promise<BroadcastState>;
    },
    staleTime: 15_000,
    refetchInterval: (query) =>
      query.state.data?.stream?.status === "LIVE" ? 30_000 : false,
  });

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (!isConnected) return;
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["broadcast", matchId] });
    };
    on("stream:updated", handler);
    return () => off("stream:updated", handler);
  }, [isConnected, matchId, on, off, queryClient]);

  const stream = data?.stream;

  if (!stream || stream.status !== "LIVE") {
    return null;
  }

  return (
    <LiveVideoFeed
      matchId={matchId}
      iceServers={stream.iceServers ?? []}
    />
  );
}

function LiveVideoFeed({
  matchId,
  iceServers,
}: {
  matchId: string;
  iceServers: ClientIceServer[];
}) {
  const { videoRef, status, viewerCount, error, retry } = useWebRTCViewer(matchId, iceServers);
  const showConnecting = status === "connecting" || status === "idle";
  const showReconnecting = status === "reconnecting";
  const showStopped = status === "stopped";
  const showError = status === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-black"
    >
      <div className="relative">
        <div className="aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="h-full w-full bg-black object-cover"
          />
        </div>

        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-danger">
          <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
          LIVE
        </div>
        {viewerCount > 0 && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium text-muted">
            <Users className="h-3 w-3" />
            {viewerCount}
          </div>
        )}

        {(showConnecting || showReconnecting) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-xs text-muted">
              {showReconnecting ? "Reconnecting…" : "Connecting to broadcast…"}
            </p>
          </div>
        )}
        {showStopped && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white">
            <WifiOff className="h-8 w-8 text-muted" />
            <p className="text-xs text-muted">Broadcast ended</p>
          </div>
        )}
        {showError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-white">
            <p className="text-xs text-danger text-center px-4">
              {error || "Live video unavailable"}
            </p>
            <button
              onClick={retry}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white/20"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 bg-[#0a0f1a] px-4 py-2">
        <Radio className="h-4 w-4 text-danger" />
        <p className="text-xs text-muted">
          Live broadcast — delivered directly from the broadcaster.
        </p>
      </div>
    </motion.div>
  );
}
