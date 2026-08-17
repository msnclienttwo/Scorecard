"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocketStore } from "@/store/useSocketStore";
import type { ClientIceServer } from "@/types/video";

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

  const { connect, isConnected, socket } = useSocketStore();

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

  const join = useCallback(() => {
    if (joinedRef.current) return;
    joinedRef.current = true;
    setStatus("connecting");
    socket?.emit("broadcast:join", { matchId, role: "viewer" });
  }, [matchId, setStatus, socket]);

  // Offer handling (broadcaster always initiates).
  const handleOffer = useCallback(
    async (payload: { offer: unknown; from: string }) => {
      if (!payload?.offer || typeof payload.from !== "string") return;
      cleanupPeer();
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
          socket?.emit("broadcast:ice", {
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
        socket?.emit("broadcast:answer", {
          to: payload.from,
          answer: pc.localDescription!.toJSON(),
        });
      } catch {
        cleanupPeer();
        setError("Could not negotiate the live stream.");
        setStatus("error");
      }
    },
    [cleanupPeer, iceServers, setStatus, socket]
  );

  // Persistent socket listeners.
  useEffect(() => {
    if (!socket) return;

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

    socket.on("broadcast:offer", onOffer);
    socket.on("broadcast:ice", onIce);
    socket.on("broadcast:viewer-count", onCount);
    socket.on("broadcast:stopped", onStopped);
    socket.on("broadcast:error", onError);

    return () => {
      socket.off("broadcast:offer", onOffer);
      socket.off("broadcast:ice", onIce);
      socket.off("broadcast:viewer-count", onCount);
      socket.off("broadcast:stopped", onStopped);
      socket.off("broadcast:error", onError);
    };
  }, [cleanupPeer, handleOffer, setStatus, socket]);

  // Join once the socket is up; rejoin after reconnects.
  useEffect(() => {
    if (isConnected) {
      join();
    }
  }, [isConnected, join]);

  useEffect(() => {
    if (!socket) return;
    const onDisconnect = () => {
      cleanupPeer();
      joinedRef.current = false;
      if (statusRef.current === "live" || statusRef.current === "connecting") {
        setStatus("reconnecting");
      }
    };
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("disconnect", onDisconnect);
    };
  }, [cleanupPeer, setStatus, socket]);

  // Leave the room + close the peer on unmount.
  useEffect(() => {
    return () => {
      socket?.emit("broadcast:leave");
      cleanupPeer();
    };
  }, [cleanupPeer, socket]);

  return { videoRef, status, error, viewerCount };
}
