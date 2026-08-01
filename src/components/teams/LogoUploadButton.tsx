"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoUploadButtonProps {
  onUploaded: (url: string) => void;
  onError: (message: string) => void;
  className?: string;
}

export function LogoUploadButton({
  onUploaded,
  onError,
  className,
}: LogoUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Upload failed. Try a direct image URL instead.");
      }
      onUploaded(data.url as string);
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Upload failed. Try a direct image URL instead."
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary transition-colors",
          "hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <UploadCloud className="h-3.5 w-3.5" />
        )}
        {uploading ? "Uploading..." : "Upload logo to Cloudinary"}
      </button>
    </>
  );
}
