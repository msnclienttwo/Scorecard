import { describe, expect, it } from "vitest";
import { canManageBroadcast } from "@/lib/video/broadcast";
import type { AuthPayload } from "@/lib/auth";

const MATCH = { createdBy: "creator-1" };

function user(overrides: Partial<AuthPayload> = {}): AuthPayload {
  return {
    sub: "u1",
    email: "u@x.com",
    role: "VIEWER",
    ...overrides,
  };
}

describe("canManageBroadcast", () => {
  it("allows the match creator", () => {
    expect(canManageBroadcast(MATCH, user({ sub: "creator-1" }))).toBe(true);
  });

  it("allows admins", () => {
    expect(
      canManageBroadcast(MATCH, user({ sub: "admin-1", role: "SUPER_ADMIN" }))
    ).toBe(true);
    expect(
      canManageBroadcast(MATCH, user({ sub: "admin-2", role: "TOURNAMENT_ADMIN" }))
    ).toBe(true);
  });

  it("denies other users", () => {
    expect(canManageBroadcast(MATCH, user({ sub: "viewer-1" }))).toBe(false);
  });
});
