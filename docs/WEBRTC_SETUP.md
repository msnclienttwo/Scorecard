# Self-hosted WebRTC broadcasting

ScoreBolt streams live video **without any third-party service**. The
broadcaster's camera goes peer-to-peer to each viewer over WebRTC; the
ScoreBolt server only relays signaling (SDP offers/answers + ICE candidates)
through Socket.IO. Highlight clips are cut in the browser with `MediaRecorder`
and stored on disk for 12 hours.

- Broadcast topology: **mesh** — the broadcaster holds one `RTCPeerConnection`
  per viewer. Upload bandwidth is the bottleneck: `camera bitrate × viewers`.
  Keep `WEBRTC_MAX_VIEWERS` realistic for your uplink (default 20, but a 1.5
  Mbps camera feed at 20 viewers needs ~30 Mbps upstream).
- No "unlimited" free CDN: this is a small-audience solution, not a live CDN.
  For hundreds/thousands of viewers you would need an SFU (MediaSoup/Janus) —
  out of scope here.

## Architecture

```
Broadcaster browser                          Viewer browser
  getUserMedia ──────────────┐                  ┌──── <video>
  MediaRecorder (rolling 10s)│                  │  RTCPeerConnection (answer)
  RTCPeerConnection (offer)  └──── ICE/SDP ─────┘
                              Socket.IO server
  broadcast:join / offer / answer / ice (relayed only — media never touches server)
```

- Media bytes never pass through the server; only signaling does.
- Rooms are isolated per match: `broadcast:{matchId}`.
- The server validates every join: signaling token (broadcaster), match
  existence, stream is LIVE, approved-broadcaster permission, viewer cap, and
  rate limits. Client-supplied roles are never trusted.

## Deployment architecture

ScoreBolt has two deployment modes:

### Local development (single server)

`server.js` runs both Next.js and Socket.IO on the same port:

```bash
npm run dev    # starts server.js → Next.js + Socket.IO on localhost:3000
```

Everything runs on the same origin. No separate signaling URL is needed.

### Production (Vercel + separate signaling server)

**Vercel does NOT run `server.js`.** Vercel deploys Next.js as serverless
functions, which cannot host a persistent Socket.IO server. The WebRTC
signaling server (`signaling.js`) must run separately:

```
┌─────────────────┐     HTTP relay      ┌──────────────────────┐
│  Vercel          │ ──────────────────► │  Signaling server    │
│  Next.js app     │                     │  signaling.js        │
│  + API routes    │                     │  Socket.IO server    │
│  + DB (Prisma)   │                     │  + room management   │
└────────┬─────────┘                     └──────────┬───────────┘
         │                                          │
    Browser clients ◄──── Socket.IO ───────────────►│
    (broadcaster + viewer)                          │
         │                                          │
         └──── WebRTC peer-to-peer (no server) ─────┘
```

1. **Vercel** hosts the Next.js frontend and API routes (database access,
   authentication, stream status management).

2. **Signaling server** (`signaling.js`) runs as a persistent Node.js process
   on a VPS, Railway, Fly.io, or any platform that supports long-running
   processes with WebSocket support.

3. **Event relay**: When the Vercel API routes need to emit real-time events
   (score updates, highlight record requests, stream status changes), they
   forward them to the signaling server via HTTP POST `/relay`.

### Setting up the signaling server

1. Deploy `signaling.js` to your hosting platform:

```bash
# On the signaling server:
DATABASE_URL="your-postgres-url"
AUTH_SECRET="your-auth-secret"
NEXT_PUBLIC_WEBRTC_SIGNALING_URL="https://signaling.yourdomain.com"
SIGNALING_RELAY_SECRET="a-strong-random-secret"
WEBRTC_MAX_VIEWERS=20
PORT=3001
node signaling.js
```

2. Set Vercel environment variables:

```
NEXT_PUBLIC_WEBRTC_SIGNALING_URL="https://signaling.yourdomain.com"
SIGNALING_RELAY_URL="https://signaling.yourdomain.com"
SIGNALING_RELAY_SECRET="the-same-strong-random-secret"
```

3. Ensure the signaling server has access to the same PostgreSQL database
   (same `DATABASE_URL`).

## 1. Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `WEBRTC_STUN_URL` | Comma-separated `stun:` URLs | empty (feature disabled) |
| `WEBRTC_TURN_URL` | Comma-separated `turn:`/`turns:` URLs | empty |
| `WEBRTC_TURN_USERNAME` / `WEBRTC_TURN_CREDENTIAL` | coturn credentials | empty |
| `WEBRTC_MAX_VIEWERS` | Per-broadcast viewer cap | 20 |
| `VIDEO_STORAGE_PATH` | Highlight clip directory | `/data/scorebolt/highlights` (`.data/scorebolt/highlights` on Windows) |
| `VIDEO_HIGHLIGHT_PRE_ROLL_SECONDS` | Rolling pre-roll window | 10 |
| `VIDEO_HIGHLIGHT_POST_ROLL_SECONDS` | Seconds recorded after an event | 5 |
| `VIDEO_HIGHLIGHT_RETENTION_HOURS` | Clip lifetime | 12 |
| `VIDEO_CLEANUP_SECRET` | Secret for the cleanup cron endpoint | empty |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Signs the signaling handshake tokens | — |
| `NEXT_PUBLIC_WEBRTC_SIGNALING_URL` | Public URL of the signaling server (required for Vercel) | empty (same-origin) |
| `SIGNALING_RELAY_URL` | Server-side URL for HTTP event relay | falls back to above |
| `SIGNALING_RELAY_SECRET` | Shared secret for authenticated relay | empty |

