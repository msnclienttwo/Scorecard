"use client";

import { MessageSquareText } from "lucide-react";
import { Loader2 } from "lucide-react";
import { CommentaryCard } from "./CommentaryCard";
import type { CommentaryRef } from "@/hooks/useCommentary";

interface CommentaryTimelineProps {
  commentary: CommentaryRef[];
  isLoading: boolean;
  error: unknown;
  selectedId?: string | null;
  busy?: boolean;
  onSelect: (entry: CommentaryRef) => void;
  onTogglePin: (entry: CommentaryRef, pinned: boolean) => void;
  onDelete: (entry: CommentaryRef) => void;
  onRegenerate: (entry: CommentaryRef) => void;
  onTranslate: (entry: CommentaryRef, language: string) => void;
  onImprove: (entry: CommentaryRef) => void;
  onSaveEdit: (entry: CommentaryRef, content: string) => void;
}

export function CommentaryTimeline({
  commentary,
  isLoading,
  error,
  selectedId,
  busy,
  onSelect,
  onTogglePin,
  onDelete,
  onRegenerate,
  onTranslate,
  onImprove,
  onSaveEdit,
}: CommentaryTimelineProps) {
  if (isLoading && commentary.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-8">
        <Loader2 className="h-4 w-4 animate-spin text-white/40" />
        <p className="text-sm text-white/40">Loading commentary…</p>
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm text-danger">
        Failed to load commentary.
      </p>
    );
  }

  if (commentary.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <MessageSquareText className="h-6 w-6 text-white/20" />
        <p className="text-sm text-white/40">
          No commentary yet. Record a ball or add a comment to get started.
        </p>
      </div>
    );
  }

  const pinned = commentary.filter((c) => c.pinned);
  const rest = commentary.filter((c) => !c.pinned);

  return (
    <div className="space-y-2">
      {pinned.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/30">
            Pinned
          </p>
          {pinned.map((entry) => (
            <CommentaryCard
              key={entry.id}
              entry={entry}
              isSelected={entry.id === selectedId}
              onSelect={onSelect}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
              onRegenerate={onRegenerate}
              onTranslate={onTranslate}
              onImprove={onImprove}
              onSaveEdit={onSaveEdit}
              busy={busy}
            />
          ))}
        </>
      )}
      {rest.map((entry) => (
        <CommentaryCard
          key={entry.id}
          entry={entry}
          isSelected={entry.id === selectedId}
          onSelect={onSelect}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
          onTranslate={onTranslate}
          onImprove={onImprove}
          onSaveEdit={onSaveEdit}
          busy={busy}
        />
      ))}
    </div>
  );
}
