"use client";

import { useState } from "react";
import {
  Bot,
  Mic,
  MicOff,
  Pencil,
  Pin,
  PinOff,
  RefreshCw,
  Sparkles,
  Trash2,
  Languages,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { cn } from "@/lib/utils";
import { languageEmoji, languageName } from "@/lib/language";
import { overLabel } from "@/lib/commentaryTemplates";
import type { CommentaryRef } from "@/hooks/useCommentary";
import { CommentaryEditor } from "./CommentaryEditor";

interface CommentaryCardProps {
  entry: CommentaryRef;
  isSelected?: boolean;
  onSelect?: (entry: CommentaryRef) => void;
  onTogglePin: (entry: CommentaryRef, pinned: boolean) => void;
  onDelete: (entry: CommentaryRef) => void;
  onRegenerate: (entry: CommentaryRef) => void;
  onTranslate: (entry: CommentaryRef, language: string) => void;
  onImprove: (entry: CommentaryRef) => void;
  onSaveEdit: (entry: CommentaryRef, content: string) => void;
  busy?: boolean;
}

const EVENT_BADGE: Record<string, { label: string; variant: "success" | "danger" | "warning" | "info" | "accent" | "default" }> = {
  WICKET: { label: "Wicket", variant: "danger" },
  SIX: { label: "Six", variant: "accent" },
  FOUR: { label: "Four", variant: "info" },
  MILESTONE: { label: "Milestone", variant: "warning" },
  END_OF_OVER: { label: "End of over", variant: "default" },
  END_OF_INNINGS: { label: "Innings", variant: "info" },
  RESULT: { label: "Result", variant: "success" },
};

export function CommentaryCard({
  entry,
  isSelected,
  onSelect,
  onTogglePin,
  onDelete,
  onRegenerate,
  onTranslate,
  onImprove,
  onSaveEdit,
  busy,
}: CommentaryCardProps) {
  const [editing, setEditing] = useState(false);
  const eventBadge = EVENT_BADGE[entry.eventType ?? ""];

  const ballLabel = entry.ball
    ? overLabel(
        entry.ball.over?.overNumber ?? undefined,
        entry.ball.ballNumber
      )
    : entry.overNumber != null && entry.ballNumber != null
      ? overLabel(entry.overNumber, entry.ballNumber)
      : null;

  const isAILine = entry.isAIGenerated || entry.generatedBy === "AI";

  return (
    <div
      className={cn(
        "group rounded-xl border p-3 transition-colors",
        isSelected
          ? "border-accent/60 bg-accent/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/20",
        entry.pinned && !isSelected && "border-yellow-500/40"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onSelect?.(entry)}
          className="mt-0.5 shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white/60 transition-colors hover:text-white"
          title="Select this commentary"
        >
          {ballLabel ?? "•"}
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <CommentaryEditor
              initial={entry.content}
              busy={busy}
              onCancel={() => setEditing(false)}
              onSave={(content) => {
                onSaveEdit(entry, content);
                setEditing(false);
              }}
            />
          ) : (
            <p className="text-sm leading-relaxed text-white">{entry.content}</p>
          )}
        </div>

        <Dropdown
          align="right"
          trigger={
            <button
              type="button"
              className="rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Commentary actions"
            >
              <span className="flex h-5 w-5 items-center justify-center text-base leading-none">
                ⋯
              </span>
            </button>
          }
          items={[
            {
              label: "Edit",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => setEditing(true),
            },
            {
              label: "Regenerate",
              icon: <RefreshCw className="h-4 w-4" />,
              onClick: () => onRegenerate(entry),
            },
            {
              label: "Improve with AI",
              icon: <Sparkles className="h-4 w-4" />,
              onClick: () => onImprove(entry),
            },
            {
              label: entry.pinned ? "Unpin" : "Pin",
              icon: entry.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />,
              onClick: () => onTogglePin(entry, !entry.pinned),
            },
            {
              label: "Delete",
              icon: <Trash2 className="h-4 w-4" />,
              destructive: true,
              onClick: () => onDelete(entry),
            },
          ]}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {eventBadge && (
          <Badge variant={eventBadge.variant} size="sm">
            {eventBadge.label}
          </Badge>
        )}
        {isAILine ? (
          <Badge variant="accent" size="sm">
            <Sparkles className="mr-1 h-3 w-3" /> AI
          </Badge>
        ) : entry.isAutomatic ? (
          <Badge variant="default" size="sm">
            Auto
          </Badge>
        ) : (
          <Badge variant="info" size="sm">
            <Mic className="mr-1 h-3 w-3" /> Manual
          </Badge>
        )}
        {entry.pinned && (
          <Badge variant="warning" size="sm">
            <Pin className="mr-1 h-3 w-3" /> Pinned
          </Badge>
        )}
        {entry.language && entry.language !== "en" && (
          <Badge variant="default" size="sm">
            {languageEmoji(entry.language)} {languageName(entry.language)}
          </Badge>
        )}
        {entry.user?.name && (
          <span className="text-[11px] text-white/40">{entry.user.name}</span>
        )}
        {entry.ballId && (
          <span className="ml-auto flex items-center gap-1 text-[11px] text-white/30">
            <MicOff className="h-3 w-3" /> Ball linked
          </span>
        )}
      </div>

      {isAILine && (
        <div className="mt-2 flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={() => onRegenerate(entry)}
            loading={busy}
          >
            <RefreshCw className="h-3 w-3" /> Regenerate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={() => onTranslate(entry, entry.language === "hi" ? "en" : "hi")}
          >
            <Languages className="h-3 w-3" /> Translate
          </Button>
          {entry.generatedBy === "AI" && entry.provider && (
            <span className="ml-auto text-[11px] capitalize text-white/30">
              {entry.provider}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
