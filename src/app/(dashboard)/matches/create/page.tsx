"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
  X,
  Shield,
  MinusCircle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateTeamModal } from "@/components/teams/CreateTeamModal";
import { CreatePlayerModal } from "@/components/players/CreatePlayerModal";

interface Team {
  id: string;
  name: string;
  shortName?: string;
}

interface Player {
  id: string;
  name: string;
  role: string | null;
  shortName: string | null;
  teamId?: string;
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
  captainA: string;
  captainB: string;
  tossWinner: string;
  tossDecision: "bat" | "bowl";
  umpires: string[];
  scorers: string[];
  description: string;
  tournamentId: string;
}

interface ScorerUser {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
  role?: string | null;
}

const STEPS = [
  { id: 1, label: "Match Info", icon: Trophy },
  { id: 2, label: "Teams", icon: Swords },
  { id: 3, label: "Players", icon: Users },
  { id: 4, label: "Officials", icon: UserCheck },
  { id: 5, label: "Review", icon: ClipboardCheck },
];

const FORMAT_OVERS: Record<string, number> = {
  T20: 20,
  ODI: 50,
  T10: 10,
};

export default function CreateMatchPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [createTeamTarget, setCreateTeamTarget] = useState<"A" | "B">("A");

  const [playersA, setPlayersA] = useState<Player[]>([]);
  const [playersB, setPlayersB] = useState<Player[]>([]);
  const [playersALoading, setPlayersALoading] = useState(false);
  const [playersBLoading, setPlayersBLoading] = useState(false);

  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);
  const [createPlayerTarget, setCreatePlayerTarget] = useState<"A" | "B">("A");

  const [users, setUsers] = useState<ScorerUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [scorerQuery, setScorerQuery] = useState("");

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
    captainA: "",
    captainB: "",
    tossWinner: "",
    tossDecision: "bat",
    umpires: [],
    scorers: [],
    description: "",
    tournamentId: "",
  });

  const fetchTeams = useCallback(async () => {
    try {
      setTeamsLoading(true);
      const res = await fetch("/api/teams?limit=100");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams ?? data ?? []);
      }
    } catch {
      console.error("Failed to fetch teams");
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const refreshTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams?limit=100");
      if (res.ok) {
        const teams = await res.json();
        setTeams(teams.teams ?? teams ?? []);
      }
    } catch {
      console.error("Failed to refresh teams");
    }
  }, []);

  const fetchScorerUsers = useCallback(async (query: string = "") => {
    try {
      setUsersLoading(true);
      const res = await fetch(
        `/api/users/search${query ? `?q=${encodeURIComponent(query)}` : ""}`
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
      }
    } catch {
      console.error("Failed to fetch scorers");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScorerUsers();
  }, [fetchScorerUsers]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchScorerUsers(scorerQuery.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [scorerQuery, fetchScorerUsers]);

  const toggleScorer = (userId: string) => {
    updateForm(
      "scorers",
      formData.scorers.includes(userId)
        ? formData.scorers.filter((id) => id !== userId)
        : [...formData.scorers, userId]
    );
  };

  const scorerName = (id: string) =>
    users.find((u) => u.id === id)?.name ?? "Unknown";

  const fetchPlayers = useCallback(async (teamId: string, side: "A" | "B") => {
    const setter = side === "A" ? setPlayersA : setPlayersB;
    const loadingSetter = side === "A" ? setPlayersALoading : setPlayersBLoading;
    try {
      loadingSetter(true);
      setter([]);
      const res = await fetch(`/api/players?teamId=${teamId}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setter(data.players ?? data ?? []);
      }
    } catch {
      console.error(`Failed to fetch players for team ${side}`);
    } finally {
      loadingSetter(false);
    }
  }, []);

  useEffect(() => {
    if (formData.teamA) {
      fetchPlayers(formData.teamA, "A");
      setFormData((prev) => ({ ...prev, playersA: [], captainA: "" }));
    }
  }, [formData.teamA, fetchPlayers]);

  useEffect(() => {
    if (formData.teamB) {
      fetchPlayers(formData.teamB, "B");
      setFormData((prev) => ({ ...prev, playersB: [], captainB: "" }));
    }
  }, [formData.teamB, fetchPlayers]);

  const updateForm = (field: keyof MatchFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTeamCreated = useCallback(
    (team: { id: string; name: string; shortName?: string }) => {
      refreshTeams().then(() => {
        setFormData((prev) => ({
          ...prev,
          ...(createTeamTarget === "A"
            ? { teamA: team.id }
            : { teamB: team.id }),
        }));
      });
    },
    [createTeamTarget, refreshTeams]
  );

  const handlePlayerCreated = useCallback(
    (player: { id: string; name: string }) => {
      const targetTeam = createPlayerTarget === "A" ? formData.teamA : formData.teamB;
      if (targetTeam) {
        fetchPlayers(targetTeam, createPlayerTarget).then(() => {
          setFormData((prev) => ({
            ...prev,
            ...(createPlayerTarget === "A"
              ? { playersA: [...prev.playersA, player.id] }
              : { playersB: [...prev.playersB, player.id] }),
          }));
        });
      }
    },
    [createPlayerTarget, formData.teamA, formData.teamB, fetchPlayers]
  );

  const handleFormatChange = (format: string) => {
    const f = format as MatchFormData["format"];
    setFormData((prev) => ({
      ...prev,
      format: f,
      overs: FORMAT_OVERS[f] ?? prev.overs,
    }));
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
        return formData.teamA && formData.teamB && formData.teamA !== formData.teamB;
      case 3:
        return formData.playersA.length >= 2 && formData.playersB.length >= 2;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const scheduledAt =
        formData.date && formData.time
          ? new Date(`${formData.date}T${formData.time}`).toISOString()
          : formData.date
          ? new Date(`${formData.date}T00:00:00`).toISOString()
          : undefined;

      const payload: Record<string, unknown> = {
        name: formData.matchName,
        format: formData.format,
        totalOvers: formData.overs,
        scheduledAt,
        homeTeamId: formData.teamA,
        awayTeamId: formData.teamB,
        venue: formData.venue,
        tossWinner: formData.tossWinner || undefined,
        tossDecision: formData.tossDecision,
        description: formData.description || undefined,
        tournamentId: formData.tournamentId || undefined,
        playerIds: {
          teamA: formData.playersA,
          teamB: formData.playersB,
        },
        captainA: formData.captainA || undefined,
        captainB: formData.captainB || undefined,
        scorerIds: formData.scorers,
        umpires: formData.umpires,
      };

      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/matches/${data.match?.id ?? data.id ?? ""}`);
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.error || err.message || "Failed to create match";
        console.error("Match creation failed:", msg);
        alert(msg);
      }
    } catch (e) {
      console.error("Match creation error:", e);
      alert("Something went wrong while creating the match");
    } finally {
      setSubmitting(false);
    }
  };

  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "Unknown";

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
                          onChange={(e) => handleFormatChange(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-primary transition-colors"
                        >
                          <option value="T20" className="bg-background">T20</option>
                          <option value="ODI" className="bg-background">ODI</option>
                          <option value="T10" className="bg-background">T10</option>
                          <option value="Custom" className="bg-background">Custom</option>
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
                    <div className="md:col-span-2">
                      <label className="block text-sm text-muted mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => updateForm("description", e.target.value)}
                        placeholder="Add any notes about this match..."
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors resize-none"
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
                  {teamsLoading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-muted">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading teams...
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="text-center py-16">
                      <Swords className="w-12 h-12 text-muted mx-auto mb-3 opacity-50" />
                      <p className="text-muted mb-2">No teams found</p>
                      <p className="text-sm text-white/30 mb-4">
                        Create some teams first before setting up a match.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCreateTeamTarget("A");
                          setCreateTeamOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create Your First Team
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        {(["A", "B"] as const).map((side) => {
                          const teamId = side === "A" ? formData.teamA : formData.teamB;
                          const playerCount = side === "A" ? playersA.length : playersB.length;
                          return (
                            <div key={side}>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm text-muted">
                                  {side === "A" ? "Home Team" : "Away Team"}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCreateTeamTarget(side);
                                    setCreateTeamOpen(true);
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  Create Team
                                </button>
                              </div>
                              <div className="relative">
                                <select
                                  value={teamId}
                                  onChange={(e) => updateForm(side === "A" ? "teamA" : "teamB", e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-primary transition-colors"
                                >
                                  <option value="" className="bg-background">
                                    Select {side === "A" ? "home" : "away"} team
                                  </option>
                                  {teams
                                    .filter((t) => t.id !== (side === "A" ? formData.teamB : formData.teamA))
                                    .map((team) => (
                                      <option key={team.id} value={team.id} className="bg-background">
                                        {team.name}
                                      </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
                              </div>
                              {teamId && (
                                <p className="mt-2 text-xs text-white/40">
                                  {playerCount} players available
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {(formData.teamA || formData.teamB) && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                            <Swords className="w-8 h-8 text-primary mx-auto mb-2" />
                            <p className="text-white font-medium">
                              {formData.teamA ? teamName(formData.teamA) : "Home Team"}
                            </p>
                            <p className="text-sm text-muted">
                              {playersA.length} players available
                            </p>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                            <Swords className="w-8 h-8 text-accent mx-auto mb-2" />
                            <p className="text-white font-medium">
                              {formData.teamB ? teamName(formData.teamB) : "Away Team"}
                            </p>
                            <p className="text-sm text-muted">
                              {playersB.length} players available
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">
                      Select Players
                    </h2>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-white/60">
                        {teamName(formData.teamA)}:{" "}
                        <span className="text-white font-medium">
                          {formData.playersA.length}
                        </span>
                        /11
                      </span>
                      <span className="text-white/60">
                        {teamName(formData.teamB)}:{" "}
                        <span className="text-white font-medium">
                          {formData.playersB.length}
                        </span>
                        /11
                      </span>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {(["A", "B"] as const).map((team) => {
                      const teamId = team === "A" ? formData.teamA : formData.teamB;
                      const players = team === "A" ? playersA : playersB;
                      const loading = team === "A" ? playersALoading : playersBLoading;
                      const selected = team === "A" ? formData.playersA : formData.playersB;
                      const captain = team === "A" ? formData.captainA : formData.captainB;
                      const setCaptainField = team === "A" ? "captainA" : "captainB";

                      return (
                        <div key={team}>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-white">
                              {teamId ? teamName(teamId) : team === "A" ? "Home Team" : "Away Team"}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                selected.length >= 11 ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/50"
                              )}>
                                {selected.length}/11
                              </span>
                              {teamId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCreatePlayerTarget(team);
                                    setCreatePlayerOpen(true);
                                  }}
                                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add Player
                                </button>
                              )}
                            </div>
                          </div>
                          {loading ? (
                            <div className="flex items-center justify-center py-12 gap-2 text-muted">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading players...
                            </div>
                          ) : players.length === 0 ? (
                            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                              <Users className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                              <p className="text-sm text-muted mb-3">
                                {teamId
                                  ? "No players found for this team"
                                  : "Select a team first"}
                              </p>
                              {teamId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCreatePlayerTarget(team);
                                    setCreatePlayerOpen(true);
                                  }}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Player
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                              {players.map((player) => {
                                const isSelected = selected.includes(player.id);
                                const isCaptain = captain === player.id;
                                return (
                                   <motion.div
                                    key={player.id}
                                    role="button"
                                    tabIndex={0}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => togglePlayer(team, player.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        togglePlayer(team, player.id);
                                      }
                                    }}
                                    className={cn(
                                      "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer",
                                      isSelected
                                        ? "bg-primary/20 border-primary"
                                        : "bg-white/5 border-white/10 hover:bg-white/8"
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                                        isSelected
                                          ? "border-primary bg-primary"
                                          : "border-white/20"
                                      )}
                                    >
                                      {isSelected && (
                                        <Check className="w-3 h-3 text-white" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-white text-sm truncate">
                                          {player.name}
                                        </p>
                                        {isCaptain && (
                                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                            <Shield className="w-2.5 h-2.5" />
                                            C
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted">
                                        {player.role && <span>{player.role}</span>}
                                        {player.shortName && <span>#{player.shortName}</span>}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (captain === player.id) {
                                            updateForm(setCaptainField, "");
                                          } else {
                                            updateForm(setCaptainField, player.id);
                                          }
                                        }}
                                        className={cn(
                                          "p-1.5 rounded-lg transition-colors flex-shrink-0",
                                          isCaptain
                                            ? "bg-yellow-400/20 text-yellow-400"
                                            : "bg-white/5 text-muted hover:text-yellow-400"
                                        )}
                                        title={isCaptain ? "Remove as captain" : "Make captain"}
                                      >
                                        <Shield className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                   </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                          {formData.teamA && (
                            <option value={formData.teamA} className="bg-background">
                              {teamName(formData.teamA)}
                            </option>
                          )}
                          {formData.teamB && (
                            <option value={formData.teamB} className="bg-background">
                              {teamName(formData.teamB)}
                            </option>
                          )}
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
                      Umpires (enter names)
                    </label>
                    <div className="space-y-3">
                      {formData.umpires.map((umpire, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={umpire}
                            onChange={(e) => {
                              const updated = [...formData.umpires];
                              updated[idx] = e.target.value;
                              updateForm("umpires", updated);
                            }}
                            placeholder={`Umpire ${idx + 1}`}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                          />
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const updated = formData.umpires.filter((_, i) => i !== idx);
                              updateForm("umpires", updated);
                            }}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 text-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        </div>
                      ))}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => updateForm("umpires", [...formData.umpires, ""])}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/10 text-sm text-muted hover:text-white hover:border-white/20 transition-colors w-full justify-center"
                      >
                        <Plus className="w-4 h-4" />
                        Add Umpire
                      </motion.button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-2">
                      Scorers
                    </label>
                    <p className="text-xs text-muted/70 mb-3">
                      Assign scorers for this match. Leave empty to make the
                      creator the only scorer.
                    </p>
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        value={scorerQuery}
                        onChange={(e) => setScorerQuery(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {usersLoading ? (
                        <span className="text-xs text-muted flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Loading users...
                        </span>
                      ) : users.length === 0 ? (
                        <span className="text-xs text-muted">
                          No users found.
                        </span>
                      ) : (
                        users.map((u) => {
                          const selected = formData.scorers.includes(u.id);
                          return (
                            <motion.button
                              key={u.id}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => toggleScorer(u.id)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all",
                                selected
                                  ? "bg-accent/15 border-accent text-white"
                                  : "bg-white/5 border-white/10 text-muted hover:text-white"
                              )}
                            >
                              {selected && <Check className="w-3.5 h-3.5 text-accent" />}
                              {u.name || u.email}
                            </motion.button>
                          );
                        })
                      )}
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
                        value: `${formData.teamA ? teamName(formData.teamA) : "TBA"} vs ${formData.teamB ? teamName(formData.teamB) : "TBA"}`,
                      },
                      {
                        label: "Players",
                        value: `${formData.playersA.length} vs ${formData.playersB.length} selected`,
                      },
                      {
                        label: "Captains",
                        value: [
                          formData.captainA ? `${teamName(formData.teamA)}: ${playersA.find(p => p.id === formData.captainA)?.name || "Not set"}` : null,
                          formData.captainB ? `${teamName(formData.teamB)}: ${playersB.find(p => p.id === formData.captainB)?.name || "Not set"}` : null,
                        ].filter(Boolean).join(", ") || "Not set",
                      },
                      {
                        label: "Toss",
                        value: formData.tossWinner
                          ? `${teamName(formData.tossWinner)} chose to ${formData.tossDecision}`
                          : "Not set",
                      },
                      {
                        label: "Umpires",
                        value:
                          formData.umpires.filter(Boolean).length > 0
                            ? formData.umpires.filter(Boolean).join(", ")
                            : "Not set",
                      },
                      {
                        label: "Scorers",
                        value:
                          formData.scorers.length > 0
                            ? formData.scorers.map(scorerName).join(", ")
                            : "Creator only",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center py-3 border-b border-white/5"
                      >
                        <span className="text-muted">{item.label}</span>
                        <span className="text-white font-medium text-right">
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
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-success text-white hover:bg-success/80 transition-all",
                  submitting && "opacity-70 cursor-not-allowed"
                )}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {submitting ? "Creating..." : "Create Match"}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <CreateTeamModal
        isOpen={createTeamOpen}
        onClose={() => setCreateTeamOpen(false)}
        onTeamCreated={handleTeamCreated}
      />

      {createPlayerOpen && (createPlayerTarget === "A" ? formData.teamA : formData.teamB) && (
        <CreatePlayerModal
          isOpen={createPlayerOpen}
          onClose={() => setCreatePlayerOpen(false)}
          teamId={createPlayerTarget === "A" ? formData.teamA : formData.teamB}
          teamName={teamName(createPlayerTarget === "A" ? formData.teamA : formData.teamB)}
          onPlayerCreated={handlePlayerCreated}
        />
      )}
    </div>
  );
}
