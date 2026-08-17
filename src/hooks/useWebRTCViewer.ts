"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ClientIceServer } from "@/types/video";
import { getClientSignalingUrl } from "@/lib/video/signaling-url";

export type ViewerVideoStatus =
  | "idle"
  | "connecting"
  | "live"
  | "reconnecting"
  | "stopped"
  | "error";

/**
 * Joins the broadcast room as a viewer and negotiates a single
 * RTCPeerConnection with the broadcaster. The broadcaster always initiates the
 * offer; the viewer answers and exchanges ICE candidates through the Socket.IO
 * signaling relay. No auth is required to watch a public broadcast.
 *
 * Uses a dedicated signaling socket that connects to the standalone signaling
 * server (NEXT_PUBLIC_WEBRTC_SIGNALING_URL). This is required because on Vercel
 * the signaling server runs independently of the Next.js app.
 */
export function useWebRTCViewer(
  matchId: string,
  iceServers: ClientIceServer[] = []
) {
  const [status, setStatusState] = useState<ViewerVideoStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const statusRef = useRef<ViewerVideoStatus>("idle");
  const joinedRef = useRef(false);
  const signalingRef = useRef<Socket | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setStatus = useCallback((s: ViewerVideoStatus) => {
    statusRef.current = s;
    setStatusState(s);
  }, []);

  const cleanupPeer = useCallback(() => {
    const pc = pcRef.current;
    pcRef.current = null;
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      try {
        pc.close();
      } catch {
        // already closed
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

  const join = useCallback(() => {
    const socket = signalingRef.current;
    if (!socket || joinedRef.current) return;
    joinedRef.current = true;
    setStatus("connecting");
    socket.emit("broadcast:join", { matchId, role: "viewer" });
  }, [matchId, setStatus]);

  // Offer handling (broadcaster always initiates).
  const handleOffer = useCallback(
    async (payload: { offer: unknown; from: string }) => {
      if (!payload?.offer || typeof payload.from !== "string") return;
      cleanupPeer();
      // Cancel the connection timeout — we received an offer.
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      setStatus("connecting");

      const pc = new RTCPeerConnection({
        iceServers: iceServers.map((s) => ({ ...s })),
      });
      pcRef.current = pc;

      pc.ontrack = (e) => {
        const video = videoRef.current;
        if (!video) return;
        const remoteStream = e.streams[0] ?? new MediaStream([e.track]);
        if (video.srcObject !== remoteStream) {
          video.srcObject = remoteStream;
          video.autoplay = true;
          video.playsInline = true;
          void video.play().catch(() => {});
        }
        setStatus("live");
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          signalingRef.current?.emit("broadcast:ice", {
            to: payload.from,
            candidate: e.candidate.toJSON(),
          });
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          if (pcRef.current === pc) cleanupPeer();
          setStatus("stopped");
        }
      };

      try {
        await pc.setRemoteDescription(payload.offer as RTCSessionDescriptionInit);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        signalingRef.current?.emit("broadcast:answer", {
          to: payload.from,
          answer: pc.localDescription!.toJSON(),
        });
      } catch {
        cleanupPeer();
        setError("Could not negotiate the live stream.");
        setStatus("error");
      }
    },
    [cleanupPeer, iceServers, setStatus]
  );

  // Create and manage the dedicated signaling socket.
  useEffect(() => {
    const socketUrl = getClientSignalingUrl();
    const socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    signalingRef.current = socket;

    // WebRTC signaling events.
    const onOffer = (payload: { offer: unknown; from: string }) => {
      void handleOffer(payload);
    };
    const onIce = (payload: { candidate: unknown; from: string }) => {
      const pc = pcRef.current;
      if (pc && payload?.candidate) {
        void pc
          .addIceCandidate(payload.candidate as RTCIceCandidateInit)
          .catch(() => {});
      }
    };
    const onCount = (payload: { count: number }) => {
      if (typeof payload?.count === "number") setViewerCount(payload.count);
    };
    const onStopped = () => {
      cleanupPeer();
      joinedRef.current = false;
      setStatus("stopped");
    };
    const onError = (payload: { message?: string }) => {
      setError(payload?.message ?? "Could not connect to the broadcast.");
      setStatus("error");
    };
    const onConnect = () => {
      join();
    };
    const onDisconnect = () => {
      cleanupPeer();
      joinedRef.current = false;
      if (statusRef.current === "live" || statusRef.current === "connecting") {
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

    socket.connect();

    // Connection timeout: if no offer arrives within 15 seconds of joining,
    // show an error with retry option instead of spinning forever.
    const connectionTimeout = window.setTimeout(() => {
      if (
        statusRef.current === "connecting" ||
        statusRef.current === "idle"
      ) {
        setError(
          "Unable to connect to broadcast. The broadcaster may not be live, or the signaling server may be unreachable."
        );
        setStatus("error");
      }
    }, 15_000);

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      socket.off("broadcast:offer", onOffer);
      socket.off("broadcast:ice", onIce);
      socket.off("broadcast:viewer-count", onCount);
      socket.off("broadcast:stopped", onStopped);
      socket.off("broadcast:error", onError);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.emit("broadcast:leave");
      cleanupPeer();
      cleanupSignaling();
    };
  }, [cleanupPeer, cleanupSignaling, handleOffer, join, matchId, setStatus]);

  // Leave the room on unmount.
  useEffect(() => {
    return () => {
      signalingRef.current?.emit("broadcast:leave");
    };
  }, []);

  const retry = useCallback(() => {
    setError(null);
    joinedRef.current = false;
    cleanupPeer();
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    const socket = signalingRef.current;
    if (socket) {
      if (!socket.connected) {
        socket.connect();
      } else {
        join();
      }
    }
  }, [cleanupPeer, join]);

  return { videoRef, status, error, viewerCount, retry };
}
