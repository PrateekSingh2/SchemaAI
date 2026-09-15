import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

/**
 * Formats a timestamp (epoch millis, ISO string, or Date) into a human-readable relative string:
 * - "just now" (< 45s)
 * - "2min", "15min"
 * - "1hr", "5hr"
 * - "1day", "2days", "5days"
 * - "1w", "2w"
 */
export function formatRelativeTime(timestamp?: number | string | Date | null): string {
  if (!timestamp) return "just now";

  let timeMillis: number;

  if (typeof timestamp === "number") {
    timeMillis = timestamp;
  } else if (timestamp instanceof Date) {
    timeMillis = timestamp.getTime();
  } else if (typeof timestamp === "string") {
    if (timestamp.toLowerCase() === "just now") {
      return "just now";
    }
    const parsedNum = Number(timestamp);
    if (!isNaN(parsedNum) && parsedNum > 1000000000) {
      timeMillis = parsedNum;
    } else {
      const parsedDate = new Date(timestamp).getTime();
      if (!isNaN(parsedDate)) {
        timeMillis = parsedDate;
      } else {
        return timestamp;
      }
    }
  } else {
    return "just now";
  }

  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timeMillis) / 1000));

  if (diffSec < 45) {
    return "just now";
  }
  if (diffSec < 3600) {
    const mins = Math.max(1, Math.floor(diffSec / 60));
    return `${mins}min`;
  }
  if (diffSec < 86400) {
    const hrs = Math.max(1, Math.floor(diffSec / 3600));
    return `${hrs}hr`;
  }
  const days = Math.floor(diffSec / 86400);
  if (days < 7) {
    return days === 1 ? "1day" : `${days}days`;
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks}w`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo`;
  }
  const years = Math.floor(days / 365);
  return `${years}y`;
}
