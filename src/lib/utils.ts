import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: string | Date,
  formatStr: string = "MMM dd, yyyy"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr);
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "hh:mm a");
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM dd, yyyy hh:mm a");
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatOvers(balls: number): string {
  const overs = Math.floor(balls / 6);
  const remaining = balls % 6;
  if (remaining === 0) return overs.toString();
  return `${overs}.${remaining}`;
}

/**
 * Formats a stored overs value into cricket notation ("3.2"). Stored values
 * are cricket-notation floats (e.g. `2.3` = 2 overs + 3 balls). Legacy rows
 * written as `balls / 6` (e.g. `0.3333333333333333`) are also handled.
 */
export function formatStoredOvers(overs: number): string {
  if (!Number.isFinite(overs) || overs <= 0) return "0";
  const full = Math.floor(overs + 1e-9);
  const tenths = (overs - full) * 10;
  const isCricketNotation = Math.abs(tenths - Math.round(tenths)) < 1e-6;
  const balls = isCricketNotation
    ? full * 6 + Math.round(tenths)
    : Math.round(overs * 6);
  return formatOvers(balls);
}

export function calculateStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return (runs / balls) * 100;
}

export function calculateEconomy(runs: number, overs: number): number {
  if (overs === 0) return 0;
  return runs / overs;
}

export function calculateRunRate(runs: number, overs: number): number {
  if (overs === 0) return 0;
  return runs / overs;
}

export function parseOversToBalls(overs: number): number {
  const fullOvers = Math.floor(overs);
  const remainingBalls = Math.round((overs - fullOvers) * 10);
  return fullOvers * 6 + remainingBalls;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function generateInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
