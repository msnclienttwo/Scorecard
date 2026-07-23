"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Innings {
  id: number;
  team: string;
  runs: number;
  wickets: number;
  overs: number;
  extras: number;
}

const innings: Innings[] = [
  { id: 1, team: "Mumbai Indians", runs: 187, wickets: 6, overs: 20, extras: 12 },
  { id: 2, team: "Chennai Super Kings", runs: 156, wickets: 4, overs: 15.3, extras: 8 },
];

const battingCard1 = [
  { no: 1, name: "Rohit Sharma", dismissal: "c Jadeja b Bumrah", runs: 48, balls: 32, fours: 5, sixes: 2, sr: 150.00 },
  { no: 2, name: "Ishan Kishan", dismissal: "c Dhoni b Chahar", runs: 23, balls: 18, fours: 3, sixes: 0, sr: 127.78 },
  { no: 3, name: "Suryakumar Yadav", dismissal: "c Conway b Jadeja", runs: 67, balls: 41, fours: 7, sixes: 3, sr: 163.41 },
  { no: 4, name: "Tilak Varma", dismissal: "not out", runs: 34, balls: 24, fours: 2, sixes: 2, sr: 141.67 },
  { no: 5, name: "Hardik Pandya", dismissal: "c Gaikwad b Pathirana", runs: 8, balls: 5, fours: 1, sixes: 0, sr: 160.00 },
  { no: 6, name: "Tim David", dismissal: "not out", runs: 5, balls: 3, fours: 0, sixes: 0, sr: 166.67 },
];

const bowlingCard1 = [
  { name: "Jasprit Bumrah", overs: 4, maidens: 0, runs: 34, wickets: 2, econ: 8.50, wides: 2, noBalls: 0 },
  { name: "Deepak Chahar", overs: 4, maidens: 0, runs: 42, wickets: 1, econ: 10.50, wides: 1, noBalls: 1 },
  { name: "Ravindra Jadeja", overs: 4, maidens: 0, runs: 38, wickets: 1, econ: 9.50, wides: 0, noBalls: 0 },
  { name: "Moeen Ali", overs: 3, maidens: 0, runs: 30, wickets: 0, econ: 10.00, wides: 0, noBalls: 0 },
  { name: "Matheesha Pathirana", overs: 4, maidens: 0, runs: 31, wickets: 2, econ: 7.75, wides: 1, noBalls: 0 },
  { name: "Tushar Deshpande", overs: 1, maidens: 0, runs: 14, wickets: 0, econ: 14.00, wides: 0, noBalls: 0 },
];

const fallOfWickets1 = [
  { wicket: 1, score: "42/1", batsman: "Ishan Kishan", over: 5.2 },
  { wicket: 2, score: "98/2", batsman: "Rohit Sharma", over: 11.4 },
  { wicket: 3, score: "142/3", batsman: "Suryakumar Yadav", over: 16.1 },
  { wicket: 4, score: "158/4", batsman: "Hardik Pandya", over: 17.5 },
  { wicket: 5, score: "170/5", batsman: "Tim David", over: 18.4 },
  { wicket: 6, score: "187/6", batsman: "Unknown", over: 20.0 },
];

const extrasBreakdown1 = [
  { type: "Wides", count: 4 },
  { type: "No Balls", count: 1 },
  { type: "Byes", count: 3 },
  { type: "Leg Byes", count: 4 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

export default function ScorecardPage() {
  const [activeInnings, setActiveInnings] = useState(0);
  const current = innings[activeInnings];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex gap-2 overflow-x-auto pb-2">
        {innings.map((inn, idx) => (
          <motion.button
            key={inn.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveInnings(idx)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              activeInnings === idx
                ? "bg-primary text-white glow-primary"
                : "bg-white/5 text-muted border border-white/10"
            )}
          >
            {inn.team} — {inn.runs}/{inn.wickets}
          </motion.button>
        ))}
      </div>

      <motion.div
        variants={rowVariants}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-white">{current.team}</h2>
          <p className="text-2xl font-bold gradient-text">
            {current.runs}/{current.wickets}
          </p>
        </div>
        <p className="text-sm text-muted">
          Overs: {current.overs} &middot; Extras: {current.extras} &middot; RR:{" "}
          {(current.runs / current.overs).toFixed(2)}
        </p>
      </motion.div>

      <motion.div
        variants={rowVariants}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Batting</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs text-muted font-medium">
                  Batsman
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted font-medium">
                  Dismissal
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted font-medium">
                  R
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted font-medium">
                  B
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted font-medium">
                  4s
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted font-medium">
                  6s
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted font-medium">
                  SR
                </th>
              </tr>
            </thead>
            <tbody>
              {battingCard1.map((b) => (
                <tr
                  key={b.no}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{b.name}</span>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {b.dismissal}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-semibold">
                    {b.runs}
                  </td>
                  <td className="px-4 py-3 text-right text-muted">{b.balls}</td>
                  <td className="px-4 py-3 text-right text-muted">{b.fours}</td>
                  <td className="px-4 py-3 text-right text-muted">{b.sixes}</td>
                  <td className="px-4 py-3 text-right text-accent">
                    {b.sr.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div
        variants={rowVariants}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Bowling</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs text-muted font-medium">
                  Bowler
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted font-medium">
                  O
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted font-medium">
                  M
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted font-medium">
                  R
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted font-medium">
                  W
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted font-medium">
                  Econ
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted font-medium">
                  WD
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted font-medium">
                  NB
                </th>
              </tr>
            </thead>
            <tbody>
              {bowlingCard1.map((b) => (
                <tr
                  key={b.name}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{b.name}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted">{b.overs}</td>
                  <td className="px-4 py-3 text-right text-muted">
                    {b.maidens}
                  </td>
                  <td className="px-4 py-3 text-right text-white">{b.runs}</td>
                  <td className="px-4 py-3 text-right text-danger font-semibold">
                    {b.wickets}
                  </td>
                  <td className="px-4 py-3 text-right text-accent">
                    {b.econ.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted">{b.wides}</td>
                  <td className="px-4 py-3 text-right text-muted">
                    {b.noBalls}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          variants={rowVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-white mb-4">Fall of Wickets</h3>
          <div className="space-y-3">
            {fallOfWickets1.map((fow) => (
              <div
                key={fow.wicket}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center text-xs text-danger font-bold">
                  {fow.wicket}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{fow.batsman}</p>
                  <p className="text-xs text-muted">
                    Score: {fow.score} &middot; Over: {fow.over}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={rowVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-white mb-4">Extras</h3>
          <div className="space-y-3">
            {extrasBreakdown1.map((e) => (
              <div
                key={e.type}
                className="flex items-center justify-between py-2 border-b border-white/5"
              >
                <span className="text-sm text-muted">{e.type}</span>
                <span className="text-sm text-white font-semibold">{e.count}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-white font-medium">Total Extras</span>
              <span className="text-sm text-accent font-bold">
                {extrasBreakdown1.reduce((s, e) => s + e.count, 0)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
