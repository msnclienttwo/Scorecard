"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CameraOff,
  Loader2,
  Mic,
  MicOff,
  Radio,
  SwitchCamera,
  VideoOff,
  WifiOff,
  Users,
  CheckCircle2,
  Circle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useWebRTCBroadcaster, type StudioStatus, type MediaReadyState } from "@/hooks/useWebRTCBroadcaster";
import type { BroadcastState } from "@/types/video";
import { cn } from "@/lib/utils";

function useElapsed(startedAt: string | null | undefined): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!startedAt) return "00:00";
  const secs = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const STATUS_LABEL: Record<StudioStatus, string> = {
  NOT_CONFIGURED: "Not configured",
  READY: "Offline",
  STARTING: "Starting…",
  LIVE: "On Air",
  RECONNECTING: "Reconnecting…",
  STOPPING: "Stopping…",
  ENDED: "Ended",
  ERROR: "Error",
};

function MediaStatusIndicator({ mediaReady }: { mediaReady: MediaReadyState }) {
  if (mediaReady === "idle") return null;

  const items: { label: string; state: "ok" | "pending" | "error" }[] = [];

  if (mediaReady === "requesting") {
    items.push({ label: "Camera", state: "pending" });
  } else if (mediaReady === "camera-ready") {
    items.push({ label: "Camera", state: "ok" });
    items.push({ label: "Microphone", state: "error" });
  } else if (mediaReady === "all-ready") {
    items.push({ label: "Camera", state: "ok" });
    items.push({ label: "Microphone", state: "ok" });
  } else if (mediaReady === "error") {
    items.push({ label: "Camera", state: "error" });
  }

  return (
    <div className="flex items-center gap-3 text-[11px]">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1">
          {item.state === "ok" && <CheckCircle2 className="h-3 w-3 text-success" />}
          {item.state === "pending" && <Circle className="h-3 w-3 text-warning animate-pulse" />}
          {item.state === "error" && <XCircle className="h-3 w-3 text-danger" />}
          <span className={cn(
            item.state === "ok" && "text-success",
            item.state === "pending" && "text-warning",
            item.state === "error" && "text-danger",
          )}>
            {item.label} {item.state === "ok" ? "ready" : item.state === "pending" ? "connecting…" : "unavailable"}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function GoLivePage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["broadcast", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}/broadcast`);
      if (!res.ok) throw new Error("Failed to load broadcast state");
      return res.json() as Promise<BroadcastState>;
    },
    staleTime: 0,
  });

  const studio = useWebRTCBroadcaster(matchId);
  const elapsed = useElapsed(studio.startedAt ?? data?.stream?.startedAt ?? null);
  const isLive = studio.status === "LIVE" || studio.status === "RECONNECTING";

  const stopAndLeave = useCallback(async () => {
    await studio.stop();
  }, [studio]);

  useEffect(() => {
    if (studio.status === "ENDED") {
      router.push(`/matches/${matchId}`);
    }
  }, [matchId, router, studio.status]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-24 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-muted" />
        <p className="text-white font-medium">Could not load broadcast state</p>
      </div>
    );
  }

  const myBroadcast = data.broadcaster?.status === "APPROVED" || data.canManage;

  if (!myBroadcast) {
    return (
      <div className="py-24 text-center">
        <CameraOff className="mx-auto mb-3 h-10 w-10 text-muted" />
        <p className="text-white font-medium">
          You are not an approved broadcaster for this match.
        </p>
        <p className="mt-1 text-sm text-muted">
          Ask the match creator to approve you, then come back to go live.
        </p>
        <Link
          href={`/matches/${matchId}`}
          className="mt-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/15"
        >
          Back to match
        </Link>
      </div>
    );
  }

  const showPreview = studio.cameraOn || isLive;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Go Live Studio</h1>
          <p className="text-sm text-muted">{data.match.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
              isLive ? "bg-danger/15 text-danger" : "bg-white/10 text-muted"
            )}
          >
            {isLive && <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />}
            {isLive ? `ON AIR · ${elapsed}` : STATUS_LABEL[studio.status]}
          </span>
          {studio.viewerCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-muted">
              <Users className="h-3.5 w-3.5" />
              {studio.viewerCount}
            </span>
          )}
        </div>
      </div>

      {studio.error && (
        <div className="rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {studio.error}
        </div>
      )}

      {!data.configured && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/5 px-3 py-2.5 text-xs text-warning">
          <AlertTriangle className="h-4 w-4" />
          {data.setupMessage ?? "Live video is not configured."}
        </div>
      )}

      {/* Camera / video preview — shown when camera is on or live */}
      {showPreview && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
            <video
              ref={studio.videoRefCallback}
              autoPlay
              playsInline
              muted
              className="aspect-video w-full object-cover"
            />
            {studio.status === "STARTING" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
              </div>
            )}
            {!studio.cameraOn && studio.status !== "STARTING" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                <CameraOff className="h-10 w-10 text-muted" />
              </div>
            )}
            {isLive && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-danger">
                <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                REC · {elapsed}
              </div>
            )}
            {studio.status === "RECONNECTING" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <p className="text-xs text-muted">Reconnecting signaling…</p>
              </div>
            )}
            {isLive && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-success/80 px-2.5 py-1 text-[11px] text-white">
                <WifiOff className="h-3 w-3 hidden" />
                Broadcasting to {studio.viewerCount} viewer
                {studio.viewerCount === 1 ? "" : "s"}
              </div>
            )}
          </div>

          <MediaStatusIndicator mediaReady={studio.mediaReady} />
        </div>
      )}

      {/* Go Live button — hidden while camera is active or live */}
      {!showPreview && studio.status !== "ERROR" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          <button
            onClick={() => void studio.start()}
            disabled={!data.configured || studio.status === "STOPPING"}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-danger/20 px-6 py-4 text-lg font-bold text-danger transition-colors hover:bg-danger/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Radio className="h-5 w-5" />
            Go Live
          </button>
          <p className="text-center text-xs text-muted">
            Uses your device camera and microphone. Viewers connect peer-to-peer
            over WebRTC — no third-party streaming service.
          </p>
        </motion.div>
      )}

      {/* Controls — shown once live */}
      {isLive && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={studio.toggleMute}
              className="rounded-full bg-white/10 p-3.5 text-white transition-colors hover:bg-white/15"
              aria-label="Toggle microphone"
            >
              {studio.muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              onClick={() => void studio.flipCamera()}
              className="rounded-full bg-white/10 p-3.5 text-white transition-colors hover:bg-white/15"
              aria-label="Switch camera"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
            <button
              onClick={() => void stopAndLeave()}
              disabled={studio.status === "STOPPING"}
              className="inline-flex items-center gap-2 rounded-full bg-danger px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-danger/80 disabled:opacity-50"
            >
              {studio.status === "STOPPING" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <VideoOff className="h-4 w-4" />
              )}
              Stop Broadcast
            </button>
          </div>
          <p className="text-center text-xs text-muted">
            Highlights are cut automatically from a rolling buffer on fours,
            sixes and wickets while you are on air.
          </p>
        </div>
      )}
    </div>
  );
}
