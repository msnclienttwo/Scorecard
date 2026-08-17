import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import {
  localHighlightStorage,
  storageRoot,
  highlightFilePath,
} from "@/lib/video/storage";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = path.join(os.tmpdir(), `scorebolt-storage-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  process.env.VIDEO_STORAGE_PATH = tmpRoot;
});

afterEach(async () => {
  delete process.env.VIDEO_STORAGE_PATH;
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("localHighlightStorage", () => {
  it("round-trips a saved clip", async () => {
    const data = Buffer.from("fake-webm-bytes");
    await localHighlightStorage.save("m1", "h1", data, "video/webm");

    expect(await localHighlightStorage.exists("m1", "h1")).toBe(true);

    const loaded = await localHighlightStorage.load("m1", "h1");
    expect(loaded?.buffer.equals(data)).toBe(true);
    expect(loaded?.size).toBe(data.byteLength);
    expect(loaded?.contentType).toBe("video/webm");
  });

  it("stores at the expected path", async () => {
    await localHighlightStorage.save("m1", "h1", Buffer.from("x"), "video/webm");
    expect(highlightFilePath("m1", "h1")).toBe(path.join(storageRoot(), "m1", "h1.webm"));
    await expect(fs.access(highlightFilePath("m1", "h1"))).resolves.toBeUndefined();
  });

  it("delete is idempotent and clears the file", async () => {
    await localHighlightStorage.save("m1", "h1", Buffer.from("x"), "video/webm");
    await localHighlightStorage.delete("m1", "h1");
    expect(await localHighlightStorage.exists("m1", "h1")).toBe(false);
    await expect(localHighlightStorage.delete("m1", "h1")).resolves.toBeUndefined();
    expect(await localHighlightStorage.load("m1", "h1")).toBeNull();
  });

  it("load returns null for a missing clip", async () => {
    expect(await localHighlightStorage.load("m1", "nope")).toBeNull();
  });
});
