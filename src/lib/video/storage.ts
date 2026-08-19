/**
 * Storage abstraction for highlight video clips.
 *
 * Production: Cloudinary (persistent, works on Vercel serverless).
 * Development / backward-compat: local filesystem.
 *
 * The storage backend is selected at runtime:
 *   - If CLOUDINARY_CLOUD_NAME is set → Cloudinary adapter
 *   - Otherwise → local filesystem adapter
 *
 * For Cloudinary-backed highlights the database row stores:
 *   providerVideoId  → Cloudinary public_id
 *   playbackUrl      → Cloudinary secure_url
 *   downloadUrl      → internal ScoreBolt download endpoint
 */
import { promises as fs } from "fs";
import path from "path";
import { cloudinaryHighlightStorage } from "./cloudinary-storage";

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

// ---------------------------------------------------------------------------
// Local filesystem adapter (dev / backward-compat for old highlights)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Backend selection
// ---------------------------------------------------------------------------

function isCloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME);
}

export function getHighlightStorage(): HighlightStorage {
  if (isCloudinaryConfigured()) {
    return cloudinaryHighlightStorage;
  }
  return localHighlightStorage;
}
