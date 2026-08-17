/**
 * Local file storage for highlight clips.
 *
 * ScoreBolt never stores live video — highlights are short webm clips cut in
 * the browser by the broadcaster's MediaRecorder and uploaded here. Each clip
 * lives at `{VIDEO_STORAGE_PATH}/{matchId}/{highlightId}.webm`. The database
 * row only holds metadata + expiry; the file is deleted when the row expires.
 *
 * The storage root defaults to `/data/scorebolt/highlights` on Linux/macOS and
 * `.data/scorebolt/highlights` inside the project on Windows dev machines.
 * Override with VIDEO_STORAGE_PATH. Serverless/Vercel deployments need a
 * persistent volume (see docs/WEBRTC_SETUP.md).
 */
import { promises as fs } from "fs";
import path from "path";

export interface StoredHighlight {
  buffer: Buffer;
  contentType: string;
  size: number;
}

export interface HighlightStorage {
  readonly id: string;
  save(
    matchId: string,
    highlightId: string,
    data: Buffer,
    contentType: string
  ): Promise<{ size: number }>;
  load(matchId: string, highlightId: string): Promise<StoredHighlight | null>;
  delete(matchId: string, highlightId: string): Promise<void>;
  exists(matchId: string, highlightId: string): Promise<boolean>;
}

export function storageRoot(): string {
  return (
    process.env.VIDEO_STORAGE_PATH ??
    (process.platform === "win32"
      ? path.join(process.cwd(), ".data", "scorebolt", "highlights")
      : path.join(path.sep, "data", "scorebolt", "highlights"))
  );
}

export function highlightFilePath(matchId: string, highlightId: string): string {
  return path.join(storageRoot(), matchId, `${highlightId}.webm`);
}

export const localHighlightStorage: HighlightStorage = {
  id: "local",

  async save(matchId, highlightId, data, _contentType) {
    const dir = path.join(storageRoot(), matchId);
    await fs.mkdir(dir, { recursive: true });
    const file = highlightFilePath(matchId, highlightId);
    await fs.writeFile(file, data);
    return { size: data.byteLength };
  },

  async load(matchId, highlightId) {
    const file = highlightFilePath(matchId, highlightId);
    try {
      const buffer = await fs.readFile(file);
      return { buffer, contentType: "video/webm", size: buffer.byteLength };
    } catch {
      return null;
    }
  },

  async delete(matchId, highlightId) {
    const file = highlightFilePath(matchId, highlightId);
    try {
      await fs.unlink(file);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  },

  async exists(matchId, highlightId) {
    try {
      await fs.access(highlightFilePath(matchId, highlightId));
      return true;
    } catch {
      return false;
    }
  },
};

export function getHighlightStorage(): HighlightStorage {
  return localHighlightStorage;
}
