import { describe, expect, it } from "vitest";
import {
  parseIceServers,
  isWebRTCConfigured,
  getWebRtcSettings,
  MAX_SDP_LENGTH,
  MAX_ICE_LENGTH,
} from "@/lib/video/webrtc";

const EMPTY = {};

describe("parseIceServers", () => {
  it("returns an empty list when nothing is configured", () => {
    expect(parseIceServers(EMPTY)).toEqual([]);
  });

  it("parses a single STUN url", () => {
    const servers = parseIceServers({ WEBRTC_STUN_URL: "stun:stun.l.google.com:19302" });
    expect(servers).toEqual([{ urls: ["stun:stun.l.google.com:19302"] }]);
  });

  it("parses comma-separated STUN urls", () => {
    const servers = parseIceServers({
      WEBRTC_STUN_URL: "stun:a:3478, stun:b:3478",
    });
    expect(servers).toEqual([{ urls: ["stun:a:3478", "stun:b:3478"] }]);
  });

  it("attaches TURN credentials when present", () => {
    const servers = parseIceServers({
      WEBRTC_STUN_URL: "stun:turn.example.com:3478",
      WEBRTC_TURN_URL: "turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp",
      WEBRTC_TURN_USERNAME: "scorebolt",
      WEBRTC_TURN_CREDENTIAL: "s3cret",
    });
    expect(servers).toHaveLength(2);
    const turn = servers.find((s) => s.urls[0].startsWith("turn:"));
    expect(turn?.username).toBe("scorebolt");
    expect(turn?.credential).toBe("s3cret");
  });

  it("drops urls that are not stun/turn", () => {
    const servers = parseIceServers({
      WEBRTC_STUN_URL: "http://not-stun.example.com",
      WEBRTC_TURN_URL: "https://not-turn.example.com",
    });
    expect(servers).toEqual([]);
  });
});

describe("isWebRTCConfigured", () => {
  it("is false without ICE servers", () => {
    expect(isWebRTCConfigured(EMPTY)).toBe(false);
  });
  it("is true with only STUN", () => {
    expect(isWebRTCConfigured({ WEBRTC_STUN_URL: "stun:x:3478" })).toBe(true);
  });
  it("is true with only TURN", () => {
    expect(isWebRTCConfigured({ WEBRTC_TURN_URL: "turn:x:3478" })).toBe(true);
  });
});

describe("getWebRtcSettings", () => {
  it("defaults to 20 viewers", () => {
    expect(getWebRtcSettings(EMPTY).maxViewers).toBe(20);
  });
  it("clamps the viewer cap between 1 and 100", () => {
    expect(getWebRtcSettings({ WEBRTC_MAX_VIEWERS: "0" }).maxViewers).toBe(1);
    expect(getWebRtcSettings({ WEBRTC_MAX_VIEWERS: "999" }).maxViewers).toBe(100);
    expect(getWebRtcSettings({ WEBRTC_MAX_VIEWERS: "5" }).maxViewers).toBe(5);
  });
});

describe("signaling size limits", () => {
  it("caps SDP at 64KB and ICE at 8KB", () => {
    expect(MAX_SDP_LENGTH).toBe(64 * 1024);
    expect(MAX_ICE_LENGTH).toBe(8 * 1024);
  });
});
