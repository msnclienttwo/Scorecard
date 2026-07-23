"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

interface Match {
  id: string;
  name?: string;
  status?: string;
  scheduledAt?: string;
  venue?: string;
  homeTeam?: { name: string; shortName: string };
  awayTeam?: { name: string; shortName: string };
}

interface FixtureListProps {
  matches: Match[];
  title?: string;
}

export default function FixtureList({ matches, title = "Fixtures" }: FixtureListProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-white/30">
        No fixtures available
      </div>
    );
  }

  const grouped = matches.reduce((acc: Record<string, Match[]>, match) => {
    const date = match.scheduledAt
      ? new Date(match.scheduledAt).toLocaleDateString()
      : "TBD";
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dateMatches]) => (
        <motion.div
          key={date}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="text-sm font-medium text-white/40 mb-3">{date}</h4>
          <div className="space-y-2">
            {dateMatches.map((match) => (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-xs text-white/40">
                        {match.scheduledAt
                          ? new Date(match.scheduledAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "TBD"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-white">
                        {match.homeTeam?.shortName || "TBA"}
                      </span>
                      <span className="text-xs text-white/30">vs</span>
                      <span className="text-sm font-medium text-white">
                        {match.awayTeam?.shortName || "TBA"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {match.venue && (
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        <MapPin size={10} />
                        {match.venue}
                      </span>
                    )}
                    {match.status && (
                      <Badge
                        variant={
                          match.status === "LIVE"
                            ? "danger"
                            : match.status === "COMPLETED"
                            ? "success"
                            : "info"
                        }
                        className="text-[10px]"
                      >
                        {match.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export { FixtureList };
