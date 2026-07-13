import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely (later classes win, conflicts resolved).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function parseDate(date: string | null | undefined): Date | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Format a date string as "Saturday, November 21, 2026".
 */
export function formatDate(date: string | null | undefined): string {
  const d = parseDate(date);
  if (!d) return "";
  return `${DAYS_LONG[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Format a date string as "Nov 21, 2026".
 */
export function formatDateShort(date: string | null | undefined): string {
  const d = parseDate(date);
  if (!d) return "";
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Convert a 24-hour "HH:MM" string to 12-hour "h:mm AM/PM".
 * Examples: "17:30" → "5:30 PM", "09:00" → "9:00 AM", "12:00" → "12:00 PM".
 */
export function formatTime12(time: string | null | undefined): string {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length < 2) return "";
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  if (isNaN(hour) || isNaN(minute)) return "";
  const period = hour >= 12 ? "PM" : "AM";
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}

/**
 * Format a date + time as "Saturday, November 21, 2026 at 5:30 PM".
 */
export function formatDateTime(
  date: string | null | undefined,
  time: string | null | undefined,
): string {
  const dateStr = formatDate(date);
  const timeStr = formatTime12(time);
  if (!dateStr && !timeStr) return "";
  if (!timeStr) return dateStr;
  if (!dateStr) return timeStr;
  return `${dateStr} at ${timeStr}`;
}

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isPast: boolean;
}

/**
 * Get a countdown to a target date string.
 */
export function getCountdown(targetDate: string | null | undefined): Countdown {
  const zero: Countdown = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    isPast: true,
  };
  if (!targetDate) return zero;
  const target = new Date(targetDate).getTime();
  if (isNaN(target)) return zero;
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return { ...zero, isPast: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, total: diff, isPast: false };
}

// ---------------------------------------------------------------------------
// RSVP helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the RSVP deadline has passed.
 */
export function isRsvpClosed(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const d = new Date(deadline).getTime();
  if (isNaN(d)) return false;
  return Date.now() > d;
}

export type RsvpStatus = "open" | "closing-soon" | "closed";

/**
 * Get a human-friendly RSVP status.
 * - "closed": past deadline
 * - "closing-soon": within 3 days of deadline
 * - "open": otherwise
 */
export function getRsvpStatus(deadline: string | null | undefined): RsvpStatus {
  if (!deadline) return "open";
  const d = new Date(deadline).getTime();
  if (isNaN(d)) return "open";
  const now = Date.now();
  if (now > d) return "closed";
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  if (d - now < threeDays) return "closing-soon";
  return "open";
}

/**
 * Format the RSVP deadline as a full date-time string.
 */
export function formatDeadline(deadline: string | null | undefined): string {
  return formatDateTime(deadline, null);
}

// ---------------------------------------------------------------------------
// Event status
// ---------------------------------------------------------------------------

export type EventStatus = "upcoming" | "today" | "past" | "no-date";

/**
 * Determine whether an event is upcoming, today, or past based on its date.
 */
export function getEventStatus(date: string | null | undefined): EventStatus {
  if (!date) return "no-date";
  const d = parseDate(date);
  if (!d) return "no-date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(d);
  eventDay.setHours(0, 0, 0, 0);
  if (eventDay.getTime() === today.getTime()) return "today";
  if (eventDay.getTime() > today.getTime()) return "upcoming";
  return "past";
}

// ---------------------------------------------------------------------------
// Time ago
// ---------------------------------------------------------------------------

/**
 * Format how long ago a date string was, e.g. "3 hours ago", "2 days ago".
 */
export function timeAgo(dateStr: string | null | undefined): string {
  const d = parseDate(dateStr);
  if (!d) return "";
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

// ---------------------------------------------------------------------------
// Datetime-local helpers
// ---------------------------------------------------------------------------

/**
 * Convert an ISO date string to a value usable by <input type="datetime-local">.
 * e.g. "2026-11-21T17:30:00" → "2026-11-21T17:30"
 */
export function toDatetimeLocal(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/**
 * Convert a datetime-local input value back to an ISO string.
 * e.g. "2026-11-21T17:30" → "2026-11-21T17:30:00.000Z"
 */
export function fromDatetimeLocal(localStr: string | null | undefined): string {
  if (!localStr) return "";
  const d = new Date(localStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// 12-hour / 24-hour conversion
// ---------------------------------------------------------------------------

export interface Time12 {
  hour: number;
  minute: number;
  period: "AM" | "PM";
}

/**
 * Convert a 24-hour "HH:MM" string to a {hour, minute, period} object.
 * "17:30" → {hour: 5, minute: 30, period: "PM"}
 */
export function to12Hour(time24: string | null | undefined): Time12 | null {
  if (!time24) return null;
  const parts = time24.split(":");
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return { hour, minute: m, period };
}

/**
 * Convert 12-hour components to a 24-hour "HH:MM" string.
 * (5, 30, "PM") → "17:30", (12, 0, "AM") → "00:00", (12, 0, "PM") → "12:00"
 */
export function to24Hour(
  hour12: number,
  minute: number,
  period: "AM" | "PM",
): string {
  let h = hour12;
  if (period === "AM") {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return `${h.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

/**
 * Round a minute value to the nearest 5.
 */
export function roundTo5Min(minute: number): number {
  return Math.round(minute / 5) * 5;
}

// ---------------------------------------------------------------------------
// Debounce
// ---------------------------------------------------------------------------

/**
 * Simple debounce. Returns a function that delays invoking `fn` until
 * `wait` ms have elapsed since the last call.
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
