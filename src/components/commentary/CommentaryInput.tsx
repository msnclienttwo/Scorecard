"use client";

import { useState } from "react";
import { Mic, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VoiceRecorder } from "./VoiceRecorder";

interface CommentaryInputProps {
  selectedBallLabel?: string | null;
  busy?: boolean;
  language?: string;
  onSend: (content: string) => void;
  onOpenVoice: () => void;
  onCloseVoice: () => void;
  voiceOpen: boolean;
  onVoiceSave: (transcript: string) => void;
}

export function CommentaryInput({
  selectedBallLabel,
  busy,
  language,
  onSend,
  onOpenVoice,
  onCloseVoice,
  voiceOpen,
  onVoiceSave,
}: CommentaryInputProps) {
  const [content, setContent] = useState("");

  const submit = () => {
    if (!content.trim()) return;
    onSend(content.trim());
    setContent("");
  };

  return (
    <div className="space-y-2 border-t border-white/10 pt-2">
      {selectedBallLabel && (
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
            Linked to ball {selectedBallLabel}
          </span>
        </div>
      )}

      {voiceOpen ? (
        <VoiceRecorder
          language={language}
          onCancel={onCloseVoice}
          onSave={(transcript) => {
            onVoiceSave(transcript);
            onCloseVoice();
          }}
        />
      ) : (
        <div className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={2}
            maxLength={2000}
            placeholder={
              selectedBallLabel
                ? `Comment on ball ${selectedBallLabel}…`
                : "Add commentary…"
            }
            className="min-h-[48px] flex-1 resize-none rounded-xl border border-white/15 bg-black/30 p-2.5 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={onOpenVoice}
            className="h-10 w-10 shrink-0 px-0"
            title="Speak commentary"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!content.trim()}
            loading={busy}
            className="h-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!voiceOpen && (
        <p className="text-right text-[10px] text-white/25">
          {selectedBallLabel
            ? "This comment will be linked to the selected ball"
            : "Select a ball to link this comment"}
        </p>
      )}
    </div>
  );
}
