import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { verifySignalingToken } from "@/lib/video/signaling-token";

const SECRET = "test-signaling-secret";
const encoder = new TextEncoder();

async function makeToken(
  payload: Record<string, unknown>,
  exp: string | number = "1h"
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(encoder.encode(SECRET));
}

beforeEach(() => {
  process.env.AUTH_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.AUTH_SECRET;
});

describe("verifySignalingToken", () => {
  it("accepts a valid scoped token", async () => {
    const token = await makeToken({
      sub: "user-1",
      email: "a@b.c",
      role: "TOURNAMENT_ADMIN",
      scope: "broadcast-signaling",
    });
    const payload = verifySignalingToken(token);
    expect(payload?.sub).toBe("user-1");
    expect(payload?.scope).toBe("broadcast-signaling");
  });

  it("rejects tokens without the broadcast-signaling scope", async () => {
    const token = await makeToken({ sub: "user-1", email: "a@b.c", role: "VIEWER" });
    expect(verifySignalingToken(token)).toBeNull();
  });

  it("rejects expired tokens", async () => {
    const token = await makeToken(
      { sub: "user-1", scope: "broadcast-signaling" },
      Math.floor(Date.now() / 1000) - 10
    );
    expect(verifySignalingToken(token)).toBeNull();
  });

  it("rejects a tampered signature", async () => {
    const token = await makeToken({ sub: "user-1", scope: "broadcast-signaling" });
    const [h, p] = token.split(".");
    expect(verifySignalingToken(`${h}.${p}.AAAA`)).toBeNull();
  });

  it("rejects garbage and missing sub", async () => {
    expect(verifySignalingToken("not-a-token")).toBeNull();
    expect(verifySignalingToken(null)).toBeNull();
    expect(
      verifySignalingToken(
        await makeToken({ scope: "broadcast-signaling", email: "a@b.c" })
      )
    ).toBeNull();
  });

  it("fails closed when no secret is configured", async () => {
    delete process.env.AUTH_SECRET;
    const token = await makeToken({ sub: "user-1", scope: "broadcast-signaling" });
    expect(verifySignalingToken(token)).toBeNull();
  });
});
