"use client";

interface Bowler {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  wides: number;
  noBalls: number;
}

interface BowlingTableProps {
  bowlers: Bowler[];
}

export default function BowlingTable({ bowlers }: BowlingTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-white/40 text-left">
            <th className="py-3 px-2">Bowler</th>
            <th className="py-3 px-2 text-right">O</th>
            <th className="py-3 px-2 text-right">M</th>
            <th className="py-3 px-2 text-right">R</th>
            <th className="py-3 px-2 text-right">W</th>
            <th className="py-3 px-2 text-right">Econ</th>
            <th className="py-3 px-2 text-right">WD</th>
            <th className="py-3 px-2 text-right">NB</th>
          </tr>
        </thead>
        <tbody>
          {bowlers.map((b, i) => (
            <tr
              key={i}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="py-3 px-2 text-white font-medium">{b.name}</td>
              <td className="py-3 px-2 text-right text-white/70">{b.overs}</td>
              <td className="py-3 px-2 text-right text-white/70">{b.maidens}</td>
              <td className="py-3 px-2 text-right text-white/70">{b.runs}</td>
              <td className="py-3 px-2 text-right font-semibold text-white">
                {b.wickets}
              </td>
              <td className="py-3 px-2 text-right text-white/60">
                {b.economy.toFixed(2)}
              </td>
              <td className="py-3 px-2 text-right text-white/60">{b.wides}</td>
              <td className="py-3 px-2 text-right text-white/60">{b.noBalls}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { BowlingTable };
