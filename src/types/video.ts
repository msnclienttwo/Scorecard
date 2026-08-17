export type ClientHighlightStatus =
  | "PENDING"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "EXPIRED";

export interface HighlightRef {
  id: string;
  matchId: string;
  ballId: string;
  eventType: string;
  inningsNumber: number;
  overNumber: number;
  ballNumber: number;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: ClientHighlightStatus;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
  downloadUrl: string | null;
  createdAt: string;
  expiresAt: string;
}

export type StreamStatus = "CREATED" | "LIVE" | "ENDED";

export interface ClientIceServer {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface StreamRef {
  id: string;
  status: StreamStatus;
  provider: string;
  playbackUrl: string | null;
  startedAt: string | null;
  endedAt: string | null;
  broadcasterId: string;
  iceServers?: ClientIceServer[];
  maxViewers?: number;
  highlightPreRollSeconds?: number;
  highlightPostRollSeconds?: number;
}

export interface BroadcasterRef {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string };
  status: string;
  createdAt: string;
}

export interface BroadcastState {
  match: { id: string; name: string; status: string };
  configured: boolean;
  setupMessage: string | null;
  canManage: boolean;
  broadcaster: { id: string; status: string; createdAt: string } | null;
  broadcasters: BroadcasterRef[];
  stream: StreamRef | null;
}

export interface GoLiveInfo {
  stream: {
    id: string;
    status: StreamStatus;
    provider: string;
    playbackUrl: string | null;
    startedAt: string | null;
    endedAt: string | null;
    broadcasterId: string;
    iceServers: ClientIceServer[];
    maxViewers: number;
    highlightPreRollSeconds?: number;
    highlightPostRollSeconds?: number;
  };
}
