"use client";

import {
  ArrowLeftRight,
  Ban,
  CloudRain,
  Coffee,
  Flag,
  HelpCircle,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionBarProps {
  submitting: boolean;
  hasLastBall: boolean;
  isPaused: boolean;
  onUndo: () => void;
  onEditLast: () => void;
  onSwap: () => void;
  onChangeBatter: () => void;
  onChangeBowler: () => void;
  onTogglePause: () => void;
  onRainDelay: () => void;
  onDrinks: () => void;
  onEndInnings: () => void;
  onFinish: () => void;
  onHelp: () => void;
}

function ActionButton({
  onClick,
  disabled,
  className,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-w-[64px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-2.5 text-xs font-semibold transition-colors active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function QuickActionBar({
  submitting,
  hasLastBall,
  isPaused,
  onUndo,
  onEditLast,
  onSwap,
  onChangeBatter,
  onChangeBowler,
  onTogglePause,
  onRainDelay,
  onDrinks,
  onEndInnings,
  onFinish,
  onHelp,
}: QuickActionBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <ActionButton
          onClick={onUndo}
          disabled={submitting || !hasLastBall}
          className="flex-[1.4] bg-accent text-black hover:bg-accent-light"
        >
          <Undo2 className="h-4 w-4" />
          Undo
        </ActionButton>
        <ActionButton
          onClick={onEditLast}
          disabled={submitting || !hasLastBall}
          className="bg-white/10 text-white hover:bg-white/15"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </ActionButton>
        <ActionButton
          onClick={onSwap}
          disabled={submitting}
          className="bg-white/10 text-white hover:bg-white/15"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Swap
        </ActionButton>
        <ActionButton
          onClick={onChangeBatter}
          disabled={submitting}
          className="bg-white/10 text-white hover:bg-white/15"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Batter
        </ActionButton>
        <ActionButton
          onClick={onChangeBowler}
          disabled={submitting}
          className="bg-white/10 text-white hover:bg-white/15"
        >
          <Flag className="h-3.5 w-3.5" />
          Bowler
        </ActionButton>
        <ActionButton
          onClick={onTogglePause}
          disabled={submitting}
          className={
            isPaused
              ? "bg-success/20 text-success hover:bg-success/30"
              : "bg-white/10 text-white hover:bg-white/15"
          }
        >
          {isPaused ? (
            <Play className="h-3.5 w-3.5" />
          ) : (
            <Pause className="h-3.5 w-3.5" />
          )}
          {isPaused ? "Resume" : "Pause"}
        </ActionButton>
        <ActionButton
          onClick={onHelp}
          className="bg-white/5 text-muted hover:bg-white/10"
        >
          <HelpCircle className="h-4 w-4" />
        </ActionButton>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        <ActionButton
          onClick={onRainDelay}
          disabled={submitting}
          className="bg-warning/10 text-warning hover:bg-warning/20"
        >
          <CloudRain className="h-3.5 w-3.5" />
          Rain
        </ActionButton>
        <ActionButton
          onClick={onDrinks}
          disabled={submitting}
          className="bg-white/5 text-muted hover:bg-white/10"
        >
          <Coffee className="h-3.5 w-3.5" />
          Drinks
        </ActionButton>
        <ActionButton
          onClick={onEndInnings}
          disabled={submitting}
          className="bg-white/5 text-muted hover:bg-white/10"
        >
          <Ban className="h-3.5 w-3.5" />
          End Innings
        </ActionButton>
        <ActionButton
          onClick={onFinish}
          disabled={submitting}
          className="bg-danger/10 text-danger hover:bg-danger/20"
        >
          <Flag className="h-3.5 w-3.5" />
          Finish Match
        </ActionButton>
      </div>
    </div>
  );
}
