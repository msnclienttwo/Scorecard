"use client";

import { motion } from "framer-motion";

interface Standing {
  id?: string;
  team?: { name: string; shortName: string };
  matchesPlayed?: number;
  wins?: number;
  losses?: number;
  ties?: number;
  noResult?: number;
  points?: number;
  nrr?: number;
  position?: number;
}

interface PointsTableProps {
  standings: Standing[];
  teams?: any[];
}

export default function PointsTable({ standings, teams }: PointsTableProps) {
  const sorted = [...(standings || [])].sort(
    (a, b) => (b.points || 0) - (a.points || 0) || (b.nrr || 0) - (a.nrr || 0)
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-white/30">
        No standings available yet
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 px-3 text-left text-white/40 font-medium">#</th>
              <th className="py-3 px-3 text-left text-white/40 font-medium">Team</th>
              <th className="py-3 px-3 text-center text-white/40 font-medium">P</th>
              <th className="py-3 px-3 text-center text-white/40 font-medium">W</th>
              <th className="py-3 px-3 text-center text-white/40 font-medium">L</th>
              <th className="py-3 px-3 text-center text-white/40 font-medium">T</th>
              <th className="py-3 px-3 text-center text-white/40 font-medium">NR</th>
              <th className="py-3 px-3 text-center text-white/40 font-medium">PTS</th>
              <th className="py-3 px-3 text-center text-white/40 font-medium">NRR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => {
              const pos = t.position || i + 1;
              return (
                <motion.tr
                  key={t.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    pos <= 4 ? "bg-blue-600/5" : ""
                  }`}
                >
                  <td className="py-3 px-3">
                    <span
                      className={`font-bold ${
                        pos <= 4 ? "text-cyan-400" : "text-white/40"
                      }`}
                    >
                      {pos}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-white">
                    {t.team?.name || "Unknown"}
                  </td>
                  <td className="py-3 px-3 text-center text-white/70">
                    {t.matchesPlayed || 0}
                  </td>
                  <td className="py-3 px-3 text-center text-green-400">
                    {t.wins || 0}
                  </td>
                  <td className="py-3 px-3 text-center text-red-400">
                    {t.losses || 0}
                  </td>
                  <td className="py-3 px-3 text-center text-white/50">
                    {t.ties || 0}
                  </td>
                  <td className="py-3 px-3 text-center text-white/50">
                    {t.noResult || 0}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-white">
                    {t.points || 0}
                  </td>
                  <td
                    className={`py-3 px-3 text-center font-medium ${
                      (t.nrr || 0) >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {(t.nrr || 0) >= 0 ? "+" : ""}
                    {(t.nrr || 0).toFixed(3)}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export { PointsTable };
