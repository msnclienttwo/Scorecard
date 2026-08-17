const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const { verifySignalingToken } = require("./src/lib/video/signaling-token");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const socketOrigin =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (dev ? `http://${hostname}:${port}` : `https://${hostname}`);

// Limits enforced on the signaling relay.
const MAX_SDP_LENGTH = 64 * 1024; // serialized offer/answer
const MAX_ICE_LENGTH = 8 * 1024; // serialized ICE candidate
const MAX_JOIN_ATTEMPTS_PER_WINDOW = 20;
const JOIN_WINDOW_MS = 10 * 1000;
const MAX_VIEWERS = (() => {
  const n = parseInt(process.env.WEBRTC_MAX_VIEWERS || "20", 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 100) : 20;
})();

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Broadcast rooms (mesh signaling)
// ---------------------------------------------------------------------------
// room shape: {
//   broadcasterId: socketId | null,
//   sockets: Map<socketId, { matchId, role: "broadcaster"|"viewer", userSub?: string }>
// }
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

function rateLimitJoin(socketId) {
  const now = Date.now();
  const window = (joinAttempts.get(socketId) || []).filter((t) => now - t < JOIN_WINDOW_MS);
  window.push(now);
  joinAttempts.set(socketId, window);
  return window.length > MAX_JOIN_ATTEMPTS_PER_WINDOW;
}

const joinAttempts = new Map();

/** Socket.IO server instance, assigned once app.prepare() resolves. */
let io = null;

// ---------------------------------------------------------------------------
// Broadcast room lifecycle
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
    // Mirror the stop to the app room and the database so the public page and
    // Go Live cards settle without waiting for a REST call.
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
          globalThis.io
            .to(`match:${matchId}`)
            .emit("stream:updated", {
              status: "ENDED",
              playbackUrl: null,
              startedAt: stream.startedAt ? stream.startedAt.toISOString() : null,
              endedAt: stream.endedAt ? stream.endedAt.toISOString() : null,
            });
        } catch {
          // socket layer unavailable — clients fall back to polling
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
// Socket.IO server
// ---------------------------------------------------------------------------

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: socketOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  globalThis.io = io;

  io.on("connection", (socket) => {
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
        typeof payload?.matchId === "string" && payload.matchId ? payload.matchId : null;
      const role = payload?.role === "broadcaster" ? "broadcaster" : "viewer";
      if (!matchId) {
        return socket.emit("broadcast:error", {
          code: "INVALID",
          message: "matchId is required",
        });
      }
      if (rateLimitJoin(socket.id)) {
        return socket.emit("broadcast:error", {
          code: "RATE_LIMIT",
          message: "Too many join attempts. Try again shortly.",
        });
      }

      const match = await prisma.match
        .findUnique({ where: { id: matchId }, select: { id: true, createdBy: true } })
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
          return socket.emit("broadcast:error", {
            code: "UNAUTHORIZED",
            message: "A valid signaling token is required to broadcast",
          });
        }

        const stream = await prisma.matchLiveStream
          .findUnique({ where: { matchId } })
          .catch(() => null);
        if (!stream || (stream.status !== "LIVE" && stream.status !== "CREATED")) {
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
        if (room.broadcasterId === socket.id) return; // already joined

        room.broadcasterId = socket.id;
        room.sockets.set(socket.id, { matchId, role: "broadcaster", userSub: user.sub });
        socket.join(`broadcast:${matchId}`);
        io.to(`broadcast:${matchId}`).emit("broadcast:viewer-count", {
          count: viewerCount(room),
        });

        // Hand viewers that joined before us over to the broadcaster.
        for (const [viewerId, meta] of room.sockets.entries()) {
          if (meta.role === "viewer") {
            sendTo(socket.id, "broadcast:viewer-joined", { socketId: viewerId });
          }
        }
      } else {
        const stream = await prisma.matchLiveStream
          .findUnique({ where: { matchId }, select: { status: true } })
          .catch(() => null);
        if (!stream || stream.status !== "LIVE") {
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
        io.to(`broadcast:${matchId}`).emit("broadcast:viewer-count", {
          count: viewerCount(room),
        });
        if (room.broadcasterId) {
          sendTo(room.broadcasterId, "broadcast:viewer-joined", {
            socketId: socket.id,
          });
        }
      }
    });

    socket.on("broadcast:leave", () => leaveBroadcast(socket));

    // Broadcaster -> viewer offer.
    socket.on("broadcast:offer", (payload) => {
      const entry = roomMetaFor(socket.id);
      if (!entry || entry.meta.role !== "broadcaster") return;
      if (payloadSize(payload?.offer) > MAX_SDP_LENGTH) return;
      const target = entry.room.sockets.get(payload?.to);
      if (!target || target.role !== "viewer") return;
      sendTo(payload.to, "broadcast:offer", { offer: payload.offer, from: socket.id });
    });

    // Viewer -> broadcaster answer.
    socket.on("broadcast:answer", (payload) => {
      const entry = roomMetaFor(socket.id);
      if (!entry || entry.meta.role !== "viewer") return;
      if (payloadSize(payload?.answer) > MAX_SDP_LENGTH) return;
      const target = entry.room.sockets.get(payload?.to);
      if (!target || target.role !== "broadcaster") return;
      sendTo(payload.to, "broadcast:answer", { answer: payload.answer, from: socket.id });
    });

    // ICE candidates, both directions (must be in the same room as the target).
    socket.on("broadcast:ice", (payload) => {
      const entry = roomMetaFor(socket.id);
      if (!entry) return;
      if (payloadSize(payload?.candidate) > MAX_ICE_LENGTH) return;
      const target = entry.room.sockets.get(payload?.to);
      if (!target) return;
      sendTo(payload.to, "broadcast:ice", { candidate: payload.candidate, from: socket.id });
    });

    // Viewer leaves the broadcast explicitly (also fires for peers the
    // broadcaster wants to drop).
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

    socket.on("disconnect", () => {
      leaveBroadcast(socket);
      joinAttempts.delete(socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> ScoreBolt ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO listening on ${socketOrigin}/socket.io`);
  });
});
