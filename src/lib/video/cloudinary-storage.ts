import { v2 as cloudinary } from "cloudinary";
import type { HighlightStorage } from "./storage";

/**
 * Cloudinary-backed persistent storage for highlight video clips.
 *
 * Uploads are performed server-side with resource_type: "video" so .webm
 * clips are treated as video assets (not images). Each clip is stored under
 * `scorebolt/highlights/{matchId}/{highlightId}` and the returned
 * `secure_url` / `public_id` are persisted in the database row.
 *
 * CLOUDINARY_API_SECRET never leaves the server.
 */

let configured = false;

function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  configured = true;
}

const FOLDER_PREFIX = "scorebolt/highlights";

function buildPublicId(matchId: string, highlightId: string): string {
  return `${FOLDER_PREFIX}/${matchId}/${highlightId}`;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

function uploadBuffer(
  matchId: string,
  highlightId: string,
  data: Buffer
): Promise<CloudinaryUploadResult> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${FOLDER_PREFIX}/${matchId}`,
        public_id: highlightId,
        resource_type: "video",
        format: "webm",
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary returned no result"));
          return;
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(data);
  });
}

/**
 * Upload a video buffer to Cloudinary and return the URL + public_id.
 * Used by the upload route / highlights module.
 */
export async function uploadHighlightToCloudinary(
  matchId: string,
  highlightId: string,
  data: Buffer
): Promise<CloudinaryUploadResult> {
  return uploadBuffer(matchId, highlightId, data);
}

/**
 * Delete a Cloudinary video resource by its public_id.
 * Used during highlight cleanup / expiry.
 */
export async function deleteCloudinaryVideo(
  pid: string
): Promise<void> {
  ensureConfigured();
  try {
    await cloudinary.uploader.destroy(pid, { resource_type: "video" });
  } catch (err) {
    console.error("[Highlight] Cloudinary video deletion failed for", pid, err);
    throw err;
  }
}

/**
 * Generate the full Cloudinary URL for a given public_id.
 */
export function getCloudinaryVideoUrl(pid: string): string {
  ensureConfigured();
  return cloudinary.url(pid, {
    resource_type: "video",
    format: "webm",
    secure: true,
  });
}

/** Re-export for tests */
export { buildPublicId as __publicIdForTest };

/**
 * Minimal HighlightStorage implementation backed by Cloudinary.
 * Implements save/load/delete/exists via Cloudinary's video API.
 */
export const cloudinaryHighlightStorage: HighlightStorage = {
  id: "cloudinary",

  async save(matchId, highlightId, data) {
    await uploadBuffer(matchId, highlightId, data);
    return { size: data.byteLength };
  },

  async load(matchId, highlightId) {
    const pid = buildPublicId(matchId, highlightId);
    const url = getCloudinaryVideoUrl(pid);
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return {
        buffer: buf,
        contentType: res.headers.get("content-type") ?? "video/webm",
        size: buf.byteLength,
      };
    } catch {
      return null;
    }
  },

  async delete(matchId, highlightId) {
    const pid = buildPublicId(matchId, highlightId);
    try {
      await cloudinary.uploader.destroy(pid, { resource_type: "video" });
    } catch {
      // Idempotent
    }
  },

  async exists(matchId, highlightId) {
    ensureConfigured();
    const pid = buildPublicId(matchId, highlightId);
    try {
      await cloudinary.api.resource(pid, { resource_type: "video" });
      return true;
    } catch {
      return false;
    }
  },
};
