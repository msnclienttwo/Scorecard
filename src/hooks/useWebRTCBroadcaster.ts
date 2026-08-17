"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ClientIceServer, GoLiveInfo } from "@/types/video";
import { getClientSignalingUrl } from "@/lib/video/signaling-url";

export type StudioStatus =
  | "NOT_CONFIGURED"
  | "READY"
  | "STARTING"
  | "LIVE"
  | "RECONNECTING"
  | "STOPPING"
  | "ENDED"
  | "ERROR";

export type MediaReadyState =
  | "idle"
  | "requesting"
  | "camera-ready"
  | "mic-ready"
  | "all-ready"
  | "error";

const DEFAULT_PRE_ROLL_SECONDS = 10;
const DEFAULT_POST_ROLL_SECONDS = 5;

interface RollingChunk {
  id: number;
  blob: Blob;
}

interface RollingRecorder {
  recorder: MediaRecorder;
  chunks: RollingChunk[];
  seq: number;
}

/**
 * Drives the broadcaster's side of the mesh WebRTC broadcast:
 *  - camera/mic capture with preview
 *  - one RTCPeerConnection per viewer (offers are always created here)
 *  - a dedicated authenticated Socket.IO connection for signaling
 *  - a rolling MediaRecorder window (~10s) that cuts clips on scoring events
 *    and uploads them to the highlight upload route (~5s post-roll tail)
 */
