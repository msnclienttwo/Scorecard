"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Users,
  Trophy,
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";
import { CreateTeamModal } from "@/components/teams/CreateTeamModal";
import { EditTeamModal } from "@/components/teams/EditTeamModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

interface Team {
  id: string;
  name: string;
  shortName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  logo: string | null;
  _count?: { players?: number; homeMatches?: number; awayMatches?: number };
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fetchTeams = useCallback(async () => {
    const params = new URLSearchParams({ page: "1", limit: "100" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/teams?${params}`);
    if (!res.ok) throw new Error("Failed to fetch teams");
    const data = await res.json();
    return data.teams as Team[];
  }, [search]);

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams", search],
    queryFn: fetchTeams,
  });

  const deleteMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to delete team" }));
        throw new Error(err.error || "Failed to delete team");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({ message: "Team deleted successfully.", type: "success" });
      setDeleteTeam(null);
    },
    onError: (error: Error) => {
      toast({ message: error.message, type: "error" });
    },
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Teams</h1>
        <Button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Team
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : teams.length === 0 ? (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Users className="h-8 w-8 text-muted" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">No teams found</p>
          <p className="text-xs text-muted mb-4">
            {search ? "Try a different search term." : "Create your first team to get started!"}
          </p>
          {!search && (
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <PlusCircle className="h-4 w-4" />
              Create Team
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const playerCount = team._count?.players ?? 0;
            const matchCount = (team._count?.homeMatches ?? 0) + (team._count?.awayMatches ?? 0);
            return (
              <motion.div key={team.id} variants={item}>
                <div className="glass-card group rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <Link href={`/teams/${team.id}`} className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-white flex-shrink-0 hover:opacity-80 transition-opacity"
                      style={{
                        background: team.primaryColor && team.secondaryColor
                          ? `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`
                          : undefined,
                      }}
                    >
                      {team.logo ? (
                        <Image src={team.logo} alt={team.name} width={56} height={56} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        team.shortName || generateInitials(team.name)
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/teams/${team.id}`} className="truncate font-semibold text-foreground hover:text-primary transition-colors">
                        {team.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Users className="h-3 w-3" />
                          {playerCount} players
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Trophy className="h-3 w-3" />
                          {matchCount} matches
                        </span>
                      </div>
                      {(team.city || team.country) && (
                        <p className="mt-1 text-xs text-muted">{[team.city, team.country].filter(Boolean).join(", ")}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
                    <Link
                      href={`/teams/${team.id}`}
                      className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </Link>
                    <button
                      onClick={() => setEditTeam(team)}
                      className="flex items-center gap-1 text-xs text-muted hover:text-yellow-400 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTeam(team)}
                      className="flex items-center gap-1 text-xs text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <CreateTeamModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onTeamCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["teams"] });
        }}
      />

      <EditTeamModal
        isOpen={!!editTeam}
        onClose={() => setEditTeam(null)}
        team={editTeam}
      />

      <Modal isOpen={!!deleteTeam} onClose={() => setDeleteTeam(null)} title="Delete Team" size="sm">
        <p className="text-white/70 text-sm mb-6">
          Are you sure you want to delete <strong className="text-white">{deleteTeam?.name}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTeam(null)} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            disabled={deleteMutation.isPending}
            onClick={() => deleteTeam && deleteMutation.mutate(deleteTeam.id)}
          >
            Delete Team
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
