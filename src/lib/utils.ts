import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conditional support, de-duplicating conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format an ISO date string as a long human-readable date, e.g. "Saturday, 15 June 2024". */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Format an ISO date string as a short date, e.g. "15 Jun 2024". */
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format an ISO datetime string as "15 Jun 2024, 3:30 PM". */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const datePart = formatDateShort(dateStr);
  const timePart = formatTime12(date.toTimeString().slice(0, 5));
  return `${datePart}, ${timePart}`;
}

/** Convert a 24-hour "HH:MM" string to 12-hour "h:MM AM/PM". */
export function to12Hour(time24: string | null | undefined): string {
  if (!time24) return "";
  const match = /^(\d{1,2}):(\d{2})$/.exec(time24);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
}

/** Convert a 12-hour "h:MM AM/PM" string to 24-hour "HH:MM". */
export function to24Hour(time12: string | null | undefined): string {
  if (!time12) return "";
  const match = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(time12);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === "AM" && hours === 12) hours = 0;
  if (period === "PM" && hours !== 12) hours += 12;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

/** Format a "HH:MM" 24-hour string as 12-hour with AM/PM. */
export function formatTime12(time24: string | null | undefined): string {
  return to12Hour(time24);
}

/** Round a Date to the nearest 5-minute interval. */
export function roundTo5Min(date: Date): Date {
  const ms = 5 * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

/**
 * Returns a countdown object for the given target date.
 * Returns all-zero when the date has passed or is invalid.
 */
export function getCountdown(targetDate: string | Date | null | undefined): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
} {
  const zero = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  if (!targetDate) return zero;
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) return zero;

  const now = new Date().getTime();
  const diff = target.getTime() - now;
  if (diff <= 0) return zero;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isPast: false,
  };
}

/** Check whether RSVP is closed based on a deadline. */
export function isRsvpClosed(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const date = new Date(deadline);
  if (isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

/** Generate a URL-safe username from a display name. */
export function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

/** Truncate a string to `max` characters, appending an ellipsis if shortened. */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + "…";
}
