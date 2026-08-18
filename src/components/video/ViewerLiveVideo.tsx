"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Radio,
  Users,
  WifiOff,
  RefreshCw,
  Link2,
  VolumeX,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "@/store/useSocketStore";
import { useWebRTCViewer } from "@/hooks/useWebRTCViewer";
import type { BroadcastState, ClientIceServer } from "@/types/video";

/**
 * Live video block for the public score page. Sits above the score banner.
 *
 * Does NOT auto-connect to WebRTC — shows a "Watch Live" card when a broadcast
 * is live, and only initializes the viewer after the user clicks the button.
 * Requires authentication before watching.
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

  return <LiveVideoFeed matchId={matchId} iceServers={stream.iceServers ?? []} />;
}

// ---------------------------------------------------------------------------
// Inner feed component — only rendered when stream is LIVE
// ---------------------------------------------------------------------------

function LiveVideoFeed({
  matchId,
  iceServers,
}: {
  matchId: string;
  iceServers: ClientIceServer[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    videoRef,
    status,
    viewerCount,
    error,
    retry,
    startWatching,
    needsUnmute,
    unmute,
  } = useWebRTCViewer(matchId, iceServers);

  const [showCopied, setShowCopied] = useState(false);

  const isIdle = status === "idle";
  const isConnecting = status === "connecting" || status === "negotiating";
  const isLive = status === "live";
  const isReconnecting = status === "reconnecting";
  const isStopped = status === "stopped";
  const isError = status === "error";

  // --- Auth-gated Watch Live ---
  const handleWatchLive = () => {
    if (!session?.user) {
      router.push(
        `/login?callbackUrl=${encodeURIComponent(`/score/${matchId}`)}`
      );
      return;
    }
    startWatching();
  };

  // --- Share ---
  const handleShare = async () => {
    const url = `${window.location.origin}/score/${matchId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Watch Live", url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

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

        {/* LIVE badge — only when actually playing */}
        {isLive && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-danger">
            <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
            LIVE
          </div>
        )}

        {/* Viewer count */}
        {isLive && viewerCount > 0 && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium text-muted">
            <Users className="h-3 w-3" />
            {viewerCount}
          </div>
        )}

        {/* ---- IDLE: Watch Live card ---- */}
        {isIdle && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
            <div className="flex items-center gap-1.5 text-danger">
              <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
              <span className="text-xs font-bold">LIVE</span>
            </div>
            <p className="text-sm text-white/80">Live video is available</p>
            <button
              onClick={handleWatchLive}
              className="flex items-center gap-2 rounded-full bg-danger px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-danger/25 transition-all hover:bg-danger/90 hover:shadow-xl hover:shadow-danger/30 active:scale-[0.98]"
            >
              <Radio className="h-4 w-4" />
              Watch Live
            </button>
          </div>
        )}

        {/* ---- CONNECTING / NEGOTIATING ---- */}
        {(isConnecting || isReconnecting) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
            {isReconnecting ? (
              <RefreshCw className="h-6 w-6 text-muted animate-spin" />
            ) : (
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            )}
            <p className="text-xs text-muted">
              {isReconnecting ? "Reconnecting\u2026" : "Connecting to broadcast\u2026"}
            </p>
          </div>
        )}

        {/* ---- STOPPED ---- */}
        {isStopped && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
            <WifiOff className="h-8 w-8 text-muted" />
            <p className="text-xs text-muted">Live stream ended</p>
          </div>
        )}

        {/* ---- ERROR ---- */}
        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
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

        {/* ---- ENABLE SOUND ---- */}
        {isLive && needsUnmute && (
          <button
            onClick={unmute}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-black/90"
          >
            <VolumeX className="h-3 w-3" />
            Enable Sound
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between bg-[#0a0f1a] px-4 py-2">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-danger" />
          <p className="text-xs text-muted">
            Live broadcast — delivered directly from the broadcaster.
          </p>
        </div>
        {isLive && (
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <Link2 className="h-3 w-3" />
            {showCopied ? "Copied!" : "Share Live"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
