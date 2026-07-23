"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Trophy,
  Users,
  UserCheck,
  ClipboardCheck,
  Plus,
  MapPin,
  Calendar,
  Clock,
  Swords,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
  role: string;
}

interface MatchFormData {
  matchName: string;
  format: "T20" | "ODI" | "T10" | "Custom";
  overs: number;
  date: string;
  time: string;
  venue: string;
  teamA: string;
  teamB: string;
  playersA: string[];
  playersB: string[];
  tossWinner: string;
  tossDecision: "bat" | "bowl";
  umpires: string[];
}

const STEPS = [
  { id: 1, label: "Match Info", icon: Trophy },
  { id: 2, label: "Teams", icon: Swords },
  { id: 3, label: "Players", icon: Users },
  { id: 4, label: "Officials", icon: UserCheck },
  { id: 5, label: "Review", icon: ClipboardCheck },
];

const DUMMY_PLAYERS: Player[] = [
  { id: "1", name: "Virat Kohli", role: "Batsman" },
  { id: "2", name: "Rohit Sharma", role: "Batsman" },
  { id: "3", name: "Jasprit Bumrah", role: "Bowler" },
  { id: "4", name: "Ravindra Jadeja", role: "All-rounder" },
  { id: "5", name: "KL Rahul", role: "Wicketkeeper" },
  { id: "6", name: "Hardik Pandya", role: "All-rounder" },
  { id: "7", name: "Mohammed Shami", role: "Bowler" },
  { id: "8", name: "Shubman Gill", role: "Batsman" },
  { id: "9", name: "Suryakumar Yadav", role: "Batsman" },
  { id: "10", name: "Axar Patel", role: "All-rounder" },
  { id: "11", name: "Yuzvendra Chahal", role: "Bowler" },
];