export function useWebRTCBroadcaster(matchId: string) {
  const [status, setStatusState] = useState<StudioStatus>("READY");
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [cameraOn, setCameraOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [mediaReady, setMediaReady] = useState<MediaReadyState>("idle");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceServersRef = useRef<ClientIceServer[]>([]);
  const signalingRef = useRef<Socket | null>(null);
  const deviceIndexRef = useRef(0);
  const statusRef = useRef<StudioStatus>("READY");
  const mutedRef = useRef(false);
  const recorderRef = useRef<RollingRecorder | null>(null);
  const postRollTimerRef = useRef<number | null>(null);
  const preRollSecondsRef = useRef(DEFAULT_PRE_ROLL_SECONDS);
  const postRollSecondsRef = useRef(DEFAULT_POST_ROLL_SECONDS);

  const setStatus = useCallback((s: StudioStatus) => {
    statusRef.current = s;
    setStatusState(s);
  }, []);

  // ---------------------------------------------------------------------------
  // Media helpers
  // ---------------------------------------------------------------------------

  /**
   * Attach (or re-attach) a MediaStream to the broadcaster preview <video>.
   * This is intentionally idempotent — safe to call repeatedly.
   */
  const attachStream = useCallback((stream: MediaStream | null) => {
    const video = videoRef.current;
    if (!video || !stream) return;
    if (video.srcObject === stream) return;
    video.srcObject = stream;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    void video.play().catch(() => {});
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
    setMediaReady("idle");
  }, []);

  /**
   * Open camera/mic with graceful fallback.
   *
   * 1. Try preferred constraints (front camera, 720p, 30fps)
   * 2. On OverconstrainedError, fall back to basic true constraints
   * 3. Handle NotAllowedError / NotFoundError / NotReadableError / SecurityError
   */
  const openCamera = useCallback(async (preferDeviceId?: string): Promise<MediaStream> => {
    setMediaReady("requesting");

    const preferred: MediaStreamConstraints = {
      video: preferDeviceId
        ? { deviceId: { exact: preferDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } }
        : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };

    const fallback: MediaStreamConstraints = {
      video: preferDeviceId ? { deviceId: { exact: preferDeviceId } } : true,
      audio: true,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(preferred);
      return validateAndReportTracks(stream);
    } catch (err) {
      if (err instanceof DOMException && err.name === "OverconstrainedError") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(fallback);
          return validateAndReportTracks(stream);
        } catch (fallbackErr) {
          throw describeMediaError(fallbackErr);
        }
      }
      throw describeMediaError(err);
    }
  }, []);

  /** Validate that the stream has live tracks and update ready state. */
  function validateAndReportTracks(stream: MediaStream): MediaStream {
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    if (videoTracks.length === 0) {
      stream.getTracks().forEach((t) => t.stop());
      setMediaReady("error");
      throw new Error("Camera stream has no video track. Check that a camera is connected and not in use by another application.");
    }

    const vt = videoTracks[0];
    if (vt.readyState !== "live" || !vt.enabled) {
      stream.getTracks().forEach((t) => t.stop());
      setMediaReady("error");
      throw new Error("Camera video track is not live. The device may be unavailable or blocked.");
    }

    setMediaReady(audioTracks.length > 0 ? "all-ready" : "camera-ready");
    return stream;
  }

  /** Turn a MediaError / DOMException into a user-friendly message. */
  function describeMediaError(err: unknown): Error {
    if (err instanceof DOMException) {
      switch (err.name) {
        case "NotAllowedError":
        case "SecurityError":
          return new Error("Camera/microphone access was denied. Please allow permissions and try again.");
        case "NotFoundError":
          return new Error("No camera or microphone found on this device.");
        case "NotReadableError":
          return new Error("Camera is in use by another application or not responding.");
        case "OverconstrainedError":
          return new Error("The camera does not support the requested resolution. Try a different device.");
        default:
          return new Error(`Camera error: ${err.message}`);
      }
    }
    if (err instanceof Error) return err;
    return new Error("Could not access the camera/microphone.");
  }

  // ---------------------------------------------------------------------------
  // Keep the <video> preview in sync with the current MediaStream.
  //
  // This effect solves the critical timing bug where attachStream() was called
  // before the <video> element existed in the DOM (because it is conditionally
  // rendered only when isLive is true). Now we re-attach whenever either the
  // ref or the stream changes.
  // ---------------------------------------------------------------------------

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && localStream) {
      if (video.srcObject !== localStream) {
        video.srcObject = localStream;
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        void video.play().catch(() => {});
      }
    }
  }, [localStream]);

  // Also re-attach when the ref callback fires (video element mounts).
  const videoRefCallback = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (node && localStream) {
        if (node.srcObject !== localStream) {
          node.srcObject = localStream;
          node.muted = true;
          node.autoplay = true;
          node.playsInline = true;
          void node.play().catch(() => {});
        }
      }
    },
    [localStream]
  );

  // ---------------------------------------------------------------------------
  // Peer management (mesh)
  // ---------------------------------------------------------------------------

  const closePeers = useCallback(() => {
    peersRef.current.forEach((pc) => {
      try {
        pc.close();
      } catch {
        // already closed
      }
    });
    peersRef.current.clear();
  }, []);

  const createOffer = useCallback(async (viewerSocketId: string) => {
    const stream = streamRef.current;
    const socket = signalingRef.current;
    if (!stream || !socket) return;

    console.log(`[WebRTC Broadcaster] creating offer for viewer ${viewerSocketId}`);
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current.map((s) => ({ ...s })),
    });
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("broadcast:ice", {
          to: viewerSocketId,
          candidate: e.candidate.toJSON(),
        });
      }
    };
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC Broadcaster] ICE state for viewer ${viewerSocketId}: ${pc.iceConnectionState}`);
    };
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC Broadcaster] connection state for viewer ${viewerSocketId}: ${pc.connectionState}`);
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        const live = peersRef.current.get(viewerSocketId);
        if (live === pc) {
          peersRef.current.delete(viewerSocketId);
          socket.emit("broadcast:viewer-left", { socketId: viewerSocketId });
        }
      }
    };

    peersRef.current.set(viewerSocketId, pc);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("broadcast:offer", {
        to: viewerSocketId,
        offer: pc.localDescription!.toJSON(),
      });
      console.log(`[WebRTC Broadcaster] offer sent to viewer ${viewerSocketId}`);
    } catch {
      peersRef.current.delete(viewerSocketId);
      try {
        pc.close();
      } catch {
        // ignore
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Highlight recorder (rolling ~10s pre-roll, ~5s post-roll)
  // ---------------------------------------------------------------------------

  const pickMimeType = useCallback((): string => {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];
    if (typeof MediaRecorder === "undefined") return "video/webm";
    for (const c of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(c)) return c;
      } catch {
        // fall through
      }
    }
    return "video/webm";
  }, []);

  const startRecorder = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === "undefined") return;

    // Do not start the recorder if there is no video track.
    if (stream.getVideoTracks().length === 0) return;

    const mime = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_500_000 });
    } catch {
      recorder = new MediaRecorder(stream);
    }

    const chunks: RollingChunk[] = [];
    let seq = 0;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push({ id: ++seq, blob: e.data });
        // 1s timeslices — keep roughly the pre-roll window (plus one slice).
        while (chunks.length > preRollSecondsRef.current + 1) chunks.shift();
      }
    };
    recorder.start(1000); // 1s timeslices so the window stays fresh
    recorderRef.current = { recorder, chunks, seq };
  }, [pickMimeType]);

  const stopRecorder = useCallback(() => {
    if (postRollTimerRef.current) {
      window.clearTimeout(postRollTimerRef.current);
      postRollTimerRef.current = null;
    }
    const rec = recorderRef.current;
    recorderRef.current = null;
    if (rec && rec.recorder.state !== "inactive") {
      try {
        rec.recorder.stop();
      } catch {
        // already stopped
      }
    }
  }, []);

  /** Freeze the pre-roll window, keep recording `postRollSeconds`, upload. */
  const cutClip = useCallback(
    (highlightId: string) => {
      const current = recorderRef.current;
      if (!current || current.recorder.state !== "recording") return;

      const snapshot = [...current.chunks];
      const snapshotIds = new Set(snapshot.map((c) => c.id));

      if (postRollTimerRef.current) window.clearTimeout(postRollTimerRef.current);
      postRollTimerRef.current = window.setTimeout(() => {
        const active = recorderRef.current;
        if (!active || active.recorder.state !== "recording") return;
        const recorder = active.recorder;

        const blob = new Promise<Blob>((resolve) => {
          recorder.onstop = () => {
            const tail = active.chunks.filter((c) => !snapshotIds.has(c.id));
            const all = [...snapshot, ...tail].map((c) => c.blob);
            resolve(new Blob(all, { type: recorder.mimeType || "video/webm" }));
          };
          recorder.stop();
        }).then((b) => {
          startRecorder();
          return b;
        });

        void blob
          .then(async (data) => {
            const res = await fetch(
              `/api/matches/${matchId}/highlights/${highlightId}/upload`,
              {
                method: "POST",
                headers: { "Content-Type": data.type || "video/webm" },
                body: data,
              }
            );
            if (!res.ok) {
              throw new Error(`Upload failed (${res.status})`);
            }
          })
          .catch((err) => {
            console.error("Highlight upload failed:", err);
          });
      }, postRollSecondsRef.current * 1000);
    },
    [matchId, startRecorder]
  );

  // ---------------------------------------------------------------------------
  // Signaling socket
  // ---------------------------------------------------------------------------

  const emitJoin = useCallback(
    (socket: Socket) => {
      return new Promise<void>((resolve, reject) => {
        let settled = false;
        const settle = (fn: () => void) => {
          if (settled) return;
          settled = true;
          socket.off("broadcast:viewer-count", onCount);
          socket.off("broadcast:error", onErr);
          fn();
        };
        const onCount = () => settle(() => resolve());
        const onErr = (payload: { code?: string; message?: string }) =>
          settle(() =>
            reject(
              new Error(payload?.message ?? "Could not join the broadcast room")
            )
          );
        socket.on("broadcast:viewer-count", onCount);
        socket.on("broadcast:error", onErr);

        if (!socket.connected) {
          console.error("[WebRTC Broadcaster] emitJoin called but socket not connected");
          settle(() => reject(new Error("Signaling server not connected")));
          return;
        }

        console.log(`[WebRTC Broadcaster] joining match ${matchId} as broadcaster`);
        socket.emit("broadcast:join", { matchId, role: "broadcaster" });

        // Safety timeout: reject (not resolve) if no response in 10s.
        window.setTimeout(() => settle(() => reject(new Error("Join timeout"))), 10_000);
      });
    },
    [matchId]
  );

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  const start = useCallback(async () => {
    if (statusRef.current === "LIVE" || statusRef.current === "STARTING") return;
    setStatus("STARTING");
    setError(null);
    setMediaReady("requesting");

    try {
      // 1. Camera/mic capture
      const media = await openCamera();
      streamRef.current = media;

      // Validate tracks exist and are live before proceeding.
      const videoTracks = media.getVideoTracks();
      if (videoTracks.length === 0 || videoTracks[0].readyState !== "live") {
        media.getTracks().forEach((t) => t.stop());
        throw new Error("Camera stream could not be started. No active video track.");
      }

      // 2. Attach to preview (may succeed immediately or later via the useEffect).
      setLocalStream(media);
      attachStream(media);
      setCameraOn(true);

      // 3. Auth + stream API
      const tokenRes = await fetch("/api/video/signaling-token");
      if (!tokenRes.ok) throw new Error("Signaling auth failed.");
      const { token } = (await tokenRes.json()) as { token: string };
      console.log("[WebRTC Broadcaster] signaling token obtained");

      const streamRes = await fetch(`/api/matches/${matchId}/stream`, {
        method: "POST",
      });
      const streamBody = (await streamRes.json().catch(() => null)) as
        | (GoLiveInfo & { error?: string })
        | null;
      if (!streamRes.ok) {
        throw new Error(streamBody?.error ?? "Could not start the stream.");
      }
      iceServersRef.current = streamBody?.stream?.iceServers ?? [];
      preRollSecondsRef.current =
        streamBody?.stream?.highlightPreRollSeconds ?? DEFAULT_PRE_ROLL_SECONDS;
      postRollSecondsRef.current =
        streamBody?.stream?.highlightPostRollSeconds ?? DEFAULT_POST_ROLL_SECONDS;
      setStartedAt(streamBody?.stream?.startedAt ?? new Date().toISOString());

      // 4. Signaling socket
      const socketUrl = getClientSignalingUrl();
      console.log(`[WebRTC Broadcaster] connecting to signaling server: ${socketUrl}`);
      const socket = io(socketUrl, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 30,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 30000,
        auth: { token },
      });
      signalingRef.current = socket;

      socket.on("broadcast:viewer-joined", (payload: { socketId: string }) => {
        console.log(`[WebRTC Broadcaster] viewer joined: ${payload?.socketId}`);
        if (payload?.socketId && statusRef.current === "LIVE") {
          void createOffer(payload.socketId);
        }
      });
      socket.on("broadcast:answer", (payload: { answer: unknown; from: string }) => {
        console.log(`[WebRTC Broadcaster] answer received from ${payload?.from}`);
        const pc = peersRef.current.get(payload.from);
        if (pc && payload.answer) {
          void pc
            .setRemoteDescription(payload.answer as RTCSessionDescriptionInit)
            .catch(() => {});
        }
      });
      socket.on("broadcast:ice", (payload: { candidate: unknown; from: string }) => {
        const pc = peersRef.current.get(payload.from);
        if (pc && payload.candidate) {
          void pc
            .addIceCandidate(payload.candidate as RTCIceCandidateInit)
            .catch(() => {});
        }
      });
      socket.on("broadcast:viewer-count", (payload: { count: number }) => {
        if (typeof payload?.count === "number") setViewerCount(payload.count);
      });
      socket.on(
        "broadcast:record",
        (payload: {
          highlightId: string;
          preRollSeconds?: number;
          postRollSeconds?: number;
        }) => {
          if (payload?.highlightId && statusRef.current === "LIVE") {
            if (typeof payload.preRollSeconds === "number") {
              preRollSecondsRef.current = payload.preRollSeconds;
            }
            if (typeof payload.postRollSeconds === "number") {
              postRollSecondsRef.current = payload.postRollSeconds;
            }
            cutClip(payload.highlightId);
          }
        }
      );
      socket.on("connect", () => {
        if (statusRef.current === "RECONNECTING") {
          console.log("[WebRTC Broadcaster] reconnected to signaling");
          void emitJoin(socket)
            .then(() => setStatus("LIVE"))
            .catch(() => {});
        }
      });
      socket.on("disconnect", (reason: string) => {
        console.log(`[WebRTC Broadcaster] disconnected from signaling: ${reason}`);
        if (statusRef.current === "LIVE") {
          closePeers();
          setStatus("RECONNECTING");
        }
      });
      socket.on("broadcast:stopped", () => {
        if (statusRef.current === "LIVE") {
          stopTracks();
          closePeers();
          setStatus("ENDED");
        }
      });

      // 5. Wait for socket to actually connect, then join room.
      // This is critical: emitJoin must only be called after the socket is
      // connected, otherwise the broadcast:join event is buffered and the
      // 3-second fallback timeout fires before the server even processes it.
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(
          () => reject(new Error("Signaling connection timeout (30s)")),
          30_000
        );
        if (socket.connected) {
          clearTimeout(timeout);
          resolve();
          return;
        }
        socket.once("connect", () => {
          clearTimeout(timeout);
          console.log(`[WebRTC Broadcaster] connected to signaling - socket ${socket.id}`);
          resolve();
        });
        socket.once("connect_error", (err) => {
          clearTimeout(timeout);
          console.error("[WebRTC Broadcaster] signaling connection error:", err.message);
          reject(new Error(`Signaling connection failed: ${err.message}`));
        });
        socket.connect();
      });

      // App room subscription (highlight record requests + stream events).
      socket.emit("subscribe:match", matchId);

      // 6. Join room, start recorder, mark LIVE
      await emitJoin(socket);

      // Re-validate tracks before claiming live.
      const liveStream = streamRef.current;
      if (!liveStream || liveStream.getVideoTracks().length === 0 || liveStream.getVideoTracks()[0].readyState !== "live") {
        throw new Error("Camera stream was lost before broadcast started.");
      }

      startRecorder();
      setStatus("LIVE");
      console.log("[WebRTC Broadcaster] BROADCAST LIVE");
    } catch (err) {
      stopTracks();
      closePeers();
      setError(err instanceof Error ? err.message : "Could not go live.");
      setStatus("ERROR");
    }
  }, [
    attachStream,
    closePeers,
    createOffer,
    cutClip,
    emitJoin,
    matchId,
    openCamera,
    setStatus,
    startRecorder,
    stopTracks,
  ]);

  const stop = useCallback(async () => {
    if (statusRef.current === "STOPPING") return;
    setStatus("STOPPING");

    stopRecorder();
    closePeers();
    signalingRef.current?.emit("broadcast:leave");
    signalingRef.current?.disconnect();
    signalingRef.current = null;
    stopTracks();

    try {
      await fetch(`/api/matches/${matchId}/stream`, { method: "DELETE" });
    } catch {
      // stream already ended — fine
    }
    setViewerCount(0);
    setStatus("ENDED");
  }, [closePeers, matchId, setStatus, stopRecorder, stopTracks]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
  }, []);

  const flipCamera = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === "videoinput");
      if (cams.length < 2) return;
      deviceIndexRef.current = (deviceIndexRef.current + 1) % cams.length;
      const newStream = await openCamera(cams[deviceIndexRef.current].deviceId);

      const videoTrack = newStream.getVideoTracks()[0];
      const audioTrack = newStream.getAudioTracks()[0];

      // Replace tracks on all active peer connections first.
      for (const pc of peersRef.current.values()) {
        for (const sender of pc.getSenders()) {
          const kind = sender.track?.kind;
          if (kind === "video" && videoTrack) {
            void sender.replaceTrack(videoTrack).catch(() => {});
          } else if (kind === "audio" && audioTrack) {
            void sender.replaceTrack(audioTrack).catch(() => {});
          }
        }
      }

      // Stop old tracks.
      const old = streamRef.current;
      if (old) {
        old.getTracks().forEach((t) => t.stop());
      }

      // Use the new stream entirely (don't mutate the old one).
      streamRef.current = newStream;
      setLocalStream(newStream);
      attachStream(newStream);

      stopRecorder();
      startRecorder();
      setCameraOn(true);
    } catch {
      setError("Could not switch the camera.");
    }
  }, [attachStream, openCamera, startRecorder, stopRecorder]);

  const turnCameraOn = useCallback(async () => {
    try {
      if (!streamRef.current) {
        const stream = await openCamera();
        streamRef.current = stream;
      }
      setLocalStream(streamRef.current);
      attachStream(streamRef.current);
      setCameraOn(true);
    } catch {
      setError(
        "Could not access the camera/microphone. Check permissions and try again."
      );
    }
  }, [attachStream, openCamera]);

  // Full teardown on unmount (navigating away ends the broadcast).
  useEffect(() => {
    return () => {
      const wasLive =
        statusRef.current === "LIVE" || statusRef.current === "RECONNECTING";
      stopRecorder();
      closePeers();
      if (signalingRef.current) {
        if (wasLive) signalingRef.current.emit("broadcast:leave");
        signalingRef.current.disconnect();
        signalingRef.current = null;
      }
      stopTracks();
    };
  }, [closePeers, stopRecorder, stopTracks]);

  return {
    status,
    error,
    viewerCount,
    cameraOn,
    mediaReady,
    muted,
    startedAt,
    videoRef,
    videoRefCallback,
    start,
    stop,
    toggleMute,
    flipCamera,
    turnCameraOn,
  };
}
