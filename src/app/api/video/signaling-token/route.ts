import { NextResponse } from "next/server";
import { requireAuth, signToken } from "@/lib/auth";

/**
 * Issues a scoped HS256 JWT for the Socket.IO WebRTC signaling handshake.
 * Next-auth session cookies are HttpOnly so the browser cannot attach them to
 * a socket handshake — this endpoint returns the equivalent capability token.
 * The signaling server only accepts tokens with scope "broadcast-signaling".
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const token = await signToken({
      sub: user.sub,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
      scope: "broadcast-signaling",
    });
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication required" },
      { status: 401 }
    );
  }
}