`isVideoConfigured()` returns true once at least one ICE server is set. For
same-machine or same-LAN testing `WEBRTC_STUN_URL` alone is fine. For
viewers behind NAT on different networks, TURN is required.

## 2. Local development (no TURN)

```bash
# .env
WEBRTC_STUN_URL="stun:stun.l.google.com:19302"
```

Start the app (`npm run dev`), log in, request broadcast access, get approved,
open the studio, press Go Live, then open the public score page
(`/score/{matchId}`) in a second browser window. Host candidates connect
directly on localhost/LAN. Highlights upload to `.data/scorebolt/highlights`.

## 3. Production with a self-hosted coturn TURN relay

Install coturn (Debian/Ubuntu example):

```bash
apt install coturn
```

Edit `/etc/turnserver.conf`:

```
listening-port=3478
tls-listening-port=5349
realm=turn.example.com
server-name=turn.example.com
lt-cred-mech
userdb=/var/lib/turn/turnuserdb.conf
fingerprint
no-cli
# Open this UDP range in the firewall and forward it:
min-port=49152
max-port=65535
# Optional TLS with Let's Encrypt:
cert=/etc/letsencrypt/live/turn.example.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.example.com/privkey.pem
```

Create the credential:

```bash
turnadmin -a -u scorebolt -p 'a-long-shared-secret' -r turn.example.com
```

Firewall / cloud security group:

- `3478/udp` and `3478/tcp` (TURN), `5349/tcp` (TURNS if TLS)
- the full relay range `49152-65535/udp` (and `tcp` if `?transport=tcp` is used)

Then configure ScoreBolt:

```bash
WEBRTC_STUN_URL="stun:turn.example.com:3478"
WEBRTC_TURN_URL="turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp"
WEBRTC_TURN_USERNAME="scorebolt"
WEBRTC_TURN_CREDENTIAL="a-long-shared-secret"
```

> **Static credentials are shared with every client** (the browser needs them
> to create the TURN allocation). For production use coturn's time-limited
> REST credentials:
> `turnadmin -A` or the `use-auth-secret` + `static-auth-secret` option, then
> have `/api/video/signaling-token` (or the `/stream` response) return
> username = `expiry:userId` and the `HMAC(secret, username)` password.

### Persistent storage for highlights

Highlight clips are written to `VIDEO_STORAGE_PATH`. On Vercel/serverless this
path is ephemeral — mount a persistent volume (Fly.io volumes, a sidecar
`/data` volume on your VPS, or an object store mounted as a filesystem) or the
clips will disappear on redeploy. The DB row is metadata only.

## 4. Highlight lifecycle

1. A scoring event (FOUR/SIX/WICKET) is committed in `recordBall`
   (`src/lib/scoring.ts` → `void maybeAutoRecordHighlight(matchId, ballId)`).
2. A `PENDING` row is created; the server emits `broadcast:record` with the
   `highlightId` to the broadcaster's studio over the app socket room.
3. The studio freezes its rolling ~10s MediaRecorder window, records ~5s more,
   then uploads the webm to
   `POST /api/matches/{matchId}/highlights/{highlightId}/upload`.
4. The clip is written to storage and the row flips to `READY`
   (`playbackUrl` = play route, `downloadUrl` = download route).
5. After `VIDEO_HIGHLIGHT_RETENTION_HOURS` (default 12), cleanup deletes the
   file and marks the row `EXPIRED`.

Cleanup is idempotent and can be cron-triggered:

```bash
curl -X POST https://your-app/api/video/highlights/cleanup \
  -H "x-video-cleanup-secret: your-secret"
```

## 5. Signaling contract (Socket.IO)

Handshake: broadcasters connect with `auth: { token }` where `token` is
fetched from `GET /api/video/signaling-token` (an HS256 JWT scoped to
`broadcast-signaling`, verified in server.js/signaling.js). Viewers need no auth.

Events on the `broadcast:{matchId}` room:

| Event | Direction | Payload |
| --- | --- | --- |
| `broadcast:join` | client → server | `{ matchId, role: "broadcaster"\|"viewer" }` |
| `broadcast:viewer-joined` | server → broadcaster | `{ socketId }` |
| `broadcast:offer` | broadcaster → viewer | `{ to, offer }` |
| `broadcast:answer` | viewer → broadcaster | `{ to, answer }` |
| `broadcast:ice` | both | `{ to, candidate }` |
| `broadcast:viewer-count` | server → room | `{ count }` |
| `broadcast:stopped` | server → room | `{ reason }` |
| `broadcast:leave` | client → server | — |

The server enforces SDP ≤ 64 KB, ICE ≤ 8 KB, join rate limits, viewer caps,
broadcaster takeover prevention, and marks the stream `ENDED` if the
broadcaster disconnects unexpectedly.

## 6. Reconnects

- Broadcaster: if the signaling socket drops while LIVE the studio shows
  "Reconnecting" and re-joins on the next `connect` (same token, re-offer to
  any viewers that rejoined).
- Viewer: on reconnect the viewer re-emits `broadcast:join`; the broadcaster
  receives `viewer-joined` again and creates a fresh offer.

## 7. HTTP relay endpoint

When running on Vercel, the API routes cannot access `globalThis.io` directly.
Instead, they forward real-time events to the signaling server via HTTP POST:

```
POST https://signaling.yourdomain.com/relay
Authorization: Bearer <SIGNALING_RELAY_SECRET>
Content-Type: application/json

{
  "room": "match:{matchId}",
  "event": "score:updated",
  "data": { "matchId": "...", "inningsId": "...", "ball": {...} }
}
```

The signaling server broadcasts the event to all sockets in the room.
