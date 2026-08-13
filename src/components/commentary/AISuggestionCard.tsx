"use client";

import { Loader2, Pin, RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface AISuggestionResult {
  content: string;
  provider: string | null;
  commentaryId?: string;
}

interface AISuggestionCardProps {
  busy: boolean;
  result: AISuggestionResult | null;
  ballLabel?: string | null;
  onAccept: (commentaryId: string) => void;
  onRegenerate: () => void;
  onDismiss: (commentaryId: string) => void;
}

export function AISuggestionCard({
  busy,
  result,
  ballLabel,
  onAccept,
  onRegenerate,
  onDismiss,
}: AISuggestionCardProps) {
  if (busy && !result) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        <p className="text-sm text-white/70">
          Generating AI commentary
          {ballLabel ? ` for ball ${ballLabel}` : ""}…
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <p className="text-[11px] font-bold uppercase tracking-wide text-accent">
          AI Suggestion
        </p>
        {result.provider && (
          <Badge size="sm" variant="accent" className="capitalize">
            {result.provider}
          </Badge>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-white">{result.content}</p>
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => result.commentaryId && onAccept(result.commentaryId)}
          disabled={!result.commentaryId}
        >
          <Pin className="h-3.5 w-3.5" /> Pin to feed
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={onRegenerate}
          loading={busy}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Regenerate
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => result.commentaryId && onDismiss(result.commentaryId)}
          disabled={!result.commentaryId}
        >
          <X className="h-3.5 w-3.5" /> Discard
        </Button>
      </div>
    </div>
  );
}
