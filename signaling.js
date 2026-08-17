/**
 * Standalone WebRTC signaling server for ScoreBolt.
 *
 * This server runs independently of Next.js / Vercel. It handles:
 *   - Socket.IO connections for WebRTC signaling (broadcast:join/offer/answer/ice)
 *   - Broadcast room management (match-scoped, mesh topology)
 *   - Signaling token verification (same HS256 JWTs as server.js)
 *   - HTTP POST relay endpoint so the Vercel API can forward real-time events
 *     (score updates, highlight record requests, stream status) to connected
 *     clients
 *   - Database updates on broadcaster disconnect (marks stream as ENDED)
 *
 * Environment variables:
 *   PORT                           - listening port (default 3001)
 *   HOSTNAME                       - bind address (default 0.0.0.0)
 *   DATABASE_URL                   - PostgreSQL connection string (same as Vercel)
 *   AUTH_SECRET / NEXTAUTH_SECRET  - HS256 key for signaling tokens
 *   WEBRTC_MAX_VIEWERS             - per-broadcast viewer cap (default 20)
 *   SIGNALING_RELAY_SECRET         - shared secret to authenticate HTTP relay
 *                                    requests from Vercel (required in production)
 *   NODE_ENV                       - production/development
 *
 * CORS: The signaling server is public — any origin can connect to watch a
 * broadcast. CORS is always open (origin: "*"). Do NOT use
 * NEXT_PUBLIC_WEBRTC_SIGNALING_URL to restrict CORS — that env var is for
 * the client to know THIS server's URL, not for this server to restrict who
 * can connect.
 *
 * Start:  node signaling.js
 *         or  PORT=3001 node signaling.js
 *
 * This server can run alongside the Vercel deployment or anywhere with
 * network access to the PostgreSQL database.
 */
const http = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const { verifySignalingToken } = require("./src/lib/video/signaling-token");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3001", 10);

const relaySecret = process.env.SIGNALING_RELAY_SECRET || "";
const MAX_VIEWERS = (() => {
  const n = parseInt(process.env.WEBRTC_MAX_VIEWERS || "20", 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 100) : 20;
})();

const MAX_SDP_LENGTH = 64 * 1024;
const MAX_ICE_LENGTH = 8 * 1024;
const MAX_JOIN_ATTEMPTS_PER_WINDOW = 20;
const JOIN_WINDOW_MS = 10 * 1000;

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Broadcast rooms (mesh signaling) — same data model as server.js
// ---------------------------------------------------------------------------

const broadcastRooms = new Map();

function getRoom(matchId) {
  if (!broadcastRooms.has(matchId)) {
    broadcastRooms.set(matchId, { broadcasterId: null, sockets: new Map() });
  }
  return broadcastRooms.get(matchId);
}

function roomMetaFor(socketId) {
  for (const room of broadcastRooms.values()) {
    const meta = room.sockets.get(socketId);
    if (meta) return { room, meta };
  }
  return null;
}

function viewerCount(room) {
  let count = 0;
  for (const meta of room.sockets.values()) {
    if (meta.role === "viewer") count += 1;
  }
  return count;
}

function sendTo(socketId, event, data) {
  const target = io.sockets.sockets.get(socketId);
  if (target) target.emit(event, data);
}

