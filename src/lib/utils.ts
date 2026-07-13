import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string into "Saturday, November 21, 2026"
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return "";
  try {
    const d = new Date(date);
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

/**
 * Format a date string into "Nov 21, 2026"
 */
export function formatDateShort(date: string | null | undefined): string {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Convert a 24-hour time string "17:30" to 12-hour "5:30 PM"
 */
export function formatTime12(time: string | null | undefined): string {
  if (!time) return "";
  const converted = to12Hour(time);
  if (!converted) return "";
  return `${converted.hour}:${converted.minute.toString().padStart(2, "0")} ${converted.period}`;
}

/**
 * Format date and time together: "Saturday, November 21, 2026 at 5:30 PM"
 */
export function formatDateTime(
  date: string | null | undefined,
  time: string | null | undefined
): string {
  const d = formatDate(date);
  const t = formatTime12(time);
  if (!d && !t) return "";
  if (!d) return t;
  if (!t) return d;
  return `${d} at ${t}`;
}

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isPast: boolean;
}

/**
 * Get countdown to a target date
 */
export function getCountdown(targetDate: string | null | undefined): CountdownResult {
  if (!targetDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isPast: true };
  }
  try {
    const target = new Date(targetDate).getTime();
    const now = Date.now();
    const total = target - now;

    if (total <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isPast: true };
    }

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total, isPast: false };
  } catch {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isPast: true };
  }
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if RSVP is closed based on deadline
 */
export function isRsvpClosed(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  try {
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
  } catch {
    return false;
  }
}

/**
 * Get RSVP status: "open" | "closed"
 */
export function getRsvpStatus(
  deadline: string | null | undefined
): "open" | "closed" {
  return isRsvpClosed(deadline) ? "closed" : "open";
}

/**
 * Format deadline using formatDateTime
 */
export function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return "";
  try {
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }) + " at " + d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Get event status based on date: "upcoming" | "ongoing" | "past"
 */
export function getEventStatus(
  date: string | null | undefined
): "upcoming" | "ongoing" | "past" {
  if (!date) return "upcoming";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "upcoming";
    const now = new Date();
    const eventStart = new Date(d);
    const eventEnd = new Date(d);
    eventEnd.setHours(23, 59, 59, 999);

    if (now < eventStart) return "upcoming";
    if (now > eventEnd) return "past";
    return "ongoing";
  } catch {
    return "upcoming";
  }
}

/**
 * Get time ago string from a date
 */
export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  } catch {
    return "";
  }
}

/**
 * Convert a date string to a datetime-local input value "YYYY-MM-DDTHH:mm"
 */
export function toDatetimeLocal(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

/**
 * Convert a datetime-local input value to an ISO string
 */
export function fromDatetimeLocal(localStr: string | null | undefined): string {
  if (!localStr) return "";
  try {
    const d = new Date(localStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString();
  } catch {
    return "";
  }
}

/**
 * Convert "17:30" to {hour: 5, minute: 30, period: "PM"}
 */
export function to12Hour(
  time24: string | null | undefined
): { hour: number; minute: number; period: "AM" | "PM" } | null {
  if (!time24) return null;
  try {
    const parts = time24.split(":");
    if (parts.length < 2) return null;
    let hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    if (isNaN(hour) || isNaN(minute)) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

    const period: "AM" | "PM" = hour >= 12 ? "PM" : "AM";
    if (hour === 0) hour = 12;
    else if (hour > 12) hour = hour - 12;

    return { hour, minute, period };
  } catch {
    return null;
  }
}

/**
 * Convert 12-hour components to 24-hour "17:30"
 */
export function to24Hour(
  hour12: number,
  minute: number,
  period: "AM" | "PM"
): string {
  let hour = hour12;
  if (period === "AM") {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour = hour + 12;
  }
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

/**
 * Round a minute value to the nearest 5
 */
export function roundTo5Min(minute: number): number {
  return Math.round(minute / 5) * 5;
}
