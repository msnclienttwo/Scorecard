"use client";

interface Shot {
  angle: number;
  runs: number;
}

interface WagonWheelProps {
  shots: Shot[];
}

function getColor(runs: number): string {
  if (runs === 0) return "#333333";
  if (runs === 1) return "#FFFFFF";
  if (runs === 2) return "#9CA3AF";
  if (runs === 3) return "#22C55E";
  if (runs === 4) return "#2563EB";
  if (runs === 6) return "#00D4FF";
  return "#FFFFFF";
}

export default function WagonWheel({ shots }: WagonWheelProps) {
  const size = 300;
  const center = size / 2;
  const radius = 130;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
        Wagon Wheel
      </h3>
      <div className="flex justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="drop-shadow-lg"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#ffffff15"
            strokeWidth={1}
          />
          <circle
            cx={center}
            cy={center}
            r={radius * 0.66}
            fill="none"
            stroke="#ffffff10"
            strokeWidth={1}
          />
          <circle
            cx={center}
            cy={center}
            r={radius * 0.33}
            fill="none"
            stroke="#ffffff08"
            strokeWidth={1}
          />
          <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="#ffffff08" strokeWidth={1} />
          <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="#ffffff08" strokeWidth={1} />

          {shots.map((shot, i) => {
            const rad = (shot.angle * Math.PI) / 180;
            const endX = center + radius * Math.cos(rad);
            const endY = center + radius * Math.sin(rad);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={endX}
                y2={endY}
                stroke={getColor(shot.runs)}
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={0.7}
              />
            );
          })}

          <circle cx={center} cy={center} r={4} fill="#2563EB" />
          <circle cx={center} cy={center} r={2} fill="#FFFFFF" />
        </svg>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {[
          { label: "Dot", color: "#333333" },
          { label: "1", color: "#FFFFFF" },
          { label: "2", color: "#9CA3AF" },
          { label: "3", color: "#22C55E" },
          { label: "4", color: "#2563EB" },
          { label: "6", color: "#00D4FF" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-white/60">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export { WagonWheel };
