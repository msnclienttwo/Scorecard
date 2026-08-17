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
  const connectionTimeoutRef = useRef<number | null>(null);
  // Use a ref for iceServers so handleOffer doesn't change when query refetches,
  // which would cause the entire signaling effect to rerun and break the connection.
  const iceServersRef = useRef<ClientIceServer[]>(iceServers);
  iceServersRef.current = iceServers;

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
      pc.oniceconnectionstatechange = null;
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
    console.log(`[WebRTC Viewer] joining match ${matchId} as viewer`);
    socket.emit("broadcast:join", { matchId, role: "viewer" });
  }, [matchId, setStatus]);

  // Offer handling (broadcaster always initiates).
  // Uses iceServersRef.current so this callback never changes when the query
  // refetches, preventing the signaling effect from tearing down.
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
      console.log(`[WebRTC Viewer] offer received from ${payload.from}`);

      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current.map((s) => ({ ...s })),
      });
      pcRef.current = pc;

      pc.ontrack = (e) => {
        console.log("[WebRTC Viewer] ontrack received");
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
        console.log("[WebRTC Viewer] video playing - status: live");
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
        console.log(`[WebRTC Viewer] ICE state: ${pc.iceConnectionState}`);
      };
      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC Viewer] connection state: ${pc.connectionState}`);
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
        console.log(`[WebRTC Viewer] answer sent to ${payload.from}`);
      } catch (err) {
        console.error("[WebRTC Viewer] offer handling failed:", err);
        cleanupPeer();
        setError("Could not negotiate the live stream.");
        setStatus("error");
      }
    },
    [cleanupPeer, setStatus]
  );

  // Create and manage the dedicated signaling socket.
  // IMPORTANT: dependencies are stable callbacks only — NOT iceServers.
  // iceServers is accessed via iceServersRef to prevent this effect from
  // rerunning when the query refetches (which would destroy the connection).
  useEffect(() => {
    const socketUrl = getClientSignalingUrl();
    console.log(`[WebRTC Viewer] connecting to signaling server: ${socketUrl}`);
    const socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
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
      console.log(`[WebRTC Viewer] connected to signaling - socket ${socket.id}`);
      join();
    };
    const onDisconnect = (reason: string) => {
      console.log(`[WebRTC Viewer] disconnected from signaling: ${reason}`);
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

    // Connection timeout: if no offer arrives within 45 seconds,
    // show an error with retry option. This is long enough for Render free
    // tier cold starts (30-60s) while still providing feedback.
    connectionTimeoutRef.current = window.setTimeout(() => {
      if (
        statusRef.current === "connecting" ||
        statusRef.current === "idle"
      ) {
        console.error("[WebRTC Viewer] connection timeout - no offer received within 45s");
        setError(
          "Unable to connect to broadcast. The broadcaster may not be live, or the signaling server may be unreachable."
        );
        setStatus("error");
      }
    }, 45_000);

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      socket.off("broadcast:offer", onOffer);
      socket.off("broadcast:ice", onIce);
      socket.off("broadcast:viewer-count", onCount);
      socket.off("broadcast:stopped", onStopped);
      socket.off("broadcast:error", onError);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.emit("broadcast:leave");
      joinedRef.current = false;
      cleanupPeer();
      cleanupSignaling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Leave the room on unmount.
  useEffect(() => {
    return () => {
      signalingRef.current?.emit("broadcast:leave");
    };
  }, []);

  /**
   * Retry: destroy the old socket entirely and create a fresh one.
   * This is necessary because after exhausting reconnection attempts,
   * Socket.IO's socket may be in a dead state where connect() doesn't
   * reliably restart. Creating a new socket is the robust approach.
   */
  const retry = useCallback(() => {
    console.log("[WebRTC Viewer] retrying connection");
    setError(null);
    joinedRef.current = false;
    cleanupPeer();
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    // Destroy old socket completely.
    cleanupSignaling();

    // Create a fresh socket and connect.
    const socketUrl = getClientSignalingUrl();
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
      console.log(`[WebRTC Viewer] retry connected - socket ${socket.id}`);
      join();
    };
    const onDisconnect = (reason: string) => {
      console.log(`[WebRTC Viewer] retry disconnected: ${reason}`);
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

    // Start a new connection timeout for the retry.
    connectionTimeoutRef.current = window.setTimeout(() => {
      if (
        statusRef.current === "connecting" ||
        statusRef.current === "idle"
      ) {
        setError(
          "Unable to connect to broadcast. The broadcaster may not be live, or the signaling server may be unreachable."
        );
        setStatus("error");
      }
    }, 45_000);
  }, [cleanupPeer, cleanupSignaling, handleOffer, join, setStatus]);

  return { videoRef, status, error, viewerCount, retry };
}