function payloadSize(value) {
  if (typeof value === "string") return value.length;
  try {
    return JSON.stringify(value).length;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

const joinAttempts = new Map();
function rateLimitJoin(socketId) {
  const now = Date.now();
  const window = (joinAttempts.get(socketId) || []).filter(
    (t) => now - t < JOIN_WINDOW_MS
  );
  window.push(now);
  joinAttempts.set(socketId, window);
  return window.length > MAX_JOIN_ATTEMPTS_PER_WINDOW;
}

// ---------------------------------------------------------------------------
// Room lifecycle
// ---------------------------------------------------------------------------

function leaveBroadcast(socket) {
  const entry = roomMetaFor(socket.id);
  if (!entry) return;
  const { room, meta } = entry;
  const { matchId, role } = meta;

  room.sockets.delete(socket.id);
  socket.leave(`broadcast:${matchId}`);

  if (role === "broadcaster") {
    room.broadcasterId = null;
    io.to(`broadcast:${matchId}`).emit("broadcast:stopped", {
      reason: "broadcaster-left",
    });
    prisma.matchLiveStream
      .findUnique({ where: { matchId } })
      .then((stream) => {
        if (stream && stream.status === "LIVE") {
          return prisma.matchLiveStream.update({
            where: { matchId },
            data: { status: "ENDED", endedAt: new Date() },
          });
        }
        return null;
      })
      .then((stream) => {
        if (!stream) return;
        try {
          io.to(`match:${matchId}`).emit("stream:updated", {
            matchId,
            status: "ENDED",
            playbackUrl: null,
            startedAt: stream.startedAt ? stream.startedAt.toISOString() : null,
            endedAt: stream.endedAt ? stream.endedAt.toISOString() : null,
          });
        } catch {
          // relay unavailable
        }
      })
      .catch(() => {});
  } else {
    io.to(`broadcast:${matchId}`).emit("broadcast:viewer-count", {
      count: viewerCount(room),
    });
  }

  if (room.sockets.size === 0 && room.broadcasterId === null) {
    broadcastRooms.delete(matchId);
  }
}

// ---------------------------------------------------------------------------
// HTTP server (Socket.IO + relay endpoint)
// ---------------------------------------------------------------------------

let io;

const server = http.createServer(async (req, res) => {
  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, connections: io.engine.clientsCount }));
    return;
  }

  // HTTP relay endpoint — allows the Vercel API to forward real-time events
  // to connected clients when globalThis.io is not available (serverless).
  //
  // POST /relay
  // Headers: Authorization: Bearer <SIGNALING_RELAY_SECRET>
  // Body: { room: "match:{matchId}", event: "score:updated", data: {...} }
  if (req.method === "POST" && req.url === "/relay") {
    if (relaySecret) {
      const auth = req.headers.authorization || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (token !== relaySecret) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
    }

    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const { room, event, data } = JSON.parse(body);
      if (typeof room === "string" && typeof event === "string") {
        io.to(room).emit(event, typeof data === "object" && data !== null ? data : {});
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid payload" }));
    }
    return;
  }

  // 404 for everything else
  res.writeHead(404);
  res.end("Not found");
});

// ---------------------------------------------------------------------------
// Socket.IO server
//
// CORS: The signaling server is public — any browser origin can connect.
// We use origin: "*" which lets Engine.IO echo the request Origin header,
// so Access-Control-Allow-Origin is always the specific browser origin
// (never the literal "*"), which is valid with credentials.
//
// IMPORTANT: Do NOT set NEXT_PUBLIC_WEBRTC_SIGNALING_URL on this server
// to restrict CORS. That env var is only for clients to find this server's URL.
// ---------------------------------------------------------------------------

