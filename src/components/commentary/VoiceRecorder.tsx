"use client";

import { useEffect } from "react";
import { Mic, Square, Save, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  language?: string;
  onCancel: () => void;
  onSave: (transcript: string) => void;
}

export function VoiceRecorder({
  language,
  onCancel,
  onSave,
}: VoiceRecorderProps) {
  const {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    error,
    start,
    stop,
    reset,
  } = useVoiceRecorder({ language });

  useEffect(() => {
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-sm text-white/60">
          Voice input is not supported in this browser. Type commentary instead.
        </p>
        <Button size="sm" variant="ghost" className="mt-2" onClick={onCancel}>
          Close
        </Button>
      </div>
    );
  }

  const display = finalTranscript || interimTranscript;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={isListening ? stop : start}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
            isListening
              ? "animate-pulse bg-red-500 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
          )}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1">
          {isListening && (
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-red-400">
              Listening…
            </span>
          )}
          <p className="truncate text-sm text-white/80">
            {interimTranscript || display || "Speak the commentary…"}
          </p>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={reset}
          disabled={!display}
        >
          Clear
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(display)}
          disabled={!display}
        >
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
      </div>
    </div>
  );
}
