"use client";

import { useState } from "react";
import { FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentaryFilters as CommentaryFiltersType } from "@/hooks/useCommentary";

interface CommentaryFiltersProps {
  filters: CommentaryFiltersType;
  onChange: (filters: CommentaryFiltersType) => void;
}

const EVENT_OPTIONS = [
  { value: "WICKET", label: "Wickets" },
  { value: "SIX", label: "Sixes" },
  { value: "FOUR", label: "Fours" },
  { value: "MILESTONE", label: "Milestones" },
];

type QuickFilter = "all" | "ai" | "manual" | "pinned";

function quickFilterFrom(filters: CommentaryFiltersType): QuickFilter {
  if (filters.pinned) return "pinned";
  if (filters.isAIGenerated === true) return "ai";
  if (filters.isAIGenerated === false) return "manual";
  return "all";
}

export function CommentaryFilters({
  filters,
  onChange,
}: CommentaryFiltersProps) {
  const [keyword, setKeyword] = useState(filters.keyword ?? "");
  const activeQuick = quickFilterFrom(filters);

  const setQuick = (q: QuickFilter) => {
    onChange({
      ...filters,
      pinned: q === "pinned" ? true : undefined,
      isAIGenerated:
        q === "ai" ? true : q === "manual" ? false : undefined,
      keyword: q === "all" ? undefined : filters.keyword,
    });
  };

  const applyKeyword = () => {
    onChange({ ...filters, keyword: keyword.trim() || undefined });
  };

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: "all", label: "All" },
            { id: "ai", label: "AI" },
            { id: "manual", label: "Manual" },
            { id: "pinned", label: "Pinned" },
          ] as { id: QuickFilter; label: string }[]
        ).map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setQuick(q.id)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
              activeQuick === q.id
                ? "bg-accent/20 text-accent"
                : "bg-white/5 text-white/50 hover:text-white"
            )}
          >
            {q.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1.5">
          <select
            value={filters.eventType ?? ""}
            onChange={(e) =>
              onChange({ ...filters, eventType: e.target.value || undefined })
            }
            className="rounded-lg border border-white/10 bg-[#0d1320] px-2 py-1 text-[11px] text-white/60"
          >
            <option value="">All events</option>
            {EVENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            placeholder="Over"
            value={filters.overNumber ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                overNumber: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-16 rounded-lg border border-white/10 bg-[#0d1320] px-2 py-1 text-[11px] text-white/60 placeholder:text-white/25"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyKeyword();
          }}
          placeholder="Search commentary…"
          className="flex-1 rounded-lg border border-white/10 bg-[#0d1320] px-2.5 py-1 text-xs text-white/60 placeholder:text-white/25 focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={applyKeyword}
          className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/60 hover:text-white"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => {
            setKeyword("");
            onChange({});
          }}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-white/40 hover:text-white"
          title="Clear filters"
        >
          <FilterX className="h-3.5 w-3.5" /> Clear
        </button>
      </div>
    </div>
  );
}
