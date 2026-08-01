"use client";

import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { isDirectImageUrl } from "@/lib/logo";

interface TeamLogoProps {
  src?: string | null;
  name: string;
  fallback?: ReactNode;
  size?: number;
  className?: string;
  rounded?: string;
  background?: string;
}

export function TeamLogo({
  src,
  name,
  fallback,
  size = 48,
  className,
  rounded = "rounded-xl",
  background,
}: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && isDirectImageUrl(src) && !failed;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-accent",
        rounded,
        className
      )}
      style={{
        width: size,
        height: size,
        ...(background ? { background } : {}),
      }}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="font-bold text-white"
          style={{ fontSize: Math.max(12, Math.round(size * 0.34)) }}
        >
          {fallback ?? name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
