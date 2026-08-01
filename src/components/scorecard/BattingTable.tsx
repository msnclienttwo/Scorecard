"use client";

import { formatStoredOvers } from "@/lib/utils";

interface Batsman {
  number: number;
  name: string;
  dismissal: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isNotOut: boolean;
  isStriker: boolean;
}

interface BattingTableProps {
  batsmen: Batsman[];
  extras: number;
  total: { runs: number; wickets: number; overs: number };
}

export default function BattingTable({ batsmen, extras, total }: BattingTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-white/40 text-left">
            <th className="py-3 px-2 w-10">#</th>
            <th className="py-3 px-2">Batsman</th>
            <th className="py-3 px-2">Dismissal</th>
            <th className="py-3 px-2 text-right">R</th>
            <th className="py-3 px-2 text-right">B</th>
            <th className="py-3 px-2 text-right">4s</th>
            <th className="py-3 px-2 text-right">6s</th>
            <th className="py-3 px-2 text-right">SR</th>
          </tr>
        </thead>
        <tbody>
          {batsmen.map((b) => (
            <tr
              key={b.number}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="py-3 px-2 text-white/40">{b.number}</td>
              <td
                className={`py-3 px-2 ${
                  b.isStriker ? "font-bold text-white" : "text-white/80"
                } ${b.isNotOut ? "text-green-400" : ""}`}
              >
                {b.name}
                {b.isStriker && <span className="text-[#00D4FF] ml-1">*</span>}
              </td>
              <td className="py-3 px-2 text-white/50 text-xs">{b.dismissal}</td>
              <td className="py-3 px-2 text-right font-semibold text-white">
                {b.runs}
              </td>
              <td className="py-3 px-2 text-right text-white/70">{b.balls}</td>
              <td className="py-3 px-2 text-right text-white/70">{b.fours}</td>
              <td className="py-3 px-2 text-right text-white/70">{b.sixes}</td>
              <td className="py-3 px-2 text-right text-white/60">
                {b.strikeRate.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/10 font-semibold">
            <td colSpan={3} className="py-3 px-2 text-white/60">
              Extras: {extras}
            </td>
            <td className="py-3 px-2 text-right text-white">
              {total.runs}
            </td>
            <td colSpan={3} className="py-3 px-2 text-right text-white/50">
              {total.wickets}/{formatStoredOvers(total.overs)} overs
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export { BattingTable };
