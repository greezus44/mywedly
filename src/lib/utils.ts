import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", opts ?? { weekday: "short", month: "long", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  return formatDate(dateStr, { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime12(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  const converted = to12Hour(timeStr);
  return converted;
}

export function to12Hour(timeStr: string): string {
  const cleaned = timeStr.trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return cleaned;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const existing = match[3]?.toLowerCase();
  if (existing) {
    return `${hour}:${minute} ${existing}`;
  }
  const period = hour >= 12 ? "pm" : "am";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${period}`;
}

export function to24Hour(timeStr: string): string {
  const cleaned = timeStr.trim().toLowerCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (!match) return cleaned;
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const period = match[3];
  if (period === "pm" && hour < 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export function roundTo5Min(timeStr: string): string {
  const cleaned = timeStr.trim().toLowerCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (!match) return cleaned;
  let hour = parseInt(match[1], 10);
  let minute = parseInt(match[2], 10);
  const period = match[3];
  if (period) {
    if (period === "pm" && hour < 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
  }
  minute = Math.round(minute / 5) * 5;
  if (minute === 60) {
    minute = 0;
    hour += 1;
  }
  if (hour === 24) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function getCountdown(targetDate: string | null | undefined): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
} {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, isPast: false };
}

export function isRsvpClosed(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const d = new Date(deadline).getTime();
  if (isNaN(d)) return false;
  return Date.now() > d;
}

const ADJECTIVES = ["Joyful", "Bright", "Golden", "Silver", "Radiant", "Lucky", "Charming", "Sweet"];
const NOUNS = ["Couple", "Guest", "Heart", "Star", "Dove", "Rose", "Bell", "Ring"];

export function generateUsername(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^[^a-z]+/, "")
    .slice(0, 12);
  if (!base) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)].toLowerCase();
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)].toLowerCase();
    return `${adj}${noun}${Math.floor(Math.random() * 1000)}`;
  }
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${base}${suffix}`;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  if (maxLen <= 3) return str.slice(0, maxLen);
  return str.slice(0, maxLen - 3) + "...";
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}
