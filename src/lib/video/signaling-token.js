"use strict";

// CommonJS helper shared by server.js (plain Node) and the app code so the
// Socket.IO signaling handshake verifies the same HS256 JWTs that
// src/lib/auth.ts signs with SignJWT.
//
// Why not jose here? jose is ESM-only and server.js is a CommonJS process.
// SignJWT uses HMAC-SHA256 over "header.payload" with the AUTH_SECRET /
// NEXTAUTH_SECRET key, which Node's crypto can verify directly.
//
// Next-auth session cookies are HttpOnly and cannot be read from the browser,
// so the studio fetches a short-scoped token from /api/video/signaling-token
// and sends it in the Socket.IO handshake as `auth.token`. Only the
// "broadcast-signaling" scope is accepted here.

const crypto = require("crypto");

function secretKey() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

function decodeBase64Url(value) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function safeEqual(a, b) {
  const left = Buffer.from(a, "base64");
  const right = Buffer.from(b, "base64");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/**
 * @param {unknown} token
 * @returns {null | { sub: string; role?: string; email?: string; exp?: number; scope?: string }}
 */
function verifySignalingToken(token) {
  if (typeof token !== "string" || !token) return null;
  const key = secretKey();
  if (!key) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  try {
    const expected = crypto
      .createHmac("sha256", key)
      .update(header + "." + payload)
      .digest("base64");
    if (!safeEqual(signature, expected)) return null;

    const decoded = JSON.parse(decodeBase64Url(payload).toString("utf8"));
    if (typeof decoded.exp !== "number" || Date.now() / 1000 >= decoded.exp) return null;
    if (decoded.scope !== "broadcast-signaling") return null;
    if (typeof decoded.sub !== "string" || !decoded.sub) return null;
    return decoded;
  } catch {
    return null;
  }
}

module.exports = { verifySignalingToken };
