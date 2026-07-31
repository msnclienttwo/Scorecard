"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Calendar,
  Users,
  ArrowLeft,
  Share2,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { PointsTable } from "@/components/tournament/PointsTable";
import { FixtureList } from "@/components/tournament/FixtureList";
import { SponsorGrid } from "@/components/tournament/SponsorGrid";
import { GalleryGrid } from "@/components/tournament/GalleryGrid";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { MatchCard } from "@/components/match/MatchCard";
import { cn } from "@/lib/utils";
import Link from "next/link";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function TournamentPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (!res.ok) throw new Error("Tournament not found");
      return res.json();
    },
  });

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "points", label: "Points Table" },
    { id: "fixtures", label: "Fixtures" },
    { id: "results", label: "Results" },
    { id: "teams", label: "Teams" },
    { id: "gallery", label: "Gallery" },
    { id: "sponsors", label: "Sponsors" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <EmptyState
        icon={Trophy}
        title="Tournament Not Found"
        description="This tournament could not be loaded."
        actionLabel="Back to Tournaments"
        onAction={() => window.history.back()}
      />
    );
  }

  const completedMatches = tournament.matches?.filter(
    (m: any) => m.status === "COMPLETED"
  ) || [];
  const upcomingMatches = tournament.matches?.filter(
    (m: any) => m.status === "SCHEDULED" || m.status === "LIVE"
  ) || [];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tournaments
        </Link>
      </motion.div>

      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 via-[#0a0f1a] to-cyan-500/20 border border-white/10 p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(37,99,235,0.15),transparent_50%)]" />
        <div className="relative flex flex-col md:flex-row items-start gap-6">
          {tournament.logo ? (
            <Image
              src={tournament.logo}
              alt={tournament.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
              <Trophy className="w-10 h-10" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
              <Badge
                variant={
                  tournament.status === "live"
                    ? "danger"
                    : tournament.status === "completed"
                    ? "success"
                    : "info"
                }
              >
                {tournament.status?.toUpperCase()}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                {new Date(tournament.endDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {tournament.teams?.length || 0} Teams
              </span>
              <Badge>{tournament.format}</Badge>
              <span>{tournament.totalOvers} Overs</span>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Matches", value: tournament.matches?.length || 0, icon: Trophy },
          { label: "Completed", value: completedMatches.length, icon: Star },
          { label: "Teams", value: tournament.teams?.length || 0, icon: Users },
          { label: "Upcoming", value: upcomingMatches.length, icon: Calendar },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <stat.icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-white/50 mt-1">{stat.label}</div>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Tournament Info
              </h3>
              {tournament.description && (
                <p className="text-white/60 mb-6">{tournament.description}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-white/50">Format</div>
                  <div className="text-sm font-medium text-white mt-1">
                    {tournament.format}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-white/50">Total Overs</div>
                  <div className="text-sm font-medium text-white mt-1">
                    {tournament.totalOvers}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-white/50">Start Date</div>
                  <div className="text-sm font-medium text-white mt-1">
                    {new Date(tournament.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-white/50">End Date</div>
                  <div className="text-sm font-medium text-white mt-1">
                    {new Date(tournament.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-white/50">Max Teams</div>
                  <div className="text-sm font-medium text-white mt-1">
                    {tournament.maxTeams || "No limit"}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-white/50">Visibility</div>
                  <div className="text-sm font-medium text-white mt-1">
                    {tournament.isPublic ? "Public" : "Private"}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "points" && (
            <PointsTable
              standings={tournament.standings || []}
              teams={tournament.teams || []}
            />
          )}

          {activeTab === "fixtures" && (
            <FixtureList
              matches={upcomingMatches}
              title="Upcoming Fixtures"
            />
          )}

          {activeTab === "results" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedMatches.map((match: any) => (
                <MatchCard key={match.id} match={match} />
              ))}
              {completedMatches.length === 0 && (
                <div className="col-span-full text-center text-white/30 py-12">
                  No completed matches yet
                </div>
              )}
            </div>
          )}

          {activeTab === "teams" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournament.teams?.map((tt: any) => (
                <Link key={tt.team?.id} href={`/teams/${tt.team?.id}`}>
                  <Card className="p-4 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${tt.team?.primaryColor || "#2563EB"}, ${tt.team?.secondaryColor || "#00D4FF"})`,
                        }}
                      >
                        {tt.team?.shortName?.substring(0, 3) || "?"}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {tt.team?.name}
                        </div>
                        <div className="text-xs text-white/50">
                          {tt.team?.city || tt.team?.country}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {activeTab === "gallery" && (
            <GalleryGrid items={tournament.gallery || []} />
          )}

          {activeTab === "sponsors" && (
            <SponsorGrid sponsors={tournament.sponsors || []} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
