const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const socketOrigin =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (dev ? `http://${hostname}:${port}` : `https://${hostname}`);

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: socketOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  globalThis.io = io;

  io.on("connection", (socket) => {
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
  });

  server.listen(port, () => {
    console.log(`> ScoreBolt ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO listening on ${socketOrigin}/socket.io`);
  });
});
