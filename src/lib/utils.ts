import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function to12Hour(time24: string | null | undefined): string {
  if (!time24) return "";
  const match = time24.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
}

export function to24Hour(time12: string | null | undefined): string {
  if (!time12) return "";
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

export function formatTime12(time24: string | null | undefined): string {
  return to12Hour(time24);
}

export function formatDateTime(dateStr: string | null | undefined, timeStr: string | null | undefined): string {
  const date = formatDateShort(dateStr);
  const time = to12Hour(timeStr);
  if (date && time) return `${date} at ${time}`;
  return date || time || "";
}

export function roundTo5Min(time24: string | null | undefined): string {
  if (!time24) return "";
  const match = time24.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  let minutes = parseInt(match[2], 10);
  minutes = Math.round(minutes / 5) * 5;
  if (minutes === 60) {
    minutes = 0;
    hours = (hours + 1) % 24;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
  if (isNaN(target)) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
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
  const target = new Date(deadline).getTime();
  if (isNaN(target)) return false;
  return Date.now() > target;
}

export function generateUsername(name: string): string {
  if (!name) return "";
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}_${suffix}`;
}

export function truncate(str: string, maxLen: number): string {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 1) + "…";
}
