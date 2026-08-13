"use client";

import { Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LANGUAGES } from "@/lib/language";
import type {
  CommentarySettingsRef,
} from "@/hooks/useCommentary";

export const COMMENTARY_STYLES = [
  "professional",
  "tv-broadcast",
  "radio",
  "minimal",
  "energetic",
  "hindi-english",
  "funny",
  "neutral",
  "analytical",
] as const;

export const COMMENTARY_PROVIDERS = [
  { id: "openai", name: "OpenAI" },
  { id: "gemini", name: "Google Gemini" },
  { id: "claude", name: "Anthropic Claude" },
  { id: "ollama", name: "Ollama (local)" },
] as const;

interface CommentarySettingsProps {
  settings?: CommentarySettingsRef;
  saving?: boolean;
  onChange: (patch: Partial<CommentarySettingsRef>) => void;
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5">
      <span>
        <span className="block text-sm text-white">{label}</span>
        <span className="block text-[11px] text-white/40">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          checked
            ? "relative h-5 w-9 shrink-0 rounded-full bg-accent/60 transition-colors"
            : "relative h-5 w-9 shrink-0 rounded-full bg-white/15 transition-colors"
        }
      >
        <span
          className={
            checked
              ? "absolute top-0.5 left-[18px] h-4 w-4 rounded-full bg-white transition-all"
              : "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white/60 transition-all"
          }
        />
      </button>
    </label>
  );
}

export function CommentarySettings({
  settings,
  saving,
  onChange,
}: CommentarySettingsProps) {
  if (!settings) {
    return (
      <p className="py-4 text-center text-sm text-white/40">
        Loading settings…
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-white">Commentary settings</h3>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-6 px-2 text-[11px]"
          onClick={() => onChange({ ...settings })}
          loading={saving}
        >
          <RotateCcw className="h-3 w-3" /> Save
        </Button>
      </div>

      <div className="divide-y divide-white/5">
        <Toggle
          label="AI auto-commentary"
          description="Generate AI commentary after each recorded ball"
          checked={settings.aiEnabled}
          onChange={(v) => onChange({ aiEnabled: v })}
        />
        <Toggle
          label="Auto-generate after balls"
          description="Automatically run AI for every delivery when enabled"
          checked={settings.autoCommentary}
          onChange={(v) => onChange({ autoCommentary: v })}
        />
        <Toggle
          label="Voice input"
          description="Enable the microphone for spoken commentary"
          checked={settings.voiceEnabled}
          onChange={(v) => onChange({ voiceEnabled: v })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Style
          </span>
          <select
            value={settings.style}
            onChange={(e) => onChange({ style: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-[#0d1320] px-2 py-1.5 text-sm text-white/70 focus:border-accent focus:outline-none"
          >
            {COMMENTARY_STYLES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Language
          </span>
          <select
            value={settings.language}
            onChange={(e) => onChange({ language: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-[#0d1320] px-2 py-1.5 text-sm text-white/70 focus:border-accent focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.emoji} {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/40">
            Provider
          </span>
          <select
            value={settings.provider}
            onChange={(e) => onChange({ provider: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-[#0d1320] px-2 py-1.5 text-sm text-white/70 focus:border-accent focus:outline-none"
          >
            {COMMENTARY_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
              Temperature
            </span>
            <span className="text-[11px] tabular-nums text-accent">
              {settings.temperature.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={settings.temperature}
            onChange={(e) => onChange({ temperature: Number(e.target.value) })}
            className="w-full accent-accent"
          />
        </label>
        <label className="block">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
              Creativity
            </span>
            <span className="text-[11px] tabular-nums text-accent">
              {settings.creativity.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.creativity}
            onChange={(e) => onChange({ creativity: Number(e.target.value) })}
            className="w-full accent-accent"
          />
        </label>
      </div>
    </div>
  );
}
