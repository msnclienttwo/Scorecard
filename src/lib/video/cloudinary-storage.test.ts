import { describe, expect, it, vi } from "vitest";

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn((_opts: unknown, cb: (err: null, result: { secure_url: string; public_id: string }) => void) => {
        const fakeResult = {
          secure_url: "https://res.cloudinary.com/test/video/upload/scorebolt/highlights/m1/h1.webm",
          public_id: "scorebolt/highlights/m1/h1",
        };
        return {
          end: () => cb(null, fakeResult),
          write: vi.fn(),
          on: vi.fn(),
        };
      }),
      destroy: vi.fn().mockResolvedValue({ result: "ok" }),
    },
    api: {
      resource: vi.fn().mockResolvedValue({ public_id: "scorebolt/highlights/m1/h1" }),
    },
    url: vi.fn(
      (pid: string) => `https://res.cloudinary.com/test/video/upload/${pid}.webm`
    ),
  },
}));

import {
  cloudinaryHighlightStorage,
  uploadHighlightToCloudinary,
  deleteCloudinaryVideo,
} from "@/lib/video/cloudinary-storage";
import { v2 as cloudinary } from "cloudinary";

describe("cloudinaryHighlightStorage", () => {
  it("save uploads via cloudinary and returns size", async () => {
    const data = Buffer.from("fake-webm-bytes");
    const result = await cloudinaryHighlightStorage.save("m1", "h1", data, "video/webm");
    expect(result.size).toBe(data.byteLength);
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalled();
  });

  it("delete calls cloudinary uploader.destroy with video resource_type", async () => {
    await cloudinaryHighlightStorage.delete("m1", "h1");
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      "scorebolt/highlights/m1/h1",
      { resource_type: "video" }
    );
  });

  it("exists returns true when cloudinary finds the resource", async () => {
    const result = await cloudinaryHighlightStorage.exists("m1", "h1");
    expect(result).toBe(true);
  });

  it("exists returns false when cloudinary throws", async () => {
    vi.mocked(cloudinary.api.resource).mockRejectedValueOnce(new Error("Not found"));
    const result = await cloudinaryHighlightStorage.exists("m1", "h1");
    expect(result).toBe(false);
    // Restore for other tests
    vi.mocked(cloudinary.api.resource).mockResolvedValue({ public_id: "test" } as never);
  });

  it("id has the correct identifier", () => {
    expect(cloudinaryHighlightStorage.id).toBe("cloudinary");
  });
});

describe("uploadHighlightToCloudinary", () => {
  it("returns secureUrl and publicId", async () => {
    const result = await uploadHighlightToCloudinary("m1", "h1", Buffer.from("data"));
    expect(result.secureUrl).toContain("cloudinary.com");
    expect(result.publicId).toBe("scorebolt/highlights/m1/h1");
  });
});

describe("deleteCloudinaryVideo", () => {
  it("calls destroy with video resource_type", async () => {
    await deleteCloudinaryVideo("scorebolt/highlights/m1/h1");
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      "scorebolt/highlights/m1/h1",
      { resource_type: "video" }
    );
  });
});

describe("cloudinary credentials are never exposed to client", () => {
  it("cloudinary-storage.ts is a server-only module (no use client directive)", () => {
    const fs = require("fs");
    const storageCode = fs.readFileSync(
      require("path").join(__dirname, "cloudinary-storage.ts"),
      "utf8"
    );
    expect(storageCode).not.toContain('"use client"');
  });

  it("CLOUDINARY_API_SECRET is only read from process.env, never exported", () => {
    const fs = require("fs");
    const storageCode = fs.readFileSync(
      require("path").join(__dirname, "cloudinary-storage.ts"),
      "utf8"
    );
    // The secret is only referenced via process.env.CLOUDINARY_API_SECRET
    const secretRefs = storageCode.match(/CLOUDINARY_API_SECRET/g) ?? [];
    expect(secretRefs.length).toBeGreaterThan(0); // Must reference it
    // All references should be process.env reads, not exports
    expect(storageCode).not.toMatch(/export.*CLOUDINARY_API_SECRET/);
  });
});
