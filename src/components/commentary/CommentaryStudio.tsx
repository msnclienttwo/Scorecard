"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCommentary, type CommentaryRef } from "@/hooks/useCommentary";
import { useCommentarySelection } from "@/store/useCommentarySelection";
import { useUIStore } from "@/store/useUIStore";
import { overLabel } from "@/lib/commentaryTemplates";
import { CommentaryToolbar } from "./CommentaryToolbar";
import { CommentaryFilters } from "./CommentaryFilters";
import { CommentarySettings } from "./CommentarySettings";
import { CommentaryTimeline } from "./CommentaryTimeline";
import { CommentaryInput } from "./CommentaryInput";
import { AISuggestionCard, type AISuggestionResult } from "./AISuggestionCard";

export interface StudioBallRef {
  id: string;
  overNumber: number | null;
  ballNumber: number;
}

interface CommentaryStudioProps {
  matchId: string;
  balls?: StudioBallRef[];
  inningsNumber?: number | null;
}

export function CommentaryStudio({
  matchId,
  balls = [],
  inningsNumber,
}: CommentaryStudioProps) {
  const {
    commentary,
    isLoading,
    error,
    filters,
    setFilters,
    refetchCommentary,
    createCommentary,
    updateCommentary,
    deleteCommentary,
    togglePin,
    aiAction,
    settings,
    updateSettings,
    settingsLoading,
  } = useCommentary(matchId);

  const { selectedBallId, setSelectedBallId, linkBallCommentary } =
    useCommentarySelection();
  const addToast = useUIStore((s) => s.addToast);

  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiState, setAiState] = useState<{
    busy: boolean;
    result: AISuggestionResult | null;
  }>({ busy: false, result: null });

  const selectedBall =
    balls.find((b) => b.id === selectedBallId) ?? null;
  const selectedBallLabel = selectedBall
    ? overLabel(selectedBall.overNumber ?? undefined, selectedBall.ballNumber)
    : null;

  const filtersActive =
    filters.keyword != null ||
    filters.eventType != null ||
    filters.overNumber != null ||
    filters.isAIGenerated != null ||
    filters.pinned != null;

  const notify = (message: string, type: "success" | "error" | "info" = "success") =>
    addToast({ message, type });

  const handleSend = async (content: string) => {
    setSaving(true);
    try {
      const created = await createCommentary({
        content,
        ballId: selectedBallId,
        overNumber: selectedBall ? selectedBall.overNumber : null,
        ballNumber: selectedBall ? selectedBall.ballNumber : null,
        inningsNumber: inningsNumber ?? undefined,
        isHighlight: false,
      });
      if (selectedBallId && created) {
        linkBallCommentary(selectedBallId, created.id);
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to add commentary", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceSave = async (transcript: string) => {
    await handleSend(transcript);
  };

  const handleDelete = async (entry: CommentaryRef) => {
    try {
      await deleteCommentary(entry.id);
      if (selectedBallId && entry.ballId === selectedBallId) {
        setSelectedBallId(null);
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  };

  const handleRegenerate = async (entry: CommentaryRef) => {
    setSaving(true);
    try {
      const result = await aiAction({
        action: "regenerate",
        commentaryId: entry.id,
      });
      notify("Commentary regenerated");
      if (result.commentary) {
        setAiState({ busy: false, result: null });
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : "Regeneration failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleImprove = async (entry: CommentaryRef) => {
    setSaving(true);
    try {
      const result = await aiAction({
        action: "improve",
        commentaryId: entry.id,
        text: entry.content,
        style: settings?.style,
      });
      await updateCommentary(entry.id, {
        content: result.content,
      });
      notify("Commentary improved");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Improve failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTranslate = async (entry: CommentaryRef, language: string) => {
    setSaving(true);
    try {
      const result = await aiAction({
        action: "translate",
        commentaryId: entry.id,
        text: entry.content,
        language,
      });
      await updateCommentary(entry.id, {
        content: result.content,
        language,
      });
      notify(`Translated to ${language}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Translation failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (entry: CommentaryRef, content: string) => {
    setSaving(true);
    try {
      await updateCommentary(entry.id, { content });
      notify("Commentary updated");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAI = async (ballId: string) => {
    setAiState({ busy: true, result: null });
    try {
      const result = await aiAction({
        action: "generate",
        ballId,
        provider: settings?.provider,
        style: settings?.style,
        language: settings?.language,
      });
      setAiState({
        busy: false,
        result: {
          content: result.content,
          provider: result.provider,
          commentaryId: result.commentary?.id,
        },
      });
    } catch (err) {
      setAiState({ busy: false, result: null });
      notify(err instanceof Error ? err.message : "AI generation failed", "error");
    }
  };

  const handleAcceptSuggestion = async (commentaryId: string) => {
    try {
      await togglePin(commentaryId, true);
      if (selectedBallId) linkBallCommentary(selectedBallId, commentaryId);
      notify("Pinned to feed");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Pin failed", "error");
    }
    setAiState({ busy: false, result: null });
  };

  const handleDismissSuggestion = async (commentaryId: string) => {
    try {
      await deleteCommentary(commentaryId);
    } catch {
      // ignore
    }
    setAiState({ busy: false, result: null });
  };

  const handleSettingsChange = async (
    patch: Parameters<typeof updateSettings>[0]
  ) => {
    try {
      await updateSettings(patch);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Settings update failed", "error");
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#0d1320]/80 p-3">
      <CommentaryToolbar
        aiEnabled={settings?.aiEnabled}
        filtersActive={filtersActive}
        showFilters={showFilters}
        voiceOpen={voiceOpen}
        loading={isLoading}
        onToggleFilters={() => setShowFilters((v) => !v)}
        onToggleVoice={() => setVoiceOpen((v) => !v)}
        onOpenSettings={() => setShowSettings((v) => !v)}
        onRefresh={() => void refetchCommentary()}
      />

      {showFilters && (
        <CommentaryFilters filters={filters} onChange={setFilters} />
      )}

      {showSettings && (
        <CommentarySettings
          settings={settings}
          saving={settingsLoading}
          onChange={(patch) => void handleSettingsChange(patch)}
        />
      )}

      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        <CommentaryTimeline
          commentary={commentary}
          isLoading={isLoading}
          error={error}
          selectedId={null}
          busy={saving}
          onSelect={() => {}}
          onTogglePin={(entry, pinned) => void togglePin(entry.id, pinned)}
          onDelete={(entry) => void handleDelete(entry)}
          onRegenerate={(entry) => void handleRegenerate(entry)}
          onTranslate={(entry, language) => void handleTranslate(entry, language)}
          onImprove={(entry) => void handleImprove(entry)}
          onSaveEdit={(entry, content) => void handleSaveEdit(entry, content)}
        />
      </div>

      {selectedBall && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1 text-xs"
            onClick={() => void handleGenerateAI(selectedBall.id)}
            disabled={aiState.busy}
          >
            <Sparkles className="h-3.5 w-3.5" /> Generate AI for ball{" "}
            {selectedBallLabel}
          </Button>
          <button
            type="button"
            onClick={() => setSelectedBallId(null)}
            className="text-[11px] text-white/40 hover:text-white"
          >
            Clear selection
          </button>
        </div>
      )}

      {selectedBall && (
        <AISuggestionCard
          busy={aiState.busy}
          result={aiState.result}
          ballLabel={selectedBallLabel}
          onAccept={(id) => void handleAcceptSuggestion(id)}
          onRegenerate={() => void handleGenerateAI(selectedBall.id)}
          onDismiss={(id) => void handleDismissSuggestion(id)}
        />
      )}

      <CommentaryInput
        selectedBallLabel={selectedBallLabel}
        busy={saving}
        language={settings?.language}
        onSend={(content) => void handleSend(content)}
        onOpenVoice={() => setVoiceOpen(true)}
        onCloseVoice={() => setVoiceOpen(false)}
        voiceOpen={voiceOpen}
        onVoiceSave={(transcript) => void handleVoiceSave(transcript)}
      />

      <p className="text-center text-[10px] text-white/25">
        {commentary.length} {commentary.length === 1 ? "line" : "lines"} of
        commentary
      </p>
    </div>
  );
}
