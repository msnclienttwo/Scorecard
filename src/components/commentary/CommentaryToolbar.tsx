"use client";

import { Filter, Loader2, Mic, RefreshCw, Settings, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface CommentaryToolbarProps {
  aiEnabled?: boolean;
  filtersActive: boolean;
  showFilters: boolean;
  voiceOpen: boolean;
  loading: boolean;
  onToggleFilters: () => void;
  onToggleVoice: () => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
}

export function CommentaryToolbar({
  aiEnabled,
  filtersActive,
  showFilters,
  voiceOpen,
  loading,
  onToggleFilters,
  onToggleVoice,
  onOpenSettings,
  onRefresh,
}: CommentaryToolbarProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <h3 className="truncate text-sm font-bold text-white">
          Commentary Studio
        </h3>
        {aiEnabled && (
          <Badge variant="accent" size="sm">
            <Sparkles className="mr-1 h-3 w-3" /> AI
          </Badge>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          title="Refresh commentary"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onToggleFilters}
          className={cn(
            "relative rounded-lg p-1.5 transition-colors",
            showFilters || filtersActive
              ? "bg-accent/20 text-accent"
              : "text-white/50 hover:bg-white/10 hover:text-white"
          )}
          title="Filter commentary"
        >
          <Filter className="h-4 w-4" />
          {filtersActive && (
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
          )}
        </button>
        <button
          type="button"
          onClick={onToggleVoice}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            voiceOpen
              ? "bg-red-500/20 text-red-400"
              : "text-white/50 hover:bg-white/10 hover:text-white"
          )}
          title="Voice input"
        >
          <Mic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          title="Commentary settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
