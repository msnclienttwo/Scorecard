/**
 * Self-hosted WebRTC configuration for ScoreBolt live broadcasts.
 *
 * ScoreBolt broadcasts with a fully self-hosted WebRTC stack: browsers talk
 * to each other in a mesh (the broadcaster holds one RTCPeerConnection per
 * viewer) and the Socket.IO server only relays signaling messages. No third
 * party streaming service is involved.
 *
 * ICE servers are configured through environment variables so the same build
 * works on a laptop (STUN only, same-LAN or same-machine testers) and in
 * production behind NAT (STUN plus a self-hosted coturn TURN relay). See
 * docs/WEBRTC_SETUP.md for a complete setup guide.
 *
 * Env vars:
 *  - WEBRTC_STUN_URL  comma-separated stun: URLs, e.g. "stun:stun.l.google.com:19302"
 *  - WEBRTC_TURN_URL  comma-separated turn:/turns: URLs, e.g. "turn:turn.example.com:3478?transport=udp"
 *  - WEBRTC_TURN_USERNAME / WEBRTC_TURN_CREDENTIAL (static credentials — use
 *    short-lived REST credentials from coturn in production)
 *  - WEBRTC_MAX_VIEWERS  hard cap per broadcast (mesh bandwidth), default 20
 */

export interface WebRtcIceServer {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface WebRtcSettings {
  iceServers: WebRtcIceServer[];
  /** Hard cap on simultaneous viewers for one broadcast (mesh bandwidth). */
  maxViewers: number;
}

/** Hard ceiling on serialized SDP blobs relayed by the signaling server. */
export const MAX_SDP_LENGTH = 64 * 1024;
/** Hard ceiling on serialized ICE candidates relayed by the signaling server. */
export const MAX_ICE_LENGTH = 8 * 1024;

function splitList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export function parseIceServers(env: Record<string, string | undefined> = process.env): WebRtcIceServer[] {
  const servers: WebRtcIceServer[] = [];

  const stunUrls = splitList(env.WEBRTC_STUN_URL).filter((u) => u.startsWith("stun:"));
  if (stunUrls.length > 0) {
    servers.push({ urls: stunUrls });
  }

  const turnUrls = splitList(env.WEBRTC_TURN_URL).filter(
    (u) => u.startsWith("turn:") || u.startsWith("turns:")
  );
  if (turnUrls.length > 0) {
    const server: WebRtcIceServer = { urls: turnUrls };
    if (env.WEBRTC_TURN_USERNAME) server.username = env.WEBRTC_TURN_USERNAME;
    if (env.WEBRTC_TURN_CREDENTIAL) server.credential = env.WEBRTC_TURN_CREDENTIAL;
    servers.push(server);
  }

  return servers;
}

export function getWebRtcSettings(env: Record<string, string | undefined> = process.env): WebRtcSettings {
  return {
    iceServers: parseIceServers(env),
    maxViewers: clampInt(env.WEBRTC_MAX_VIEWERS, 20, 1, 100),
  };
}

export function isWebRTCConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return parseIceServers(env).length > 0;
}

export function webrtcSetupMessage(): string {
  return (
    "Live video is not configured yet. Set WEBRTC_STUN_URL (and WEBRTC_TURN_URL " +
    "with coturn credentials for production) to enable broadcasting and " +
    "automatic highlights. See docs/WEBRTC_SETUP.md."
  );
}
