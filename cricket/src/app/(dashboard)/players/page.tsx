"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  User,
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
  Filter,
} from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";
import { CreatePlayerModal } from "@/components/players/CreatePlayerModal";
import { EditPlayerModal } from "@/components/players/EditPlayerModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

const roles = ["All", "Batsman", "Bowler", "All Rounder", "Wicket Keeper"] as const;

interface Player {
  id: string;
  name: string;
  shortName: string | null;
  role: string | null;
  nationality: string | null;
  battingStyle: string | null;
  bowlingStyle: string | null;
  dateOfBirth: string | null;
  image: string | null;
  team?: { id: string; name: string } | null;
}

interface Team {
  id: string;
  name: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState<(typeof roles)[number]>("All");
  const [teamFilter, setTeamFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createTeamId, setCreateTeamId] = useState("");
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deletePlayer, setDeletePlayer] = useState<Player | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams?limit=200");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.teams ?? []) as Team[];
    },
  });

  const fetchPlayers = useCallback(async () => {
    const params = new URLSearchParams({ page: "1", limit: "200" });
    if (search) params.set("search", search);
    if (activeRole !== "All") params.set("role", activeRole);
    if (teamFilter) params.set("teamId", teamFilter);
    const res = await fetch(`/api/players?${params}`);
    if (!res.ok) throw new Error("Failed to fetch players");
    const data = await res.json();
    return data.players as Player[];
  }, [search, activeRole, teamFilter]);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players", search, activeRole, teamFilter],
    queryFn: fetchPlayers,
  });

  const deleteMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const res = await fetch(`/api/players/${playerId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to delete player" }));
        throw new Error(err.error || "Failed to delete player");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast({ message: "Player deleted successfully.", type: "success" });
      setDeletePlayer(null);
    },
    onError: (error: Error) => {
      toast({ message: error.message, type: "error" });
    },
  });

  const handleAddPlayer = (teamId?: string) => {
    if (teamId) {
      setCreateTeamId(teamId);
    } else if (teams.length > 0) {
      setCreateTeamId(teams[0].id);
    }
    setCreateOpen(true);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Players</h1>
        <Button onClick={() => handleAddPlayer()} className="inline-flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Player
        </Button>
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 py-2.5 px-3 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50 appearance-none"
          >
            <option value="" className="bg-[#0d1320]">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#0d1320]">{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                activeRole === role
                  ? "bg-primary/20 text-primary"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : players.length === 0 ? (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <User className="h-8 w-8 text-muted" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">No players found</p>
          <p className="text-xs text-muted mb-4">
            {search || activeRole !== "All" || teamFilter
              ? "Try adjusting your filters."
              : "Add your first player to get started!"}
          </p>
          {!search && activeRole === "All" && !teamFilter && (
            <Button onClick={() => handleAddPlayer()} size="sm">
              <PlusCircle className="h-4 w-4" />
              Add Player
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <motion.div key={player.id} variants={item}>
              <div className="glass-card group rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <Link href={`/players/${player.id}`} className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white flex-shrink-0 hover:opacity-80 transition-opacity">
                    {player.image ? (
                      <img src={player.image} alt={player.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      generateInitials(player.name)
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/players/${player.id}`} className="truncate font-semibold text-foreground hover:text-primary transition-colors">
                      {player.name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2">
                      {player.team && <span className="text-xs text-muted">{player.team.name}</span>}
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {player.role || "N/A"}
                      </span>
                      {player.shortName && (
                        <span className="text-xs text-muted">#{player.shortName}</span>
                      )}
                    </div>
                    {player.nationality && (
                      <p className="mt-1 text-xs text-muted">{player.nationality}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
                  <Link
                    href={`/players/${player.id}`}
                    className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Profile
                  </Link>
                  <button
                    onClick={() => setEditPlayer(player)}
                    className="flex items-center gap-1 text-xs text-muted hover:text-yellow-400 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletePlayer(player)}
                    className="flex items-center gap-1 text-xs text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {createOpen && createTeamId && (
        <CreatePlayerModal
          isOpen={createOpen}
          onClose={() => {
            setCreateOpen(false);
            setCreateTeamId("");
          }}
          teamId={createTeamId}
          teamName={teams.find((t) => t.id === createTeamId)?.name}
        />
      )}

      <EditPlayerModal
        isOpen={!!editPlayer}
        onClose={() => setEditPlayer(null)}
        player={editPlayer}
      />

      <Modal isOpen={!!deletePlayer} onClose={() => setDeletePlayer(null)} title="Delete Player" size="sm">
        <p className="text-white/70 text-sm mb-6">
          Are you sure you want to delete <strong className="text-white">{deletePlayer?.name}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeletePlayer(null)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            disabled={deleteMutation.isPending}
            onClick={() => deletePlayer && deleteMutation.mutate(deletePlayer.id)}
          >
            Delete Player
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