io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`[Signaling] socket connected: ${socket.id}`);

  // App room (score updates, commentary, stream/highlight events).
  socket.on("subscribe:match", (matchId) => {
    if (typeof matchId === "string" && matchId) {
      socket.join(`match:${matchId}`);
    }
  });

  socket.on("unsubscribe:match", (matchId) => {
    if (typeof matchId === "string" && matchId) {
      socket.leave(`match:${matchId}`);
    }
  });

  // ---- WebRTC signaling (mesh broadcast) ----

  socket.on("broadcast:join", async (payload) => {
    const matchId =
      typeof payload?.matchId === "string" && payload.matchId
        ? payload.matchId
        : null;
    const role = payload?.role === "broadcaster" ? "broadcaster" : "viewer";
    if (!matchId) {
      return socket.emit("broadcast:error", {
        code: "INVALID",
        message: "matchId is required",
      });
    }
    if (rateLimitJoin(socket.id)) {
      console.log(`[Signaling] rate limited: ${socket.id}`);
      return socket.emit("broadcast:error", {
        code: "RATE_LIMIT",
        message: "Too many join attempts. Try again shortly.",
      });
    }

    const match = await prisma.match
      .findUnique({
        where: { id: matchId },
        select: { id: true, createdBy: true },
      })
      .catch(() => null);
    if (!match) {
      return socket.emit("broadcast:error", {
        code: "NOT_FOUND",
        message: "Match not found",
      });
    }

    const room = getRoom(matchId);

    if (role === "broadcaster") {
      const user = verifySignalingToken(socket.handshake.auth?.token);
      if (!user) {
        console.log(`[Signaling] broadcaster auth FAILED: ${socket.id}`);
        return socket.emit("broadcast:error", {
          code: "UNAUTHORIZED",
          message: "A valid signaling token is required to broadcast",
        });
      }

      const stream = await prisma.matchLiveStream
        .findUnique({ where: { matchId } })
        .catch(() => null);
      if (
        !stream ||
        (stream.status !== "LIVE" && stream.status !== "CREATED")
      ) {
        return socket.emit("broadcast:error", {
          code: "NOT_LIVE",
          message: "There is no active broadcast for this match",
        });
      }

      const isManager =
        user.role === "SUPER_ADMIN" ||
        user.role === "TOURNAMENT_ADMIN" ||
        match.createdBy === user.sub;
      const isApprovedBroadcaster = stream.broadcasterId === user.sub;
      if (!isManager && !isApprovedBroadcaster) {
        return socket.emit("broadcast:error", {
          code: "FORBIDDEN",
          message: "You are not an approved broadcaster for this match",
        });
      }

      if (room.broadcasterId && room.broadcasterId !== socket.id) {
        return socket.emit("broadcast:error", {
          code: "TAKEOVER",
          message: "Another broadcaster is already live for this match",
        });
      }
      if (room.broadcasterId === socket.id) return;

      room.broadcasterId = socket.id;
      room.sockets.set(socket.id, {
        matchId,
        role: "broadcaster",
        userSub: user.sub,
      });
      socket.join(`broadcast:${matchId}`);
      console.log(`[Signaling] BROADCASTER joined match ${matchId} - socket ${socket.id} - user ${user.sub}`);
      io.to(`broadcast:${matchId}`).emit("broadcast:viewer-count", {
        count: viewerCount(room),
      });

      for (const [viewerId, meta] of room.sockets.entries()) {
        if (meta.role === "viewer") {
          sendTo(socket.id, "broadcast:viewer-joined", { socketId: viewerId });
          console.log(`[Signaling]   -> notifying broadcaster of existing viewer ${viewerId}`);
        }
      }
    } else {
      const stream = await prisma.matchLiveStream
        .findUnique({ where: { matchId }, select: { status: true } })
        .catch(() => null);
      if (!stream || stream.status !== "LIVE") {
        console.log(`[Signaling] viewer join rejected (NOT_LIVE): ${socket.id} match ${matchId} streamStatus=${stream?.status}`);
        return socket.emit("broadcast:error", {
          code: "NOT_LIVE",
          message: "There is no live broadcast for this match",
        });
      }
      if (viewerCount(room) >= MAX_VIEWERS) {
        return socket.emit("broadcast:error", {
          code: "LIMIT",
          message: `A maximum of ${MAX_VIEWERS} viewers can connect to one broadcast`,
        });
      }

      room.sockets.set(socket.id, { matchId, role: "viewer" });
      socket.join(`broadcast:${matchId}`);
      console.log(`[Signaling] VIEWER joined match ${matchId} - socket ${socket.id} (viewers: ${viewerCount(room)}, broadcaster: ${room.broadcasterId || "none"})`);
      io.to(`broadcast:${matchId}`).emit("broadcast:viewer-count", {
        count: viewerCount(room),
      });
      if (room.broadcasterId) {
        sendTo(room.broadcasterId, "broadcast:viewer-joined", {
          socketId: socket.id,
        });
        console.log(`[Signaling]   -> sent viewer-joined to broadcaster ${room.broadcasterId}`);
      } else {
        console.log(`[Signaling]   -> NO BROADCASTER in room - viewer ${socket.id} will wait`);
      }
    }
  });

  socket.on("broadcast:leave", () => {
    const entry = roomMetaFor(socket.id);
    if (entry) {
      console.log(`[Signaling] socket leaving: ${socket.id} (match ${entry.meta.matchId}, role ${entry.meta.role})`);
    }
    leaveBroadcast(socket);
  });

  socket.on("broadcast:offer", (payload) => {
    const entry = roomMetaFor(socket.id);
    if (!entry || entry.meta.role !== "broadcaster") return;
    if (payloadSize(payload?.offer) > MAX_SDP_LENGTH) return;
    const target = entry.room.sockets.get(payload?.to);
    if (!target || target.role !== "viewer") return;
    console.log(`[Signaling] OFFER: broadcaster ${socket.id} -> viewer ${payload.to}`);
    sendTo(payload.to, "broadcast:offer", {
      offer: payload.offer,
      from: socket.id,
    });
  });

  socket.on("broadcast:answer", (payload) => {
    const entry = roomMetaFor(socket.id);
    if (!entry || entry.meta.role !== "viewer") return;
    if (payloadSize(payload?.answer) > MAX_SDP_LENGTH) return;
    const target = entry.room.sockets.get(payload?.to);
    if (!target || target.role !== "broadcaster") return;
    console.log(`[Signaling] ANSWER: viewer ${socket.id} -> broadcaster ${payload.to}`);
    sendTo(payload.to, "broadcast:answer", {
      answer: payload.answer,
      from: socket.id,
    });
  });

  socket.on("broadcast:ice", (payload) => {
    const entry = roomMetaFor(socket.id);
    if (!entry) return;
    if (payloadSize(payload?.candidate) > MAX_ICE_LENGTH) return;
    const target = entry.room.sockets.get(payload?.to);
    if (!target) return;
    sendTo(payload.to, "broadcast:ice", {
      candidate: payload.candidate,
      from: socket.id,
    });
  });

  socket.on("broadcast:viewer-left", (payload) => {
    const entry = roomMetaFor(socket.id);
    if (!entry || entry.meta.role !== "broadcaster") return;
    const viewerId = payload?.socketId;
    if (typeof viewerId !== "string") return;
    const target = entry.room.sockets.get(viewerId);
    if (!target || target.role !== "viewer") return;
    entry.room.sockets.delete(viewerId);
    sendTo(viewerId, "broadcast:stopped", { reason: "kicked" });
  });

  socket.on("disconnect", (reason) => {
    const entry = roomMetaFor(socket.id);
    if (entry) {
      console.log(`[Signaling] socket disconnected: ${socket.id} (match ${entry.meta.matchId}, role ${entry.meta.role}, reason: ${reason})`);
    } else {
      console.log(`[Signaling] socket disconnected: ${socket.id} (reason: ${reason})`);
    }
    leaveBroadcast(socket);
    joinAttempts.delete(socket.id);
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

server.listen(port, hostname, () => {
  console.log(`> ScoreBolt signaling server ready on http://${hostname}:${port}`);
  console.log(`> Socket.IO listening on path /socket.io`);
  console.log(`> CORS: open (any origin allowed)`);
  if (relaySecret) {
    console.log(`> HTTP relay: enabled (authenticated)`);
  } else {
    console.log(`> HTTP relay: open (no SIGNALING_RELAY_SECRET set)`);
  }
});