export default function CreateMatchPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<MatchFormData>({
    matchName: "",
    format: "T20",
    overs: 20,
    date: "",
    time: "",
    venue: "",
    teamA: "",
    teamB: "",
    playersA: [],
    playersB: [],
    tossWinner: "",
    tossDecision: "bat",
    umpires: [],
  });

  const updateForm = (field: keyof MatchFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePlayer = (team: "A" | "B", playerId: string) => {
    const field = team === "A" ? "playersA" : "playersB";
    const current = formData[field];
    updateForm(
      field,
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId]
    );
  };

  const toggleUmpire = (umpire: string) => {
    updateForm(
      "umpires",
      formData.umpires.includes(umpire)
        ? formData.umpires.filter((u) => u !== umpire)
        : [...formData.umpires, umpire]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.matchName && formData.date && formData.venue;
      case 2:
        return formData.teamA && formData.teamB;
      case 3:
        return formData.playersA.length >= 2 && formData.playersB.length >= 2;
      case 4:
        return formData.umpires.length >= 1;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Create Match
          </h1>
          <p className="text-muted">
            Set up a new cricket match in minutes
          </p>
        </motion.div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isCompleted
                          ? "#22C55E"
                          : isActive
                          ? "#2563EB"
                          : "rgba(255,255,255,0.05)",
                      }}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
                        isCompleted
                          ? "border-success"
                          : isActive
                          ? "border-primary"
                          : "border-white/10"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            isActive ? "text-white" : "text-muted"
                          )}
                        />
                      )}
                    </motion.div>
                    <span
                      className={cn(
                        "text-xs hidden md:block",
                        isActive
                          ? "text-white font-medium"
                          : isCompleted
                          ? "text-success"
                          : "text-muted"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-12 md:w-20 h-0.5 mx-2 mt-[-20px] md:mt-0 rounded-full transition-colors",
                        step > s.id ? "bg-success" : "bg-white/10"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Match Information
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-muted mb-2">
                        Match Name
                      </label>
                      <input
                        type="text"
                        value={formData.matchName}
                        onChange={(e) => updateForm("matchName", e.target.value)}
                        placeholder="e.g. IPL Final 2025"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-2">
                        Format
                      </label>
                      <div className="relative">
                        <select
                          value={formData.format}
                          onChange={(e) => updateForm("format", e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-primary transition-colors"
                        >
                          <option value="T20" className="bg-background">
                            T20
                          </option>
                          <option value="ODI" className="bg-background">
                            ODI
                          </option>
                          <option value="T10" className="bg-background">
                            T10
                          </option>
                          <option value="Custom" className="bg-background">
                            Custom
                          </option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
                      </div>
                    </div>
                    {formData.format === "Custom" && (
                      <div>
                        <label className="block text-sm text-muted mb-2">
                          Overs
                        </label>
                        <input
                          type="number"
                          value={formData.overs}
                          onChange={(e) =>
                            updateForm("overs", parseInt(e.target.value) || 0)
                          }
                          min={1}
                          max={50}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-muted mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => updateForm("date", e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Time
                      </label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => updateForm("time", e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Venue
                      </label>
                      <input
                        type="text"
                        value={formData.venue}
                        onChange={(e) => updateForm("venue", e.target.value)}
                        placeholder="e.g. Wankhede Stadium, Mumbai"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Select Teams
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-muted mb-2">
                        Team A
                      </label>
                      <input
                        type="text"
                        value={formData.teamA}
                        onChange={(e) => updateForm("teamA", e.target.value)}
                        placeholder="Enter team name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-2">
                        Team B
                      </label>
                      <input
                        type="text"
                        value={formData.teamB}
                        onChange={(e) => updateForm("teamB", e.target.value)}
                        placeholder="Enter team name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                      <Swords className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-white font-medium">
                        {formData.teamA || "Team A"}
                      </p>
                      <p className="text-sm text-muted">
                        {formData.playersA.length} players
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                      <Swords className="w-8 h-8 text-accent mx-auto mb-2" />
                      <p className="text-white font-medium">
                        {formData.teamB || "Team B"}
                      </p>
                      <p className="text-sm text-muted">
                        {formData.playersB.length} players
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Select Players
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {(["A", "B"] as const).map((team) => (
                      <div key={team}>
                        <h3 className="text-sm font-medium text-muted mb-3">
                          {team === "A" ? formData.teamA || "Team A" : formData.teamB || "Team B"}{" "}
                          — Select 11
                        </h3>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                          {DUMMY_PLAYERS.map((player) => {
                            const selected =
                              team === "A"
                                ? formData.playersA.includes(player.id)
                                : formData.playersB.includes(player.id);
                            return (
                              <motion.button
                                key={player.id}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => togglePlayer(team, player.id)}
                                className={cn(
                                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                  selected
                                    ? "bg-primary/20 border-primary"
                                    : "bg-white/5 border-white/10 hover:bg-white/8"
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                    selected
                                      ? "border-primary bg-primary"
                                      : "border-white/20"
                                  )}
                                >
                                  {selected && (
                                    <Check className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-white text-sm">
                                    {player.name}
                                  </p>
                                  <p className="text-xs text-muted">
                                    {player.role}
                                  </p>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Officials & Toss
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-muted mb-2">
                        Toss Winner
                      </label>
                      <div className="relative">
                        <select
                          value={formData.tossWinner}
                          onChange={(e) =>
                            updateForm("tossWinner", e.target.value)
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-primary transition-colors"
                        >
                          <option value="" className="bg-background">
                            Select team
                          </option>
                          <option value={formData.teamA} className="bg-background">
                            {formData.teamA || "Team A"}
                          </option>
                          <option value={formData.teamB} className="bg-background">
                            {formData.teamB || "Team B"}
                          </option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-2">
                        Toss Decision
                      </label>
                      <div className="flex gap-3">
                        {(["bat", "bowl"] as const).map((decision) => (
                          <motion.button
                            key={decision}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => updateForm("tossDecision", decision)}
                            className={cn(
                              "flex-1 py-3 rounded-xl border text-sm font-medium transition-all capitalize",
                              formData.tossDecision === decision
                                ? "bg-primary/20 border-primary text-white"
                                : "bg-white/5 border-white/10 text-muted"
                            )}
                          >
                            {decision === "bat" ? "Bat First" : "Bowl First"}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">
                      Umpires
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        "K. Dharmasena",
                        "M. Erasmus",
                        "P. Reiffel",
                        "R. Tucker",
                        "N. Llong",
                        "S. Fry",
                      ].map((umpire) => {
                        const selected = formData.umpires.includes(umpire);
                        return (
                          <motion.button
                            key={umpire}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleUmpire(umpire)}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl border text-sm transition-all",
                              selected
                                ? "bg-primary/20 border-primary text-white"
                                : "bg-white/5 border-white/10 text-muted"
                            )}
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                selected
                                  ? "border-primary bg-primary"
                                  : "border-white/20"
                              )}
                            >
                              {selected && (
                                <Check className="w-2.5 h-2.5 text-white" />
                              )}
                            </div>
                            {umpire}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Review Match
                  </h2>
                  <div className="space-y-4">
                    {[
                      { label: "Match", value: formData.matchName || "Not set" },
                      { label: "Format", value: formData.format },
                      {
                        label: "Overs",
                        value:
                          formData.format === "Custom"
                            ? `${formData.overs} overs`
                            : formData.format,
                      },
                      { label: "Date", value: formData.date || "Not set" },
                      { label: "Time", value: formData.time || "Not set" },
                      { label: "Venue", value: formData.venue || "Not set" },
                      {
                        label: "Teams",
                        value: `${formData.teamA || "TBA"} vs ${formData.teamB || "TBA"}`,
                      },
                      {
                        label: "Players",
                        value: `${formData.playersA.length} vs ${formData.playersB.length} selected`,
                      },
                      {
                        label: "Toss",
                        value: formData.tossWinner
                          ? `${formData.tossWinner} chose to ${formData.tossDecision}`
                          : "Not set",
                      },
                      {
                        label: "Umpires",
                        value:
                          formData.umpires.length > 0
                            ? formData.umpires.join(", ")
                            : "Not set",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center py-3 border-b border-white/5"
                      >
                        <span className="text-muted">{item.label}</span>
                        <span className="text-white font-medium">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all",
                step === 1
                  ? "opacity-30 cursor-not-allowed text-muted"
                  : "text-white hover:bg-white/10"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </motion.button>

            {step < 5 ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep((s) => Math.min(5, s + 1))}
                disabled={!canProceed()}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all",
                  canProceed()
                    ? "bg-primary text-white hover:bg-primary/80 glow-primary"
                    : "bg-white/10 text-muted cursor-not-allowed"
                )}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-success text-white hover:bg-success/80 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Match
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
