import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

export interface AuthPayload extends JWTPayload {
  sub: string;
  email: string;
  name?: string;
  role: string;
}

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? ""
);

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken<T extends JWTPayload = AuthPayload>(
  token: string
): Promise<T> {
  const { payload } = await jwtVerify(token, secret);
  return payload as T;
}

export async function getCurrentUser(): Promise<AuthPayload | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("token")?.value ??
      cookieStore.get("next-auth.session-token")?.value;

    if (!token) return null;

    const payload = await verifyToken<AuthPayload>(token);
    if (!payload.sub || !payload.email) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(role: string): Promise<AuthPayload> {
  const user = await requireAuth();
  if (user.role !== role && user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}
