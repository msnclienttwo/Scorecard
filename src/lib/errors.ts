import { Prisma } from "@prisma/client";

const FALLBACK = "Unable to record this ball. Please try again.";

/**
 * Converts an unknown thrown error into a safe, user-friendly message.
 *
 * Domain errors thrown by the scoring service (plain `Error`s) are surfaced
 * verbatim because they already describe the problem in scorer-friendly terms
 * (e.g. "A bowler cannot bowl two consecutive overs."). Low-level Prisma and
 * infrastructure errors are logged server-side and replaced with a generic
 * message so a scorer never sees a raw `Invalid prisma.over.create()`.
 */
export function toUserError(error: unknown): { message: string; status: number } {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientInitializationError
  ) {
    console.error("[ScoreBolt] Prisma error:", error.message);
    return { message: FALLBACK, status: 500 };
  }

  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }

  return { message: "Something went wrong. Please try again.", status: 500 };
}
