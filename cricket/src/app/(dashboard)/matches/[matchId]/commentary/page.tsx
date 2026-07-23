"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Zap, MessageSquare } from "lucide-react";

interface CommentaryEntry {
  id: number;
  timestamp: string;
  over: number;
  ball: number;
  content: string;
  isHighlight: boolean;
  isAutomatic: boolean;
  emoji?: string;
}

const commentaryData: CommentaryEntry[] = [
  {
    id: 1,
    timestamp: "19:42",
    over: 1,
    ball: 1,
    content: "SIX! Rohit Sharma goes big over long-on! What a way to start the innings. Bumrah drops it short and he's made no mistake.",
    isHighlight: true,
    isAutomatic: false,
    emoji: "🚀",
  },
  {
    id: 2,
    timestamp: "19:43",
    over: 1,
    ball: 2,
    content: "Good length outside off, left alone by Ishan Kishan. No run.",
    isHighlight: false,
    isAutomatic: true,
  },
  {
    id: 3,
    timestamp: "19:44",
    over: 1,
    ball: 3,
    content: "FOUR! Short and pulled over mid-wicket by Ishan! That's gone all the way to the boundary in a flash.",
    isHighlight: true,
    isAutomatic: false,
    emoji: "🔥",
  },
  {
    id: 4,
    timestamp: "19:45",
    over: 1,
    ball: 4,
    content: "Flicked off the pads, taken two runs. Good running between the wickets.",
    isHighlight: false,
    isAutomatic: true,
  },
  {
    id: 5,
    timestamp: "19:45",
    over: 1,
    ball: 5,
    content: "Full delivery on middle, defended solidly back to the bowler.",
    isHighlight: false,
    isAutomatic: true,
  },
  {
    id: 6,
    timestamp: "19:46",
    over: 1,
    ball: 6,
    content: "Pushed to covers for a single. Ishan rotates the strike. End of the over.",
    isHighlight: false,
    isAutomatic: true,
  },
  {
    id: 7,
    timestamp: "19:48",
    over: 2,
    ball: 1,
    content: "WOW! Suryakumar Yadav with an absolutely sensational pull shot! The ball rockets over deep mid-wicket for a MASSIVE SIX! What a way to announce your arrival!",
    isHighlight: true,
    isAutomatic: false,
    emoji: "💥",
  },
  {
    id: 8,
    timestamp: "19:49",
    over: 2,
    ball: 3,
    content: "WICKET! Rohit Sharma caught behind! He's tried to guide it past the keeper but got a thin edge. Chahar strikes! The crowd goes quiet.",
    isHighlight: true,
    isAutomatic: false,
    emoji: "⚡",
  },
  {
    id: 9,
    timestamp: "19:50",
    over: 2,
    ball: 4,
    content: "Inside edge past the stumps! Lucky escape for SKY. Two runs taken.",
    isHighlight: false,
    isAutomatic: false,
  },
  {
    id: 10,
    timestamp: "19:51",
    over: 2,
    ball: 5,
    content: "FOUR! Pristine cover drive from Suryakumar! The timing was exquisite. Chahar drops it in the slot and pays the price.",
    isHighlight: true,
    isAutomatic: false,
    emoji: "🎯",
  },
  {
    id: 11,
    timestamp: "19:52",
    over: 2,
    ball: 6,
    content: "Wide ball down the leg side. Extra run to MI.",
    isHighlight: false,
    isAutomatic: true,
  },
  {
    id: 12,
    timestamp: "19:55",
    over: 3,
    ball: 1,
    content: "Jadeja into the attack. First ball defended back. Tight line and length.",
    isHighlight: false,
    isAutomatic: true,
  },
  {
    id: 13,
    timestamp: "19:56",
    over: 3,
    ball: 4,
    content: "SIX! SKY brings out the helicopter! Over long-on! Jadeja can't believe it. The crowd is on their feet!",
    isHighlight: true,
    isAutomatic: false,
    emoji: "🚁",
  },
  {
    id: 14,
    timestamp: "19:57",
    over: 3,
    ball: 6,
    content: "Dot ball to end the over. Solid defense from Tilak Varma. MI looking strong.",
    isHighlight: false,
    isAutomatic: true,
  },
];

export default function CommentaryPage() {
  const [filter, setFilter] = useState<"all" | "highlights">("all");

  const filtered =
    filter === "highlights"
      ? commentaryData.filter((c) => c.isHighlight)
      : commentaryData;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Commentary</h2>
          </div>
          <div className="flex gap-2">
            {(["all", "highlights"] as const).map((f) => (
              <motion.button
                key={f}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-white/5 text-muted"
                )}
              >
                {f === "highlights" ? (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Highlights
                  </span>
                ) : (
                  "All"
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />

        <div className="space-y-6">
          {filtered.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="relative pl-14"
            >
              <div
                className={cn(
                  "absolute left-4 top-5 w-4 h-4 rounded-full border-2 z-10",
                  entry.isHighlight
                    ? "bg-primary border-primary"
                    : entry.isAutomatic
                    ? "bg-white/10 border-white/20"
                    : "bg-accent border-accent"
                )}
              />

              <div
                className={cn(
                  "bg-white/5 backdrop-blur-xl border rounded-2xl p-5 transition-all hover:bg-white/[0.07]",
                  entry.isHighlight
                    ? "border-primary/30"
                    : "border-white/10"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-muted font-mono">
                    {entry.over}.{entry.ball}
                  </span>
                  <span className="text-xs text-muted">{entry.timestamp}</span>
                  {entry.emoji && <span className="text-lg">{entry.emoji}</span>}
                  {entry.isHighlight && (
                    <span className="text-[10px] font-medium text-primary bg-primary/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      KEY MOMENT
                    </span>
                  )}
                  {entry.isAutomatic && (
                    <span className="text-[10px] text-muted/60 bg-white/5 px-2 py-0.5 rounded-full">
                      AUTO
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "leading-relaxed",
                    entry.isHighlight
                      ? "text-white font-medium"
                      : "text-white/80"
                  )}
                >
                  {entry.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
