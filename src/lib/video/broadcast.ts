import type { AuthPayload } from "@/lib/auth";

/**
 * Who may manage a match's broadcast: the match creator or an admin
 * (mirrors the scoring access rules in src/lib/scoring.ts).
 */
export function canManageBroadcast(
  match: { createdBy: string },
  user: AuthPayload
): boolean {
  return (
    user.role === "SUPER_ADMIN" ||
    user.role === "TOURNAMENT_ADMIN" ||
    match.createdBy === user.sub
  );
}
