/**
 * Determines the WebRTC signaling server URL.
 *
 * On Vercel (serverless), the signaling server runs independently and its URL
 * is configured via SIGNALING_RELAY_URL (server-side) or
 * NEXT_PUBLIC_WEBRTC_SIGNALING_URL (client-side).
 *
 * Locally (server.js or signaling.js on the same port), the signaling server
 * is on the same origin, so no separate URL is needed.
 *
 * The server-side version (for relay forwarding from API routes) checks:
 *   1. SIGNALING_RELAY_URL (private, for server-to-server)
 *   2. NEXT_PUBLIC_WEBRTC_SIGNALING_URL (public, fallback)
 *
 * The client-side version checks:
 *   1. NEXT_PUBLIC_WEBRTC_SIGNALING_URL
 *   2. window.location.origin (same-origin)
 */

/**
 * Server-side: get the signaling server URL for HTTP relay from API routes.
 * Returns null when globalThis.io is available (same-process, no relay needed).
 */
export function getSignalingServerUrl(): string | null {
  // If we have a local io instance, no relay is needed.
  try {
    const io = (global as unknown as { io?: unknown }).io;
    if (io) return null;
  } catch {
    // not available
  }

  return (
    process.env.SIGNALING_RELAY_URL ||
    process.env.NEXT_PUBLIC_WEBRTC_SIGNALING_URL ||
    null
  );
}

/**
 * Client-side: get the signaling server URL for Socket.IO connections.
 * Falls back to window.location.origin for same-origin deployments.
 */
export function getClientSignalingUrl(): string {
  if (typeof window === "undefined") return "";
  return (
    process.env.NEXT_PUBLIC_WEBRTC_SIGNALING_URL || window.location.origin
  );
}
