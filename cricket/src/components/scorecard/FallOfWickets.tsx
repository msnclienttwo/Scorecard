"use client";

interface Wicket {
  batsman: string;
  score: string;
  over: number;
}

interface FallOfWicketsProps {
  wickets: Wicket[];
}

export default function FallOfWickets({ wickets }: FallOfWicketsProps) {
  return (
    <div className="py-4">
      <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
        Fall of Wickets
      </h3>
      <div className="relative overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max pb-4">
          {wickets.map((w, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-[#070B14] shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                <div className="mt-2 text-center">
                  <div className="text-xs font-medium text-white">{w.batsman}</div>
                  <div className="text-xs text-white/50">{w.score}</div>
                  <div className="text-xs text-white/30">{w.over} ov</div>
                </div>
              </div>
              {i < wickets.length - 1 && (
                <div className="w-16 h-0.5 bg-white/10 mx-1 mt-[-28px]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { FallOfWickets };
