/**
 * Video capability helpers for the self-hosted WebRTC pipeline.
 *
 * "Configured" now simply means the server knows which STUN/TURN servers to
 * hand to browser peers. Live media flows directly peer-to-peer (mesh); the
 * provider layer that previously talked to Cloudflare Stream is gone.
 */
import {
  getWebRtcSettings,
  isWebRTCConfigured,
  webrtcSetupMessage,
  type WebRtcSettings,
} from "./webrtc";

export function isVideoConfigured(): boolean {
  return isWebRTCConfigured();
}

export function videoSetupMessage(): string {
  return webrtcSetupMessage();
}

export function getVideoSettings(): WebRtcSettings {
  return getWebRtcSettings();
}
