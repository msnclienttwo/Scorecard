"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ClientIceServer } from "@/types/video";
import { getClientSignalingUrl } from "@/lib/video/signaling-url";

export type ViewerVideoStatus =
  | "idle"
  | "connecting"
  | "negotiating"
  | "live"
  | "reconnecting"
  | "stopped"
  | "error";

/**
 * Joins the broadcast room as a viewer and negotiates a single
 * RTCPeerConnection with the broadcaster.
 *
 * Does NOT auto-connect — call `startWatching()` to initiate the connection
 * (e.g. after the user clicks "Watch Live").
 *
 * ICE candidate queueing: candidates received before setRemoteDescription are
 * buffered and flushed afterwards, preventing the black-screen race condition.
 *
 * Autoplay: tries unmuted first; on NotAllowedError falls back to muted and
 * exposes `needsUnmute` / `unmute` so the UI can show an "Enable Sound" button.
 *
 * Reconnection: on temporary signaling/WebRTC failure the hook automatically
 * attempts recovery (ICE restart, socket reconnect, re-join).
 */
export function useWebRTCViewer(
  matchId: string,
  iceServers: ClientIceServer[] = []
) {
  const [status, setStatusState] = useState<ViewerVideoStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [needsUnmute, setNeedsUnmute] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const statusRef = useRef<ViewerVideoStatus>("idle");
  const joinedRef = useRef(false);
  const signalingRef = useRef<Socket | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iceRestartCountRef = useRef(0);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const watchingRef = useRef(false);
  const iceServersRef = useRef<ClientIceServer[]>(iceServers);
  iceServersRef.current = iceServers;

  const setStatus = useCallback((s: ViewerVideoStatus) => {
    statusRef.current = s;
    setStatusState(s);
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup helpers
  // ---------------------------------------------------------------------------

  const cleanupPeer = useCallback(() => {
    const pc = pcRef.current;
    pcRef.current = null;
    iceQueueRef.current = [];
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      try {
        pc.close();
      } catch {
        /* already closed */
      }
    }
  }, []);

  const cleanupSignaling = useCallback(() => {
    const s = signalingRef.current;
    signalingRef.current = null;
    if (s) {
      s.removeAllListeners();
      s.disconnect();
    }
  }, []);

  const clearConnectionTimeout = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Video playback — tries unmuted, falls back to muted
  // ---------------------------------------------------------------------------

  const tryPlayVideo = useCallback((video: HTMLVideoElement) => {
    video.muted = false;
    video.play()
      .then(() => {
        console.log("[WebRTC Viewer] video playback started (unmuted)");
        setNeedsUnmute(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          console.log("[WebRTC Viewer] autoplay blocked, trying muted");
          video.muted = true;
          video.play()
            .then(() => {
              console.log("[WebRTC Viewer] video playback started (muted) — enable sound available");
              setNeedsUnmute(true);
            })
            .catch(() => {});
        }
      });
  }, []);

  const unmute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.play()
      .then(() => {
        setNeedsUnmute(false);
        console.log("[WebRTC Viewer] sound enabled by user");
      })
      .catch(() => {
        /* keep showing enable sound button */
      });
  }, []);

  // ---------------------------------------------------------------------------
  // Offer handling (broadcaster always initiates)
  // ---------------------------------------------------------------------------

  const handleOffer = useCallback(
    async (payload: { offer: unknown; from: string }) => {
      if (!payload?.offer || typeof payload.from !== "string") return;
      cleanupPeer();
      clearConnectionTimeout();
      setStatus("negotiating");
      console.log(`[WebRTC Viewer] offer received from ${payload.from}`);

      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current.map((s) => ({ ...s })),
      });
      pcRef.current = pc;

      // Reset ICE restart counter on fresh offer
      iceRestartCountRef.current = 0;

      pc.ontrack = (e) => {
        console.log(`[WebRTC Viewer] remote track received: ${e.track.kind}`);
        const video = videoRef.current;
        if (!video) return;
        const remoteStream = e.streams[0] ?? new MediaStream([e.track]);
        if (video.srcObject !== remoteStream) {
          video.srcObject = remoteStream;
          video.autoplay = true;
          video.playsInline = true;
          tryPlayVideo(video);
        }
        // Only transition to live when ICE is also connected
        if (
          pc.iceConnectionState === "connected" ||
          pc.iceConnectionState === "completed"
        ) {
          setStatus("live");
          console.log("[WebRTC Viewer] connection live — remote tracks playing");
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          signalingRef.current?.emit("broadcast:ice", {
            to: payload.from,
            candidate: e.candidate.toJSON(),
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log(`[WebRTC Viewer] ICE state: ${state}`);

        if (state === "connected" || state === "completed") {
          // If remote tracks already arrived, go live
          const video = videoRef.current;
          if (video?.srcObject) {
            setStatus("live");
            console.log("[WebRTC Viewer] connection live (ICE connected)");
          }
        } else if (state === "failed") {
          console.log("[WebRTC Viewer] ICE connection failed");
          if (iceRestartCountRef.current < 3) {
            iceRestartCountRef.current++;
            console.log(
              `[WebRTC Viewer] attempting ICE restart (${iceRestartCountRef.current}/3)`
            );
            setStatus("reconnecting");
            try {
              pc.restartIce();
            } catch {
              cleanupPeer();
              setStatus("error");
              setError("Connection lost.");
            }
          } else {
            cleanupPeer();
            setStatus("error");
            setError("Connection lost after multiple attempts.");
          }
        } else if (state === "disconnected") {
          console.log("[WebRTC Viewer] ICE disconnected — waiting for recovery");
          setTimeout(() => {
            if (
              pc.iceConnectionState === "disconnected" &&
              pcRef.current === pc
            ) {
              setStatus("reconnecting");
            }
          }, 3000);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(
          `[WebRTC Viewer] connection state: ${pc.connectionState}`
        );
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          if (pcRef.current === pc) {
            cleanupPeer();
            setStatus("stopped");
          }
        }
      };

      try {
        await pc.setRemoteDescription(
          payload.offer as RTCSessionDescriptionInit
        );
        console.log("[WebRTC Viewer] remote description set");

        // Flush queued ICE candidates
        const queued = iceQueueRef.current.splice(0);
        for (const candidate of queued) {
          try {
            await pc.addIceCandidate(candidate);
            console.log("[WebRTC Viewer] queued ICE candidate applied");
          } catch {
            /* best-effort */
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        signalingRef.current?.emit("broadcast:answer", {
          to: payload.from,
          answer: pc.localDescription!.toJSON(),
        });
        console.log(`[WebRTC Viewer] answer sent to ${payload.from}`);
      } catch (err) {
        console.error("[WebRTC Viewer] offer handling failed:", err);
        cleanupPeer();
        setError("Could not negotiate the live stream.");
        setStatus("error");
      }
    },
    [cleanupPeer, clearConnectionTimeout, setStatus, tryPlayVideo]
  );

  // ---------------------------------------------------------------------------
  // Socket factory
  // ---------------------------------------------------------------------------

  const createSignalingSocket = useCallback(() => {
    const socketUrl = getClientSignalingUrl();
    console.log(
      `[WebRTC Viewer] connecting to signaling server: ${socketUrl}`
    );
    const socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
    });
    signalingRef.current = socket;

    const onOffer = (payload: { offer: unknown; from: string }) => {
      void handleOffer(payload);
    };
    const onIce = (payload: { candidate: unknown; from: string }) => {
      const pc = pcRef.current;
      if (payload?.candidate) {
        if (pc && pc.remoteDescription) {
          void pc
            .addIceCandidate(payload.candidate as RTCIceCandidateInit)
            .catch(() => {});
          console.log("[WebRTC Viewer] ICE candidate applied");
        } else {
          iceQueueRef.current.push(
            payload.candidate as RTCIceCandidateInit
          );
          console.log("[WebRTC Viewer] ICE candidate queued");
        }
      }
    };
    const onCount = (payload: { count: number }) => {
      if (typeof payload?.count === "number") setViewerCount(payload.count);
    };
    const onStopped = () => {
      console.log("[WebRTC Viewer] broadcast stopped by server");
      cleanupPeer();
      joinedRef.current = false;
      setStatus("stopped");
    };
    const onError = (payload: { message?: string }) => {
      console.error("[WebRTC Viewer] server error:", payload?.message);
      setError(payload?.message ?? "Could not connect to the broadcast.");
      setStatus("error");
    };
    const onConnect = () => {
      console.log(
        `[WebRTC Viewer] connected to signaling — socket ${socket.id}`
      );
      if (!joinedRef.current) {
        joinedRef.current = true;
        console.log(`[WebRTC Viewer] joining match ${matchId} as viewer`);
        socket.emit("broadcast:join", { matchId, role: "viewer" });
      }
    };
    const onDisconnect = (reason: string) => {
      console.log(`[WebRTC Viewer] disconnected from signaling: ${reason}`);
      cleanupPeer();
      joinedRef.current = false;
      const cur = statusRef.current;
      if (cur === "live" || cur === "connecting" || cur === "negotiating") {
        setStatus("reconnecting");
      }
    };

    socket.on("broadcast:offer", onOffer);
    socket.on("broadcast:ice", onIce);
    socket.on("broadcast:viewer-count", onCount);
    socket.on("broadcast:stopped", onStopped);
    socket.on("broadcast:error", onError);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return socket;
  }, [matchId, handleOffer, cleanupPeer, setStatus]);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Initialize and start watching the broadcast. */
  const startWatching = useCallback(() => {
    if (watchingRef.current) return;
    watchingRef.current = true;
    setError(null);
    setNeedsUnmute(false);
    setStatus("connecting");

    const socket = createSignalingSocket();
    socket.connect();

    // Connection timeout — long enough for Render free-tier cold starts
    connectionTimeoutRef.current = setTimeout(() => {
      if (
        statusRef.current === "connecting" ||
        statusRef.current === "idle"
      ) {
        console.error("[WebRTC Viewer] connection timeout — no offer within 45 s");
        setError(
          "Unable to connect to broadcast. The broadcaster may not be live, or the signaling server may be unreachable."
        );
        setStatus("error");
      }
    }, 45_000);
  }, [createSignalingSocket, setStatus]);

  /** Full clean reset and reconnect. */
  const retry = useCallback(() => {
    console.log("[WebRTC Viewer] retrying connection");
    watchingRef.current = false;
    setError(null);
    setNeedsUnmute(false);
    joinedRef.current = false;
    cleanupPeer();
    clearConnectionTimeout();
    cleanupSignaling();

    // Brief delay then reconnect with a fresh socket
    setTimeout(() => {
      watchingRef.current = true;
      setStatus("connecting");

      const socket = createSignalingSocket();
      socket.connect();

      connectionTimeoutRef.current = setTimeout(() => {
        if (
          statusRef.current === "connecting" ||
          statusRef.current === "idle"
        ) {
          setError("Unable to connect to broadcast.");
          setStatus("error");
        }
      }, 45_000);
    }, 500);
  }, [
    cleanupPeer,
    clearConnectionTimeout,
    cleanupSignaling,
    createSignalingSocket,
    setStatus,
  ]);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      clearConnectionTimeout();
      cleanupPeer();
      cleanupSignaling();
    };
  }, [clearConnectionTimeout, cleanupPeer, cleanupSignaling]);

  // Leave the room on unmount
  useEffect(() => {
    return () => {
      signalingRef.current?.emit("broadcast:leave");
    };
  }, []);

  return {
    videoRef,
    status,
    error,
    viewerCount,
    retry,
    startWatching,
    needsUnmute,
    unmute,
  };
}
